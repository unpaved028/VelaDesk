import { getBillingSummary } from '@/lib/actions/billingActions';
import { BillingDashboard } from '@/components/admin/BillingDashboard';

export const dynamic = 'force-dynamic';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const result = await getBillingSummary(month);

  if (!result.success || !result.data) {
    return (
      <div className="p-8 h-full overflow-y-auto custom-scrollbar">
        <div className="p-4 bg-red-500/10 text-red-600 rounded-lg">
          Failed to load billing: {result.error}
        </div>
      </div>
    );
  }

  return <BillingDashboard summary={result.data} />;
}
