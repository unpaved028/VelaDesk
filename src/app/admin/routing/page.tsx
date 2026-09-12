import { prisma } from '@/lib/db/prisma';
import { requireAdminContext } from '@/lib/auth/session';
import { getRoutingRules } from '@/lib/actions/routingActions';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { RoutingRulesPanel } from '@/components/admin/RoutingRulesPanel';

export const dynamic = 'force-dynamic';

export default async function RoutingManagementPage() {
  const admin = await requireAdminContext();
  const tenantId = admin.ok ? admin.ctx.tenantId : '';
  const [rulesRes, workspaces] = await Promise.all([
    getRoutingRules(),
    tenantId
      ? prisma.workspace.findMany({
          where: { tenantId },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-8">
      <AdminPageHeader
        title="Email Routing Rules"
        description="Incoming mail for this tenant is matched by sender pattern. Rules are not shared across tenants."
      />
      {admin.ok ? (
        <RoutingRulesPanel
          tenantId={tenantId}
          initialRules={rulesRes.data || []}
          workspaces={workspaces}
        />
      ) : (
        <p className="text-sm text-on-surface-variant">Sign in required.</p>
      )}
    </div>
  );
}
