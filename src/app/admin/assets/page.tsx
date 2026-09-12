import { prisma } from '@/lib/db/prisma';
import { requireAdminContext } from '@/lib/auth/session';
import { listCustomers } from '@/lib/actions/customerActions';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AssetManager } from '@/components/admin/AssetManager';

export const dynamic = 'force-dynamic';

export default async function AssetInventoryPage() {
  const admin = await requireAdminContext();
  const customers = admin.ok ? await listCustomers() : { data: [] };
  const assets = admin.ok
    ? await prisma.asset.findMany({
        where: { tenantId: admin.ctx.tenantId },
        include: { customer: { select: { name: true, company: true } } },
        orderBy: { name: 'asc' },
      })
    : [];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl">
        <AdminPageHeader
          title="Asset Inventory"
          description="Hardware for this tenant. Attach a customer so the device belongs to a company, then link it on a ticket."
        />
        <AssetManager
          customers={(customers.data ?? []).map((customer) => ({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            company: customer.company,
          }))}
          initialAssets={assets.map((asset) => ({
            id: asset.id,
            name: asset.name,
            type: asset.type,
            status: asset.status,
            serialNumber: asset.serialNumber,
            location: asset.location,
            warrantyExpires: asset.warrantyExpires ? asset.warrantyExpires.toISOString().slice(0, 10) : null,
            customerId: asset.customerId,
            customerLabel: asset.customer
              ? asset.customer.company
                ? `${asset.customer.company} · ${asset.customer.name}`
                : asset.customer.name
              : '',
          }))}
        />
      </div>
    </div>
  );
}
