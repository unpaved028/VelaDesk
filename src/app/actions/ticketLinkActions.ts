'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import type { ApiResponse } from '@/types/api';
import type { LinkedTicket, TicketReference, TicketSearchResult } from '@/types/ticketLink';
import { requireAgentContext } from '@/lib/auth/session';

/**
 * Searches for tickets that can be linked to the current ticket.
 * 
 * SECURITY: All queries enforce tenantId isolation (SOP-02).
 * Excludes the current ticket and already-linked tickets from results.
 */
export async function searchTicketsForLinking(
  currentTicketId: number,
  query: string
): Promise<ApiResponse<TicketSearchResult>> {
  try {
    const authResult = await requireAgentContext();
    if (!authResult.ok) return { success: false, data: null, error: authResult.error };
    const { tenantId: currentTenantId } = authResult.ctx;

    // Fetch current ticket to exclude its parent and children from search
    const currentTicket = await prisma.ticket.findFirst({
      where: { id: currentTicketId, tenantId: currentTenantId },
      select: { parentId: true, children: { select: { id: true } } },
    });

    if (!currentTicket) return { success: false, data: null, error: 'Ticket not found' };

    // Build exclusion list: self + already linked tickets
    const excludeIds = [
      currentTicketId,
      ...(currentTicket.parentId ? [currentTicket.parentId] : []),
      ...currentTicket.children.map((c) => c.id),
    ];

    // Parse query: if purely numeric, search by ID; otherwise search by subject
    const isNumericQuery = /^\d+$/.test(query.trim());

    const tickets = await prisma.ticket.findMany({
      where: {
        tenantId: currentTenantId,
        AND: [
          { id: { notIn: excludeIds } },
          isNumericQuery
            ? { id: parseInt(query.trim(), 10) }
            : { subject: { contains: query.trim() } },
        ],
      },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        itilType: true,
        createdAt: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    const mapped: TicketReference[] = tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      itilType: t.itilType,
      createdAt: t.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: { tickets: mapped, total: mapped.length },
      error: null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return { success: false, data: null, error: message };
  }
}

/**
 * Retrieves all related tickets (parent + children) for a given ticket.
 * 
 * SECURITY: tenantId enforced on every query (SOP-02).
 */
export async function getRelatedTickets(
  ticketId: number
): Promise<ApiResponse<LinkedTicket[]>> {
  try {
    const authResult = await requireAgentContext();
    if (!authResult.ok) return { success: false, data: null, error: authResult.error };
    const { tenantId: currentTenantId } = authResult.ctx;

    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId: currentTenantId },
      include: {
        parent: {
          select: { id: true, subject: true, status: true, priority: true, itilType: true, createdAt: true },
        },
        children: {
          select: { id: true, subject: true, status: true, priority: true, itilType: true, createdAt: true },
        },
      },
    });

    if (!ticket) return { success: false, data: null, error: 'Ticket not found' };

    const related: LinkedTicket[] = [];

    // Parent relationship (this ticket is a child of the parent)
    if (ticket.parent) {
      related.push({
        ticket: {
          id: ticket.parent.id,
          subject: ticket.parent.subject,
          status: ticket.parent.status,
          priority: ticket.parent.priority,
          itilType: ticket.parent.itilType,
          createdAt: ticket.parent.createdAt.toISOString(),
        },
        relationship: 'PARENT',
      });
    }

    // Child relationships (these tickets are children of this ticket)
    for (const child of ticket.children) {
      related.push({
        ticket: {
          id: child.id,
          subject: child.subject,
          status: child.status,
          priority: child.priority,
          itilType: child.itilType,
          createdAt: child.createdAt.toISOString(),
        },
        relationship: 'CHILD',
      });
    }

    return { success: true, data: related, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return { success: false, data: null, error: message };
  }
}

/**
 * Links two tickets in a parent-child relationship.
 * 
 * SECURITY: tenantId enforced on both tickets (SOP-02).
 * INTEGRITY: Circular reference detection — prevents A→B→A chains.
 * AUDIT: Creates TicketEvent entries on both tickets for full traceability.
 */
