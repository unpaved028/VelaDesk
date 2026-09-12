import { listCustomers } from '@/lib/actions/customerActions';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { CustomerManager } from '@/components/admin/CustomerManager';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const result = await listCustomers();
  const customers = result.data ?? [];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl">
        <AdminPageHeader
          title="Customers"
          description="Companies and contacts for this tenant. Tickets match on contact email or id."
        />
        {result.error ? <p className="mb-4 text-sm text-red-600">{result.error}</p> : null}
        <CustomerManager initialCustomers={customers} />
      </div>
    </div>
  );
}
