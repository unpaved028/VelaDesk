import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isSuperAdminRole, requireAdminContext } from '@/lib/auth/session';
import { buildBillingCsv, type BillingCsvRow } from '@/lib/billing/csv';
import { currentYearMonth, formatYearMonth, monthRange, parseYearMonth } from '@/lib/time/monthRange';

/**
 * GET /api/billing/export?month=YYYY-MM
 * CSV of TimeEntries for the month. ADMIN: own tenant. SUPER_ADMIN: all tenants.
 */
export async function GET(request: Request) {
  const authResult = await requireAdminContext();
  if (!authResult.ok) {
    const status = authResult.error === 'Not authenticated.' ? 401 : 403;
    return NextResponse.json(
      { success: false, data: null, error: authResult.error },
      { status }
    );
  }

  const url = new URL(request.url);
  const ym = parseYearMonth(url.searchParams.get('month')) ?? currentYearMonth();
  const { start, end } = monthRange(ym);
  const isSuperAdmin = isSuperAdminRole(authResult.ctx.role);

  const entries = await prisma.timeEntry.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      ...(isSuperAdmin ? {} : { tenantId: authResult.ctx.tenantId }),
    },
    orderBy: { createdAt: 'asc' },
    include: {
      ticket: { select: { subject: true } },
      user: { select: { name: true, email: true } },
    },
  });

  const tenantIds = [...new Set(entries.map((entry) => entry.tenantId))];
  const tenants = tenantIds.length
    ? await prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true, name: true },
      })
    : [];
  const tenantNames = new Map(tenants.map((tenant) => [tenant.id, tenant.name]));

  const rows: BillingCsvRow[] = entries.map((entry) => ({
    tenantName: tenantNames.get(entry.tenantId) ?? entry.tenantId,
    ticketId: entry.ticketId,
    subject: entry.ticket.subject,
    agentName: entry.user.name,
    agentEmail: entry.user.email,
    durationMinutes: entry.durationMinutes,
    isBillable: entry.isBillable,
    notes: entry.notes ?? '',
    createdAt: entry.createdAt.toISOString(),
  }));

  const csv = buildBillingCsv(rows);
  const filename = `veladesk-billing-${formatYearMonth(ym)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
