import { prisma } from '@/lib/db/prisma';
import { AgentManager } from '@/components/admin/AgentManager';
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
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-on-background dark:text-white">Agent Management</h1>
          <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-2">
            Create and manage support staff accounts. Assign roles and tenants to control access.
          </p>
        </header>

        <AgentManager 
          initialAgents={agents || []}
          tenants={tenants}
        />
      </div>
    </div>
  );
}
