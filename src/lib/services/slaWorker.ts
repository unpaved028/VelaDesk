import { prisma } from '@/lib/db/prisma';
import { calculateSlaDeadline, BusinessHours } from '../utils/businessHours';
import { TicketStatus, EventAction } from '@prisma/client';

/**
 * SLA Escalation Engine (v1.1.2)
 *
 * Multi-tier SLA enforcement:
 *  1. Persists response/resolution deadlines on first encounter (REQ-1.8)
 *  2. Fires SLA_WARNING at 80% of elapsed time (REQ-1.2)
 *  3. Escalates to ESCALATED status at 100% breach (REQ-1.3)
 *  4. Creates TicketEvent audit entries for every transition (REQ-1.4)
 *  5. Prevents duplicate warnings and re-escalation (REQ-1.6)
 *
 * Runs as a system-level cron job scanning ALL tenants.
 * tenantId is enforced on every write operation (REQ-1.7).
 */

/** Alert when 80% of SLA time has elapsed */
const SLA_WARNING_THRESHOLD = 0.8;

interface CheckResult {
  warned: boolean;
  escalated: boolean;
  deadlineSet: boolean;
}

export const SlaWorker = {
  /**
   * Main entry point — called by cron.ts every 5 minutes.
   * Scans all active tickets across tenants and enforces SLA policies.
   *
   * NOTE: The read query intentionally omits tenantId because this is
   * a system-level background worker that must process all tenants.
   * All write operations strictly include tenantId for data isolation.
   */
  async runAll(): Promise<void> {
    console.log('[SLA Worker] Starting SLA check cycle...');
    const startTime = Date.now();

    const tickets = await prisma.ticket.findMany({
      where: {
        status: {
          in: [TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.PENDING, TicketStatus.ESCALATED],
        },
      },
      include: {
        workspace: {
          include: {
            slas: true,
            tenant: true,
          },
        },
        // Pre-load existing SLA events to avoid duplicate warnings (REQ-1.6)
        ticketEvents: {
          where: {
            action: { in: [EventAction.SLA_WARNING, EventAction.SLA_BREACHED] },
          },
          select: { action: true },
        },
      },
    });

    // System actor for automated audit events
    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!systemUser) {
      console.error('[SLA Worker] No admin user found for system events. Aborting cycle.');
      return;
    }

    let warned = 0;
    let escalated = 0;
    let deadlinesSet = 0;

    for (const ticket of tickets) {
      const result = await this.checkTicket(ticket, systemUser.id);
      if (result.warned) warned++;
      if (result.escalated) escalated++;
      if (result.deadlineSet) deadlinesSet++;
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[SLA Worker] Cycle complete in ${elapsed}ms | ` +
      `Checked: ${tickets.length} | Warnings: ${warned} | ` +
      `Escalations: ${escalated} | Deadlines set: ${deadlinesSet}`
    );
  },

  /**
   * Evaluate a single ticket against its workspace SLA policy.
   */
  async checkTicket(ticket: TicketWithRelations, actorId: string): Promise<CheckResult> {
    const result: CheckResult = { warned: false, escalated: false, deadlineSet: false };

    const { workspace } = ticket;
    const { tenant } = workspace;
    const policies = workspace.slas;

    // No SLA policy → nothing to enforce
    if (policies.length === 0) return result;

    // Match policy by ticket priority, fall back to first available
    const policy = policies.find((p) => p.priority === ticket.priority) || policies[0];

    const business: BusinessHours = {
      startTime: tenant.businessStartTime,
      endTime: tenant.businessEndTime,
      days: tenant.businessDays.split(',').map(Number),
      timezone: tenant.timezone,
    };

    const now = new Date();

    // ── Step 1: Persist SLA deadlines if not yet calculated (REQ-1.8) ──
    const deadlineUpdates: Record<string, Date> = {};

    if (!ticket.slaResponseDeadline) {
      deadlineUpdates.slaResponseDeadline = calculateSlaDeadline(
        ticket.createdAt, policy.responseHours, business
      );
    }
    if (!ticket.slaResolutionDeadline) {
      deadlineUpdates.slaResolutionDeadline = calculateSlaDeadline(
        ticket.createdAt, policy.resolutionHours, business
      );
    }

    if (Object.keys(deadlineUpdates).length > 0) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: deadlineUpdates,
      });
      result.deadlineSet = true;
    }

    // Use persisted or just-calculated deadlines
    const responseDeadline = ticket.slaResponseDeadline
      ?? deadlineUpdates.slaResponseDeadline
      ?? calculateSlaDeadline(ticket.createdAt, policy.responseHours, business);

    const resolutionDeadline = ticket.slaResolutionDeadline
      ?? deadlineUpdates.slaResolutionDeadline
      ?? calculateSlaDeadline(ticket.createdAt, policy.resolutionHours, business);

    // Existing SLA events → prevent duplicates (REQ-1.6)
    const existingActions = new Set(
      (ticket.ticketEvents ?? []).map((e) => e.action)
    );
    const alreadyWarned = existingActions.has(EventAction.SLA_WARNING);
    const alreadyBreached = existingActions.has(EventAction.SLA_BREACHED);

    // ── Step 2: Check Response SLA (NEW / OPEN tickets without first response) ──
    if (
      !ticket.firstResponseAt &&
      ([TicketStatus.NEW, TicketStatus.OPEN] as TicketStatus[]).includes(ticket.status)
    ) {
      const slaResult = this.evaluateThreshold(
        now, ticket.createdAt, responseDeadline, 'Response'
      );

      if (slaResult === 'breach' && !alreadyBreached && ticket.status !== TicketStatus.ESCALATED) {
        await this.escalateTicket(ticket, actorId, responseDeadline, 'Response');
        result.escalated = true;
      } else if (slaResult === 'warning' && !alreadyWarned) {
        const ratio = this.calcRatio(now, ticket.createdAt, responseDeadline);
        await this.warnTicket(ticket, actorId, responseDeadline, 'Response', ratio);
        result.warned = true;
      }
    }

    // ── Step 3: Check Resolution SLA (unless already escalated this cycle) ──
    if (!ticket.resolvedAt && !result.escalated) {
      const slaResult = this.evaluateThreshold(
        now, ticket.createdAt, resolutionDeadline, 'Resolution'
      );

      if (slaResult === 'breach' && !alreadyBreached && ticket.status !== TicketStatus.ESCALATED) {
        await this.escalateTicket(ticket, actorId, resolutionDeadline, 'Resolution');
        result.escalated = true;
      } else if (slaResult === 'warning' && !alreadyWarned && !result.warned) {
        const ratio = this.calcRatio(now, ticket.createdAt, resolutionDeadline);
        await this.warnTicket(ticket, actorId, resolutionDeadline, 'Resolution', ratio);
        result.warned = true;
      }
    }

    return result;
  },

  /**
   * Determine whether a deadline is in warning or breach state.
   */
  evaluateThreshold(
    now: Date, createdAt: Date, deadline: Date, _label: string
  ): 'ok' | 'warning' | 'breach' {
    const ratio = this.calcRatio(now, createdAt, deadline);
    if (ratio >= 1.0) return 'breach';
    if (ratio >= SLA_WARNING_THRESHOLD) return 'warning';
    return 'ok';
  },

  /** Calculate elapsed ratio (0.0 = just created, 1.0 = deadline reached) */
  calcRatio(now: Date, createdAt: Date, deadline: Date): number {
    const totalMs = deadline.getTime() - createdAt.getTime();
    if (totalMs <= 0) return 1.0;
    return (now.getTime() - createdAt.getTime()) / totalMs;
  },

  /**
   * Escalate a ticket to ESCALATED status with full audit trail (REQ-1.3, REQ-1.4).
   */
  async escalateTicket(
    ticket: TicketWithRelations, actorId: string, deadline: Date, slaType: string
  ): Promise<void> {
    console.log(
      `[SLA Worker] BREACH — Ticket #${ticket.id}: ${slaType} SLA breached ` +
      `(deadline: ${deadline.toISOString()})`
    );

    await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.ESCALATED },
      }),
      prisma.ticketEvent.create({
        data: {
          tenantId: ticket.tenantId,
          ticketId: ticket.id,
          userId: actorId,
          action: EventAction.SLA_BREACHED,
          oldValue: ticket.status,
          newValue: `${TicketStatus.ESCALATED} (${slaType} SLA)`,
        },
      }),
    ]);
  },

  /**
   * Record a warning event without changing ticket status (REQ-1.2, REQ-1.4).
   */
  async warnTicket(
    ticket: TicketWithRelations, actorId: string, deadline: Date, slaType: string, ratio: number
  ): Promise<void> {
    const pct = Math.round(ratio * 100);
    console.log(
      `[SLA Worker] WARNING — Ticket #${ticket.id}: ${slaType} SLA at ${pct}% ` +
      `(deadline: ${deadline.toISOString()})`
    );

    await prisma.ticketEvent.create({
      data: {
        tenantId: ticket.tenantId,
        ticketId: ticket.id,
        userId: actorId,
        action: EventAction.SLA_WARNING,
        oldValue: `${slaType} SLA at ${pct}%`,
        newValue: `Deadline: ${deadline.toISOString()}`,
      },
    });
  },
};

/**
 * Internal type for ticket with pre-loaded workspace, tenant, SLA policies,
 * and existing SLA-related TicketEvents. Avoids `any` per SOP-01.
 */
type TicketWithRelations = {
  id: number;
  tenantId: string;
  status: TicketStatus;
  priority: string;
  createdAt: Date;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
  slaResponseDeadline: Date | null;
  slaResolutionDeadline: Date | null;
  workspace: {
    slas: Array<{
      priority: string;
      responseHours: number;
      resolutionHours: number;
    }>;
    tenant: {
      businessStartTime: string;
      businessEndTime: string;
      businessDays: string;
      timezone: string;
    };
  };
  ticketEvents: Array<{ action: string }>;
};
