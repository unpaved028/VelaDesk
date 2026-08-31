import { prisma } from '@/lib/db/prisma';
import type { ParsedRmmPayload } from '@/lib/webhooks/rmmPayload';

async function resolveWorkspaceId(tenantId: string): Promise<string | null> {
  const config = await prisma.systemConfig.findUnique({
    where: { id: 'global' },
    select: { defaultWorkspaceId: true },
  });
  if (config?.defaultWorkspaceId) {
    const configured = await prisma.workspace.findFirst({
      where: { id: config.defaultWorkspaceId, tenantId },
      select: { id: true },
    });
    if (configured) return configured.id;
  }
  const fallback = await prisma.workspace.findFirst({
    where: { tenantId },
    orderBy: { name: 'asc' },
    select: { id: true },
  });
  return fallback?.id ?? null;
}

export async function applyRmmAlert(
  tenantId: string,
  tenantDomain: string | null,
  payload: ParsedRmmPayload
): Promise<{ ticketId: number; action: 'created' | 'updated' | 'resolved' }> {
  const existing = await prisma.ticket.findFirst({
    where: {
      tenantId,
      externalAlertId: payload.alertId,
      status: { notIn: ['RESOLVED', 'CLOSED'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (payload.status === 'UP') {
    if (!existing) {
      throw new Error('No open ticket for this alertId.');
    }
    await prisma.$transaction([
      prisma.ticket.update({
        where: { id: existing.id },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      }),
      prisma.message.create({
        data: {
          ticketId: existing.id,
          authorId: 'SYSTEM:RMM',
          isInternal: true,
          body: 'Auto-Resolved by RMM',
        },
      }),
    ]);
    return { ticketId: existing.id, action: 'resolved' };
  }

  if (existing) {
    await prisma.message.create({
      data: {
        ticketId: existing.id,
        authorId: 'SYSTEM:RMM',
        isInternal: true,
        body: payload.description,
      },
    });
    return { ticketId: existing.id, action: 'updated' };
  }

  const workspaceId = await resolveWorkspaceId(tenantId);
  if (!workspaceId) {
    throw new Error('Tenant has no workspace to attach the incident to.');
  }

  const requesterId = `rmm@${tenantDomain || 'veladesk.local'}`;
  const created = await prisma.ticket.create({
    data: {
      tenantId,
      workspaceId,
      subject: payload.subject,
      description: payload.description,
      requesterId,
      status: 'NEW',
      priority: 'URGENT',
      itilType: 'INCIDENT',
      tags: 'RMM,AUTO',
      externalAlertId: payload.alertId,
      messages: {
        create: {
          authorId: 'SYSTEM:RMM',
          isInternal: true,
          body: payload.description,
        },
      },
    },
    select: { id: true },
  });

  return { ticketId: created.id, action: 'created' };
}
