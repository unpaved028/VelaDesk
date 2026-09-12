import { prisma } from '@/lib/db/prisma';
import { requireAdminContext } from '@/lib/auth/session';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AssetCreateForm } from '@/components/admin/AssetCreateForm';

export const dynamic = 'force-dynamic';

function warrantyLabel(expires: Date | null): string {
  if (!expires) return '—';
  return expires.getTime() < Date.now() ? `Expired ${expires.toISOString().slice(0, 10)}` : expires.toISOString().slice(0, 10);
}

export default async function AssetInventoryPage() {
  const admin = await requireAdminContext();
  const assets = admin.ok
    ? await prisma.asset.findMany({
        where: { tenantId: admin.ctx.tenantId },
        include: { assignedTo: { select: { name: true, email: true } } },
        orderBy: { name: 'asc' },
      })
    : [];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl">
        <AdminPageHeader
          title="Asset Inventory"
          description="Hardware stored for this tenant. Link assets to a ticket from the ticket side panel."
        />
        <AssetCreateForm />

        {assets.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No assets stored for this tenant yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/15 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Serial</th>
                  <th className="px-6 py-4">Assigned</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Warranty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface">{asset.name}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{asset.type}</td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{asset.serialNumber || '—'}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {asset.assignedTo?.name || asset.assignedTo?.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{asset.status}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{warrantyLabel(asset.warrantyExpires)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
              {assets.length} asset{assets.length === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
