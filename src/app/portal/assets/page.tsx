import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getPortalSession } from '@/lib/services/getPortalSession';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import { getTenantFacing } from '@/lib/services/tenantFacing';
import { portalCopy } from '@/lib/i18n/customerFacing';

export const dynamic = 'force-dynamic';

export default async function PortalAssetsPage() {
  const { authenticated, session } = await getPortalSession();
  if (!authenticated || !session) redirect('/login');
  if (!session.isCustomerAdmin) redirect('/portal');
  const copy = portalCopy((await getTenantFacing(session.tenantId)).locale);

  const assets = await prisma.asset.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: 'asc' },
    include: {
      assignedTo: { select: { name: true, email: true } },
      customer: { select: { name: true, company: true } },
    },
  });

  return (
    <div className="space-y-8">
      <PortalPageHeader
        title={copy.assetsTitle}
        description={copy.assetsDescription}
      />
      {assets.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{copy.noAssets}</p>
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
                {asset.customer?.company || asset.customer?.name ? ` · ${asset.customer.company || asset.customer.name}` : ''}
                {asset.assignedTo ? ` · ${asset.assignedTo.name}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
