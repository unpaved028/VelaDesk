import { prisma } from '@/lib/db/prisma';
import { AgentManager } from '@/components/admin/AgentManager';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getAgents } from '@/lib/actions/agentActions';

export const dynamic = 'force-dynamic';

export default async function AdminAgentsPage() {
  const agentsRes = await getAgents();
  const agents = agentsRes.success ? agentsRes.data : [];

  const tenants = await prisma.tenant.findMany({ 
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <AdminPageHeader
          title="Agent Management"
          description="Create and manage support staff accounts. Assign roles and tenants to control access."
        />

        <AgentManager 
          initialAgents={agents || []}
          tenants={tenants}
        />
      </div>
    </div>
  );
}
