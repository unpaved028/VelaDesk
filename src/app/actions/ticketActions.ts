'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { SubmitReplySchema, UpdateStatusSchema, createErrorResponse } from '@/lib/validation/schemas';
import { ZodError } from 'zod';

export async function submitTicketReply(ticketId: number, body: string, type: 'PUBLIC' | 'INTERNAL') {
  try {
    // 11.2: Server Side Validation using Zod
    const validation = SubmitReplySchema.safeParse({ ticketId, body, type });
    
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0]?.message || 'Invalid input');
    }

    const { ticketId: validatedId, body: validatedBody, type: validatedType } = validation.data;
    const isInternal = validatedType === 'INTERNAL';

    // Hardcode user and tenant for MVP (Simulating session)
    const firstTenant = await prisma.tenant.findFirst();
    const currentTenantId = firstTenant?.id || '';
    if (!currentTenantId) return createErrorResponse('No active tenant found');

    let agent = await prisma.user.findFirst({ where: { tenantId: currentTenantId, role: 'AGENT' }});
    
    if (!agent) {
        agent = await prisma.user.create({
            data: {
                tenantId: currentTenantId,
                email: 'agent@example.com',
                name: 'Demo Agent',
                role: 'AGENT'
            }
        });
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id: validatedId, tenantId: currentTenantId }
    });

    if (!ticket) return createErrorResponse('Ticket not found');

    const transactions: any[] = [];

    transactions.push(
      prisma.message.create({
        data: {
          ticketId: validatedId,
          body: validatedBody,
          isInternal,
          authorId: agent.id
        }
      })
    );

    const isStatusChangeNeeded = ticket.status === 'NEW' && agent.role === 'AGENT';
    const isAssignNeeded = !ticket.assignedAgentId && agent.role === 'AGENT';

    const updateData: any = {};
    if (isStatusChangeNeeded) updateData.status = 'OPEN';
    if (isAssignNeeded) updateData.assignedAgentId = agent.id;

    if (Object.keys(updateData).length > 0) {
      transactions.push(
        prisma.ticket.update({
          where: { id: ticket.id },
          data: updateData
        })
      );

      if (isStatusChangeNeeded) {
        transactions.push(
          prisma.ticketEvent.create({
            data: {
              tenantId: currentTenantId,
              ticketId: ticket.id,
              userId: agent.id,
              action: 'STATUS_CHANGED',
              oldValue: ticket.status,
              newValue: 'OPEN'
            }
          })
        );
      }

      if (isAssignNeeded) {
        transactions.push(
          prisma.ticketEvent.create({
            data: {
              tenantId: currentTenantId,
              ticketId: ticket.id,
              userId: agent.id,
              action: 'ASSIGNED',
              oldValue: null,
              newValue: agent.id
            }
          })
        );
      }
    }

    const results = await prisma.$transaction(transactions);
    const message = results[0];

    if (!isInternal) {
      // Background execution of email sending
      import('@/lib/services/emailSender').then(({ sendTicketReplyNotification }) => {
        sendTicketReplyNotification(
          ticket.id,
          currentTenantId,
          ticket.workspaceId,
          ticket.requesterId,
          validatedBody
        ).catch((err) => console.error('Email sending failed:', err));
      });
    }

    const totalMessages = await prisma.message.count({ where: { ticketId: validatedId } });
    if (totalMessages === 6) {
      import('./aiActions').then(({ generateAutoSummary }) => {
        generateAutoSummary(validatedId).catch((err) => console.error('Auto summary failed:', err));
      });
    }

    revalidatePath('/');
    return { success: true, data: message, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createErrorResponse(message);
  }
}

export async function updateTicketStatus(ticketId: number, status: 'OPEN' | 'RESOLVED' | 'CLOSED' | 'PENDING') {
  try {
    const validation = UpdateStatusSchema.safeParse({ ticketId, status });
    
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0]?.message || 'Invalid status update');
    }

    const firstTenant = await prisma.tenant.findFirst();
    const currentTenantId = firstTenant?.id || '';
    if (!currentTenantId) return createErrorResponse('No active tenant found');

    let agent = await prisma.user.findFirst({ where: { tenantId: currentTenantId, role: 'AGENT' }});
    if (!agent) {
       agent = await prisma.user.create({
          data: { tenantId: currentTenantId, email: 'agent@example.com', name: 'Demo Agent', role: 'AGENT' }
       });
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id: validation.data.ticketId, tenantId: currentTenantId }
    });

    if (!ticket) return createErrorResponse('Ticket not found');

    const oldStatus = ticket.status;
    const newStatus = validation.data.status;

    if (oldStatus !== newStatus) {
      await prisma.$transaction([
        prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: newStatus }
        }),
        prisma.ticketEvent.create({
          data: {
            tenantId: currentTenantId,
            ticketId: ticket.id,
            userId: agent.id,
            action: 'STATUS_CHANGED',
            oldValue: oldStatus,
            newValue: newStatus
          }
        })
      ]);
    }

    revalidatePath('/');
    return { success: true, data: true, error: null };
  } catch (error: unknown) {
     const message = error instanceof Error ? error.message : 'Internal Server Error';
     return createErrorResponse(message);
  }
}