export async function linkTickets(
  parentTicketId: number,
  childTicketId: number
): Promise<ApiResponse<boolean>> {
  try {
    const authResult = await requireAgentContext();
    if (!authResult.ok) return { success: false, data: null, error: authResult.error };
    const { tenantId: currentTenantId, userId } = authResult.ctx;

    // Self-link guard
    if (parentTicketId === childTicketId) {
      return { success: false, data: null, error: 'A ticket cannot be linked to itself.' };
    }

    // Verify both tickets exist and belong to the same tenant
    const [parentTicket, childTicket] = await Promise.all([
      prisma.ticket.findFirst({ where: { id: parentTicketId, tenantId: currentTenantId } }),
      prisma.ticket.findFirst({ where: { id: childTicketId, tenantId: currentTenantId } }),
    ]);

    if (!parentTicket) return { success: false, data: null, error: `Parent ticket #${parentTicketId} not found.` };
    if (!childTicket) return { success: false, data: null, error: `Child ticket #${childTicketId} not found.` };

    // Check if child already has a parent
    if (childTicket.parentId !== null) {
      return {
        success: false,
        data: null,
        error: `Ticket #${childTicketId} is already linked to parent #${childTicket.parentId}. Unlink it first.`,
      };
    }

    // Circular reference detection: walk up the parent's ancestry chain.
    // If we encounter the childTicketId, linking would create a cycle.
    let currentAncestorId: number | null = parentTicket.parentId;
    const visited = new Set<number>([parentTicketId]);

    while (currentAncestorId !== null) {
      if (currentAncestorId === childTicketId) {
        return {
          success: false,
          data: null,
          error: `Circular reference detected: linking #${childTicketId} as child of #${parentTicketId} would create a cycle.`,
        };
      }
      if (visited.has(currentAncestorId)) {
        // Pre-existing cycle in data — bail out to prevent infinite loop
        break;
      }
      visited.add(currentAncestorId);

      const ancestor = await prisma.ticket.findFirst({
        where: { id: currentAncestorId, tenantId: currentTenantId },
        select: { parentId: true },
      });
      currentAncestorId = ancestor?.parentId ?? null;
    }

    // Also check if the parent is already a child of the proposed child
    // (i.e., the childTicket already has parentTicketId as a descendant)
    const childHasParentAsDescendant = await prisma.ticket.findFirst({
      where: { id: parentTicketId, parentId: childTicketId, tenantId: currentTenantId },
    });

    if (childHasParentAsDescendant) {
      return {
        success: false,
        data: null,
        error: `Circular reference detected: #${parentTicketId} is already a child of #${childTicketId}.`,
      };
    }

    // Execute the link within a transaction: update child + audit events on both
    await prisma.$transaction([
      prisma.ticket.update({
        where: { id: childTicketId },
        data: { parentId: parentTicketId },
      }),
      prisma.ticketEvent.create({
        data: {
          tenantId: currentTenantId,
          ticketId: parentTicketId,
          userId: userId,
          action: 'STATUS_CHANGED', // Reusing closest available EventAction
          oldValue: null,
          newValue: `LINKED_CHILD:#${childTicketId}`,
        },
      }),
      prisma.ticketEvent.create({
        data: {
          tenantId: currentTenantId,
          ticketId: childTicketId,
          userId: userId,
          action: 'STATUS_CHANGED',
          oldValue: null,
          newValue: `LINKED_PARENT:#${parentTicketId}`,
        },
      }),
    ]);

    revalidatePath('/');
    return { success: true, data: true, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return { success: false, data: null, error: message };
  }
}

/**
 * Removes a parent-child link from a ticket.
 * 
 * SECURITY: tenantId enforced (SOP-02).
 * AUDIT: Creates TicketEvent entries for traceability.
 */
export async function unlinkTicket(
  ticketId: number
): Promise<ApiResponse<boolean>> {
  try {
    const authResult = await requireAgentContext();
    if (!authResult.ok) return { success: false, data: null, error: authResult.error };
    const { tenantId: currentTenantId, userId } = authResult.ctx;

    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId: currentTenantId },
      select: { id: true, parentId: true },
    });

    if (!ticket) return { success: false, data: null, error: 'Ticket not found.' };
    if (ticket.parentId === null) return { success: false, data: null, error: 'Ticket has no parent link to remove.' };

    const oldParentId = ticket.parentId;

    await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticketId },
        data: { parentId: null },
      }),
      prisma.ticketEvent.create({
        data: {
          tenantId: currentTenantId,
          ticketId: ticketId,
          userId: userId,
          action: 'STATUS_CHANGED',
          oldValue: `LINKED_PARENT:#${oldParentId}`,
          newValue: null,
        },
      }),
      prisma.ticketEvent.create({
        data: {
          tenantId: currentTenantId,
          ticketId: oldParentId,
          userId: userId,
          action: 'STATUS_CHANGED',
          oldValue: `LINKED_CHILD:#${ticketId}`,
          newValue: null,
        },
      }),
    ]);

    revalidatePath('/');
    return { success: true, data: true, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return { success: false, data: null, error: message };
  }
}
