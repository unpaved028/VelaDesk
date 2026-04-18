import React from 'react';
import { getWorkspaces } from '../../../lib/actions/workspaceActions';
import { getTenants } from '../../../lib/actions/tenantActions';
import { WorkspaceManager } from '../../../components/admin/WorkspaceManager';

export const dynamic = 'force-dynamic';

export default async function WorkspacesPage() {
  const workspacesResult = await getWorkspaces();
  const tenantsResult = await getTenants();
  
  if (!workspacesResult.success || !tenantsResult.success) {
    return (
      <div className="p-8 h-full overflow-y-auto custom-scrollbar">
        <div className="p-4 bg-red-500/10 text-red-600 rounded-lg">
          Failed to load data. Please try again.
        </div>
      </div>
    );
  }

  const workspaces = workspacesResult.data || [];
  const tenants = tenantsResult.data || [];

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-on-background dark:text-white">Workspace Management</h1>
        <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-1">
          Manage organizational units (like IT-Support) within your Tenants.
        </p>
      </header>
      
      <WorkspaceManager initialWorkspaces={workspaces} tenants={tenants} />
    </div>
  );
}
