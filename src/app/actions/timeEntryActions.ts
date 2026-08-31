'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getErrorMessage } from '@/lib/errors';
import { isAdminPortalRole, requireAgentContext } from '@/lib/auth/session';
import { parseDurationMinutes } from '@/lib/time/duration';

export interface TimeEntryRow {
  id: string;
  durationMinutes: number;
  isBillable: boolean;
  notes: string | null;
  createdAt: Date;
  userId: string;
  userName: string;
}

export async function getTimeEntries(ticketId: number) {
  try {
    const authResult = await requireAgentContext();
    if (!authResult.ok) {
      return { success: false as const, data: null, error: authResult.error };
    }
    const { tenantId } = authResult.ctx;

    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId },
      select: { id: true },
    });
    if (!ticket) {
      return { success: false as const, data: null, error: 'Ticket not found.' };
    }

    const entries = await prisma.timeEntry.findMany({
      where: { ticketId, tenantId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });

    const data: TimeEntryRow[] = entries.map((entry) => ({
      id: entry.id,
      durationMinutes: entry.durationMinutes,
      isBillable: entry.isBillable,
      notes: entry.notes,
      createdAt: entry.createdAt,
      userId: entry.userId,
      userName: entry.user.name,
    }));

    return { success: true as const, data, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}

export async function createTimeEntry(input: {
  ticketId: number;
  durationInput: string;
  isBillable: boolean;
  notes?: string;
}) {
  try {
    const authResult = await requireAgentContext();
    if (!authResult.ok) {
      return { success: false as const, data: null, error: authResult.error };
    }
    const { tenantId, userId } = authResult.ctx;

    const durationMinutes = parseDurationMinutes(input.durationInput);
    if (!durationMinutes) {
      return { success: false as const, data: null, error: 'Enter a duration such as 15m or 1h 30m.' };
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id: input.ticketId, tenantId },
      select: { id: true },
    });
    if (!ticket) {
      return { success: false as const, data: null, error: 'Ticket not found.' };
    }

    const notes = input.notes?.trim() || null;

    const created = await prisma.timeEntry.create({
      data: {
        tenantId,
        ticketId: input.ticketId,
        userId,
        durationMinutes,
        isBillable: input.isBillable,
        notes,
      },
      include: { user: { select: { name: true } } },
    });

    revalidatePath(`/tickets/${input.ticketId}`);
    revalidatePath('/admin/billing');

    const data: TimeEntryRow = {
      id: created.id,
      durationMinutes: created.durationMinutes,
      isBillable: created.isBillable,
      notes: created.notes,
      createdAt: created.createdAt,
      userId: created.userId,
      userName: created.user.name,
    };

    return { success: true as const, data, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}

export async function deleteTimeEntry(id: string, ticketId: number) {
  try {
    const authResult = await requireAgentContext();
    if (!authResult.ok) {
      return { success: false as const, data: null, error: authResult.error };
    }
    const { tenantId, userId, role } = authResult.ctx;

    const entry = await prisma.timeEntry.findFirst({
      where: { id, tenantId, ticketId },
    });
    if (!entry) {
      return { success: false as const, data: null, error: 'Time entry not found.' };
    }

    if (entry.userId !== userId && !isAdminPortalRole(role)) {
      return { success: false as const, data: null, error: 'You can only delete your own time entries.' };
    }

    await prisma.timeEntry.deleteMany({
      where: { id, tenantId },
    });

    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath('/admin/billing');

    return { success: true as const, data: { id }, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}
