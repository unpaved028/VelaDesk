import { prisma } from '@/lib/db/prisma';
import { TaxonomyManager } from '@/components/admin/TaxonomyManager';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getCategories, getSLAs } from '@/lib/actions/taxonomyActions';

export const dynamic = 'force-dynamic';

export default async function AdminTaxonomyPage() {
  // Use server actions to fetch data
  const [categoriesRes, slasRes] = await Promise.all([
    getCategories(),
    getSLAs()
  ]);

  // Fetch tenants and workspaces for the forms
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true }});
  const workspaces = await prisma.workspace.findMany({ select: { id: true, name: true, tenantId: true }});

  const categories = categoriesRes.success ? categoriesRes.data : [];
  const slas = slasRes.success ? slasRes.data : [];

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <AdminPageHeader
          title="Taxonomy & SLAs"
          description="Configure ticket categories and service level agreements. These can be bound to specific tenants or globally available."
        />

        <TaxonomyManager 
          initialCategories={categories || []}
          initialSLAs={slas || []}
          tenants={tenants}
          workspaces={workspaces}
        />
      </div>
    </div>
  );
}
