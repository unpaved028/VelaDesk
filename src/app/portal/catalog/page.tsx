import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getPortalSession } from '@/lib/services/getPortalSession';
import { getTenantFacing } from '@/lib/services/tenantFacing';
import { portalCopy } from '@/lib/i18n/customerFacing';
import { CatalogBrowser } from '@/components/portal/CatalogBrowser';

export const dynamic = 'force-dynamic';

export default async function RequestCatalogPage() {
  const { authenticated, session } = await getPortalSession();
  if (!authenticated || !session) redirect('/login');

  const facing = await getTenantFacing(session.tenantId);
  const items = await prisma.catalogItem.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    select: { id: true, title: true, description: true, category: true },
  });

  return <CatalogBrowser items={items} copy={portalCopy(facing.locale)} />;
}
