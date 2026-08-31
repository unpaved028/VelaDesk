import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getPortalSession } from '@/lib/services/getPortalSession';

export const dynamic = 'force-dynamic';

export default async function PortalAssetsPage() {
  const { authenticated, session } = await getPortalSession();
  if (!authenticated || !session) redirect('/login');
  if (!session.isCustomerAdmin) redirect('/portal');

  const assets = await prisma.asset.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: 'asc' },
    include: { assignedTo: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Asset Übersicht</h1>
        <p className="text-sm text-on-surface-variant mt-1">Geräte Ihres Mandanten.</p>
      </header>
      {assets.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Keine Assets vorhanden.</p>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-surface-container dark:border-white/5"
            >
              <p className="text-sm font-bold text-on-background dark:text-white">{asset.name}</p>
              <p className="text-[11px] text-on-surface-variant mt-1">
                {asset.type}
                {asset.serialNumber ? ` · SN ${asset.serialNumber}` : ''}
                {asset.assignedTo ? ` · ${asset.assignedTo.name}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
