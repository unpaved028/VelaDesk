'use server';

import { prisma } from '@/lib/db/prisma';
import { isSuperAdminRole, requireAdminContext } from '@/lib/auth/session';
import { getErrorMessage } from '@/lib/errors';
import {
  currentYearMonth,
  formatYearMonth,
  monthRange,
  parseYearMonth,
  type YearMonth,
} from '@/lib/time/monthRange';

export interface BillingTenantRow {
  tenantId: string;
  tenantName: string;
  entryCount: number;
  totalMinutes: number;
  billableMinutes: number;
}

export interface BillingSummary {
  month: string;
  rows: BillingTenantRow[];
  totalMinutes: number;
  billableMinutes: number;
  entryCount: number;
}

function resolveMonth(month: string | null | undefined): YearMonth {
  return parseYearMonth(month) ?? currentYearMonth();
}

export async function getBillingSummary(month?: string | null) {
  try {
    const authResult = await requireAdminContext();
    if (!authResult.ok) {
      return { success: false as const, data: null, error: authResult.error };
    }

    const ym = resolveMonth(month);
    const { start, end } = monthRange(ym);
    const isSuperAdmin = isSuperAdminRole(authResult.ctx.role);

    // SUPER_ADMIN: instance-wide month rollup. ADMIN: own tenant only (SOP-02).
    const where = {
      createdAt: { gte: start, lt: end },
      ...(isSuperAdmin ? {} : { tenantId: authResult.ctx.tenantId }),
    };

    const entries = await prisma.timeEntry.findMany({
      where,
      select: {
        tenantId: true,
        durationMinutes: true,
        isBillable: true,
      },
    });

    const byTenant = new Map<string, BillingTenantRow>();
    for (const entry of entries) {
      const existing = byTenant.get(entry.tenantId) ?? {
        tenantId: entry.tenantId,
        tenantName: entry.tenantId,
        entryCount: 0,
        totalMinutes: 0,
        billableMinutes: 0,
      };
      existing.entryCount += 1;
      existing.totalMinutes += entry.durationMinutes;
      if (entry.isBillable) existing.billableMinutes += entry.durationMinutes;
      byTenant.set(entry.tenantId, existing);
    }

    const tenantIds = [...byTenant.keys()];
    if (tenantIds.length > 0) {
      const tenants = await prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true, name: true },
      });
      for (const tenant of tenants) {
        const row = byTenant.get(tenant.id);
        if (row) row.tenantName = tenant.name;
      }
    }

    const rows = [...byTenant.values()].sort((a, b) => b.billableMinutes - a.billableMinutes);
    const data: BillingSummary = {
      month: formatYearMonth(ym),
      rows,
      totalMinutes: rows.reduce((sum, row) => sum + row.totalMinutes, 0),
      billableMinutes: rows.reduce((sum, row) => sum + row.billableMinutes, 0),
      entryCount: rows.reduce((sum, row) => sum + row.entryCount, 0),
    };

    return { success: true as const, data, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}
