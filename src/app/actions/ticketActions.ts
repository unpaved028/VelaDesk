'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { SubmitReplySchema, UpdateStatusSchema, createErrorResponse } from '@/lib/validation/schemas';
import { requireAgentContext } from '@/lib/auth/session';

export async function submitTicketReply(ticketId: number, body: string, type: 'PUBLIC' | 'INTERNAL') {
  try {
    // 11.2: Server Side Validation using Zod
    const validation = SubmitReplySchema.safeParse({ ticketId, body, type });
    
    if (!validation.success) {
      return createErrorResponse(validation.error.issues[0]?.message || 'Invalid input');
    }

    const { ticketId: validatedId, body: validatedBody, type: validatedType } = validation.data;
    const isInternal = validatedType === 'INTERNAL';

    const authResult = await requireAgentContext();
    if (!authResult.ok) return createErrorResponse(authResult.error);
    const { tenantId: currentTenantId, userId } = authResult.ctx;

    const ticket = await prisma.ticket.findFirst({
      where: { id: validatedId, tenantId: currentTenantId }
    });

    if (!ticket) return createErrorResponse('Ticket not found');

    const transactions: Prisma.PrismaPromise<unknown>[] = [];

    transactions.push(
      prisma.message.create({
        data: {
          ticketId: validatedId,
          body: validatedBody,
          isInternal,
          authorId: userId
        }
      })
    );

    const isStatusChangeNeeded = ticket.status === 'NEW';
    const isAssignNeeded = !ticket.assignedAgentId;

    const updateData: Prisma.TicketUncheckedUpdateInput = {};
    if (isStatusChangeNeeded) updateData.status = 'OPEN';
    if (isAssignNeeded) updateData.assignedAgentId = userId;
    
    // SLA Logic: Meeting Response SLA on first public reply
    if (validatedType === 'PUBLIC') {
      updateData.slaResponseDeadline = null;
    }

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
              userId: userId,
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
              userId: userId,
              action: 'ASSIGNED',
              oldValue: null,
              newValue: userId
            }
          })
        );
      }
    }

    const results = await prisma.$transaction(transactions);
    const message = results[0];

    let mailDelivery: 'sent' | 'no_mailbox' | 'no_recipient' | 'graph_error' | 'internal' = 'internal';
    if (!isInternal) {
      const { sendTicketReplyNotification } = await import('@/lib/services/emailSender');
      mailDelivery = await sendTicketReplyNotification(
        ticket.id,
        currentTenantId,
        ticket.workspaceId,
        ticket.requesterId,
        validatedBody
      );
    }

    const totalMessages = await prisma.message.count({ where: { ticketId: validatedId } });
    if (totalMessages === 6) {
      import('./aiActions').then(({ generateAutoSummary }) => {
        generateAutoSummary(validatedId).catch((err) => console.error('Auto summary failed:', err));
      });
    }

    revalidatePath('/');
    return { success: true, data: { message, mailDelivery }, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createErrorResponse(message);
  }
}

export async function updateTicketStatus(ticketId: number, status: 'OPEN' | 'RESOLVED' | 'CLOSED' | 'PENDING') {
  try {
    const validation = UpdateStatusSchema.safeParse({ ticketId, status });
    
    if (!validation.success) {
      return createErrorResponse(validation.error.issues[0]?.message || 'Invalid status update');
    }

    const authResult = await requireAgentContext();
    if (!authResult.ok) return createErrorResponse(authResult.error);
    const { tenantId: currentTenantId, userId } = authResult.ctx;

    const ticket = await prisma.ticket.findFirst({
      where: { id: validation.data.ticketId, tenantId: currentTenantId }
    });

    if (!ticket) return createErrorResponse('Ticket not found');

    const oldStatus = ticket.status;
    const newStatus = validation.data.status;

    // CAB Gate: CHANGE tickets MUST have at least one APPROVED approval before transitioning to OPEN.
    // HIGH/CRITICAL risk CHANGE tickets require 2+ distinct approvers.
    // This is a security boundary — bypassing this gate violates ITIL Change Management compliance.
    if (ticket.itilType === 'CHANGE' && newStatus === 'OPEN') {
      const approvedApprovals = await prisma.approval.findMany({
        where: {
          ticketId: ticket.id,
          tenantId: currentTenantId,
          status: 'APPROVED',
        },
        select: { approverId: true },
      });

      if (approvedApprovals.length === 0) {
        return createErrorResponse(
          'CHANGE tickets require at least one CAB approval before being set to OPEN.'
        );
      }

      // HIGH/CRITICAL risk enforcement: require 2+ distinct approvers
      const riskLevel = ticket.riskLevel;
      if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
        const uniqueApprovers = new Set(approvedApprovals.map(a => a.approverId));
        if (uniqueApprovers.size < 2) {
          return createErrorResponse(
            `${riskLevel} risk CHANGE tickets require approvals from at least 2 distinct approvers. Currently: ${uniqueApprovers.size}.`
          );
        }
      }
    }

    if (oldStatus !== newStatus) {
      const transactionOps = [
        prisma.ticket.update({
          where: { id: ticket.id },
          data: { 
            status: newStatus,
            // SLA Logic: Clear deadlines if ticket is resolved/closed
            ...( (newStatus === 'RESOLVED' || newStatus === 'CLOSED') ? {
              slaResponseDeadline: null,
              slaResolutionDeadline: null,
              resolvedAt: new Date(),
            } : {})
          }
        }),
        prisma.ticketEvent.create({
          data: {
            tenantId: currentTenantId,
            ticketId: ticket.id,
            userId: userId,
            action: 'STATUS_CHANGED',
            oldValue: oldStatus,
            newValue: newStatus
          }
        })
      ];

      // CSAT: Log audit event when ticket is resolved (not closed, to avoid duplicates)
      if (newStatus === 'RESOLVED') {
        transactionOps.push(
          prisma.ticketEvent.create({
            data: {
              tenantId: currentTenantId,
              ticketId: ticket.id,
              userId: userId,
              action: 'CSAT_REQUESTED',
              oldValue: null,
              newValue: 'SURVEY_SENT'
            }
          })
        );
      }

      await prisma.$transaction(transactionOps);

      // CSAT: Send satisfaction survey email asynchronously when ticket is resolved
      // Non-blocking: failure to send CSAT email must not affect ticket resolution flow
      if (newStatus === 'RESOLVED') {
        import('@/lib/services/csatEmailSender').then(({ sendCsatEmail }) => {
          sendCsatEmail(
            ticket.id,
            currentTenantId,
            ticket.workspaceId,
            ticket.requesterId
          ).catch((err) => console.error('[CSAT] Failed to send survey email:', err));
        });
      }
    }

    revalidatePath('/');
    return { success: true, data: true, error: null };
  } catch (error: unknown) {
     const message = error instanceof Error ? error.message : 'Internal Server Error';
     return createErrorResponse(message);
  }
}

