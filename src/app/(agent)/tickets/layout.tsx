import React from 'react';
import { headers } from 'next/headers';
import { TicketQueue } from "@/components/tickets/TicketQueue";
import { ContextPanel } from "@/components/tickets/ContextPanel";
import type { ContextPanelAsset, ContextPanelRequester } from "@/components/tickets/ContextPanel";
import { prisma } from '@/lib/db/prisma';
import { requireAgentContext } from '@/lib/auth/session';

function parseTicketIdFromPath(pathname: string): number | undefined {
  const match = pathname.match(/^\/tickets\/(\d+)(?:\/|$)/);
  if (!match) return undefined;
  const parsed = parseInt(match[1], 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export default async function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await requireAgentContext();
  const headerList = await headers();
  const pathname = headerList.get('x-veladesk-pathname') ?? '';
  const ticketId = parseTicketIdFromPath(pathname);

  let requester: ContextPanelRequester | null = null;
  let slaPolicyName: string | null = null;
  let slaResponseDeadline: Date | null = null;
  let slaResolutionDeadline: Date | null = null;
  let firstResponseAt: Date | null = null;
  let resolvedAt: Date | null = null;
  let assets: ContextPanelAsset[] = [];

  if (authResult.ok && ticketId !== undefined) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId: authResult.ctx.tenantId },
      include: {
        assets: {
          select: {
            id: true,
            name: true,
            type: true,
            serialNumber: true,
            warrantyExpires: true,
          },
        },
        workspace: {
          include: {
            tenant: { select: { name: true } },
            slas: { select: { name: true, priority: true } },
          },
        },
      },
    });

    if (ticket) {
      slaResponseDeadline = ticket.slaResponseDeadline;
      slaResolutionDeadline = ticket.slaResolutionDeadline;
      firstResponseAt = ticket.firstResponseAt;
      resolvedAt = ticket.resolvedAt;
      slaPolicyName = ticket.workspace.slas.find((s) => s.priority === ticket.priority)?.name ?? null;
      assets = ticket.assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        serialNumber: asset.serialNumber,
        warrantyExpires: asset.warrantyExpires ? asset.warrantyExpires.toISOString() : null,
      }));

      const [user, customer] = await Promise.all([
        prisma.user.findFirst({
          where: { id: ticket.requesterId, tenantId: authResult.ctx.tenantId },
          select: { name: true, email: true },
        }),
        prisma.customer.findFirst({
          where: { id: ticket.requesterId, tenantId: authResult.ctx.tenantId },
          select: { name: true, email: true },
        }),
      ]);

      const person = user ?? customer;
      if (person) {
        requester = {
          name: person.name,
          email: person.email,
          company: ticket.workspace.tenant.name,
        };
      }
    }
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden w-full min-h-0">
      <TicketQueue />

      <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
        {children}
      </div>

      <ContextPanel
        ticketId={ticketId}
        requester={requester}
        slaPolicyName={slaPolicyName}
        slaResponseDeadline={slaResponseDeadline}
        slaResolutionDeadline={slaResolutionDeadline}
        firstResponseAt={firstResponseAt}
        resolvedAt={resolvedAt}
        assets={assets}
      />
    </div>
  );
}
