'use client';

import { useRouter } from 'next/navigation';
import { Download, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import type { BillingSummary } from '@/lib/actions/billingActions';
import { formatDurationMinutes } from '@/lib/time/duration';
import { parseYearMonth, shiftYearMonth, formatYearMonth, currentYearMonth } from '@/lib/time/monthRange';

interface BillingDashboardProps {
  summary: BillingSummary;
}

export const BillingDashboard = ({ summary }: BillingDashboardProps) => {
  const router = useRouter();
  const ym = parseYearMonth(summary.month) ?? currentYearMonth();

  const goTo = (delta: number) => {
    router.push(`/admin/billing?month=${formatYearMonth(shiftYearMonth(ym, delta))}`);
  };

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-8">
      <AdminPageHeader
        title="Billing"
        description="Logged time per tenant for the selected month."
        actions={
          <>
            <div className="flex items-center gap-1 rounded-xl border border-outline-variant/15 bg-surface-container-low">
              <button
                type="button"
                onClick={() => goTo(-1)}
                className="p-2 text-on-surface-variant hover:text-on-surface"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-bold tabular-nums text-on-surface">
                {summary.month}
              </span>
              <button
                type="button"
                onClick={() => goTo(1)}
                className="p-2 text-on-surface-variant hover:text-on-surface"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <a
              href={`/api/billing/export?month=${summary.month}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
            >
              <Download className="w-4 h-4" />
              CSV
            </a>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Entries', value: String(summary.entryCount) },
          { label: 'Billable', value: formatDurationMinutes(summary.billableMinutes) },
          { label: 'Total', value: formatDurationMinutes(summary.totalMinutes) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-low dark:bg-white/5 p-5 rounded-xl border border-surface-container dark:border-white/5"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
            <p className="text-2xl font-bold text-on-background dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {summary.rows.length === 0 ? (
        <div className="bg-surface-container-low dark:bg-white/5 p-10 rounded-xl border border-surface-container dark:border-white/5 text-center">
          <Receipt className="w-8 h-8 mx-auto mb-3 text-on-surface-variant/40" />
          <p className="text-sm text-on-surface-variant">No time entries in {summary.month}.</p>
        </div>
      ) : (
        <div className="bg-surface-container-low dark:bg-white/5 rounded-xl border border-surface-container dark:border-white/5 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-container dark:border-white/5">
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Tenant</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Entries</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Billable</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total</th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((row) => (
                <tr key={row.tenantId} className="border-t border-surface-container dark:border-white/5">
                  <td className="px-5 py-4 text-sm font-bold text-on-background dark:text-white">{row.tenantName}</td>
                  <td className="px-5 py-4 text-sm text-on-surface-variant">{row.entryCount}</td>
                  <td className="px-5 py-4 text-sm text-on-surface">{formatDurationMinutes(row.billableMinutes)}</td>
                  <td className="px-5 py-4 text-sm text-on-surface">{formatDurationMinutes(row.totalMinutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