/**
 * Mass-resolves all child incidents of a parent ticket.
 * 
 * SECURITY: Enforces tenantId on parent AND every child query — cross-tenant
 * resolution is architecturally impossible (SOP-02).
 * 
 * SIDE-EFFECTS per child:
 * 1. Status → RESOLVED, resolvedAt timestamp set
 * 2. TicketEvent (STATUS_CHANGED) audit entry
 * 3. Auto-generated internal note ("Auto-resolved via parent ticket #X")
 * 4. CSAT survey email triggered asynchronously
 * 
 * IDEMPOTENCY: Already-resolved children are skipped (no double-resolve).
 */
export async function massResolveChildren(parentTicketId: number): Promise<{
  success: boolean;
  data: { resolved: number; skipped: number; failed: number; errors: string[] } | null;
  error: string | null;
}> {
  try {
    const authResult = await requireAgentContext();
    if (!authResult.ok) return createErrorResponse(authResult.error) as { success: false; data: null; error: string };
    const { tenantId: currentTenantId, userId } = authResult.ctx;

    // 1. Validate parent exists AND belongs to current tenant
    const parentTicket = await prisma.ticket.findFirst({
      where: { id: parentTicketId, tenantId: currentTenantId },
    });

    if (!parentTicket) {
      return { success: false, data: null, error: 'Parent ticket not found or access denied.' };
    }

    // 2. Parent must be RESOLVED or CLOSED — otherwise mass-resolve makes no sense
    if (parentTicket.status !== 'RESOLVED' && parentTicket.status !== 'CLOSED') {
      return {
        success: false,
        data: null,
        error: `Parent ticket #${parentTicketId} must be RESOLVED or CLOSED before mass-resolving children. Current status: ${parentTicket.status}`,
      };
    }

    // 3. Fetch all child tickets (tenant-scoped)
    const children = await prisma.ticket.findMany({
      where: {
        parentId: parentTicketId,
        tenantId: currentTenantId,
      },
    });

    if (children.length === 0) {
      return {
        success: true,
        data: { resolved: 0, skipped: 0, failed: 0, errors: [] },
        error: null,
      };
    }

    let resolved = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const child of children) {
      // Idempotency: skip already-resolved/closed children
      if (child.status === 'RESOLVED' || child.status === 'CLOSED') {
        skipped++;
        continue;
      }

      try {
        const oldStatus = child.status;

        // Atomic transaction per child: status update + audit event + internal note
        await prisma.$transaction([
          // a) Update child status to RESOLVED
          prisma.ticket.update({
            where: { id: child.id },
            data: {
              status: 'RESOLVED',
              resolvedAt: new Date(),
              slaResponseDeadline: null,
              slaResolutionDeadline: null,
            },
          }),
          // b) Audit event: STATUS_CHANGED
          prisma.ticketEvent.create({
            data: {
              tenantId: currentTenantId,
              ticketId: child.id,
              userId: userId,
              action: 'STATUS_CHANGED',
              oldValue: oldStatus,
              newValue: 'RESOLVED',
            },
          }),
          // c) Audit event: CSAT_REQUESTED
          prisma.ticketEvent.create({
            data: {
              tenantId: currentTenantId,
              ticketId: child.id,
              userId: userId,
              action: 'CSAT_REQUESTED',
              oldValue: null,
              newValue: 'SURVEY_SENT',
            },
          }),
          // d) Auto-generated internal note
          prisma.message.create({
            data: {
              ticketId: child.id,
              authorId: userId,
              body: `Auto-resolved via parent ticket #${parentTicketId}. Root cause addressed in the parent Problem/Incident.`,
              isInternal: true,
            },
          }),
        ]);

        // e) CSAT email (async, non-blocking — failure must not affect batch)
        import('@/lib/services/csatEmailSender').then(({ sendCsatEmail }) => {
          sendCsatEmail(
            child.id,
            currentTenantId,
            child.workspaceId,
            child.requesterId
          ).catch((err) =>
            console.error(`[massResolve] CSAT email failed for child #${child.id}:`, err)
          );
        });

        resolved++;
      } catch (childError) {
        failed++;
        const errMsg = childError instanceof Error ? childError.message : 'Unknown error';
        errors.push(`Child #${child.id}: ${errMsg}`);
        console.error(`[massResolve] Failed to resolve child #${child.id}:`, childError);
      }
    }

    revalidatePath('/');
    return {
      success: true,
      data: { resolved, skipped, failed, errors },
      error: null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return { success: false, data: null, error: message };
  }
}
