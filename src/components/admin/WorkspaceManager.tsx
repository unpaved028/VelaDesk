'use client';

import { useState, useTransition } from 'react';
import { createWorkspace, deleteWorkspace } from '../../lib/actions/workspaceActions';
import { Briefcase, Plus, Trash2 } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
}

interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  tenant: Tenant;
}

export const WorkspaceManager = ({ initialWorkspaces, tenants }: { initialWorkspaces: Workspace[], tenants: Tenant[] }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [isPending, startTransition] = useTransition();
  
  const [tenantId, setTenantId] = useState(tenants[0]?.id || '');
  const [name, setName] = useState('');
  const [type, setType] = useState('ITSM');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !tenantId) return;

    startTransition(async () => {
      const res = await createWorkspace({ tenantId, name: name.trim(), type });
      if (res.success && res.data) {
        // Find tenant name for local state update
        const tenant = tenants.find(t => t.id === tenantId);
        const newWorkspace = { ...res.data, tenant: tenant! } as Workspace;
        setWorkspaces([newWorkspace, ...workspaces]);
        setName('');
      } else {
        setError(res.error || 'Failed to create workspace');
      }
    });
  };

  const handleDelete = (id: string, tId: string) => {
    if (!window.confirm('Delete this workspace? This action cannot be undone.')) return;
    
    startTransition(async () => {
      // SECURITY: Passing both id and tenantId as per SOP
      const res = await deleteWorkspace(id, tId);
      if (res.success) {
        setWorkspaces(workspaces.filter(w => w.id !== id));
      } else {
        alert(res.error || 'Failed to delete workspace');
      }
    });
  };

  if (tenants.length === 0) {
    return <div className="text-sm p-4 bg-yellow-500/10 text-yellow-600 rounded-lg">Please create a Tenant first before creating Workspaces.</div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="bg-surface-container-low dark:bg-[#1a1f24] border border-surface-container dark:border-white/5 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-on-background dark:text-white mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          <span>Create Workspace</span>
        </h2>
        
        {error && <div className="mb-4 text-xs text-red-500">{error}</div>}

        <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-on-surface-variant dark:text-gray-400 mb-1">Tenant *</label>
            <select 
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-lowest dark:bg-[#12181b] border border-surface-container dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              <option value="" disabled>Select Tenant</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-on-surface-variant dark:text-gray-400 mb-1">Workspace Name *</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-lowest dark:bg-[#12181b] border border-surface-container dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. IT-Support"
              required 
            />
          </div>
          <div className="w-[150px]">
            <label className="block text-xs font-medium text-on-surface-variant dark:text-gray-400 mb-1">Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-lowest dark:bg-[#12181b] border border-surface-container dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ITSM">ITSM</option>
              <option value="ESM">ESM</option>
              <option value="HR">HR</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={isPending}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50 h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </form>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-on-background dark:text-white mb-3">Active Workspaces</h3>
        {workspaces.map(ws => (
          <div key={ws.id} className="flex items-center justify-between p-4 bg-surface-container-lowest dark:bg-white/5 rounded-xl border border-surface-container/50 dark:border-white/5">
            <div>
              <div className="text-sm font-medium text-on-background dark:text-white flex items-center gap-2">
                {ws.name}
                <span className="px-2 py-0.5 text-[10px] bg-surface-bright dark:bg-white/10 rounded">{ws.type}</span>
              </div>
              <div className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">
                Tenant: {ws.tenant.name} ({ws.tenantId}) • ID: {ws.id}
              </div>
            </div>
            <button 
              onClick={() => handleDelete(ws.id, ws.tenantId)}
              disabled={isPending}
              className="p-2 text-on-surface-variant hover:bg-error-container hover:text-error rounded-lg opacity-50 hover:opacity-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {workspaces.length === 0 && (
          <div className="text-sm text-center py-8 text-on-surface-variant">No workspaces found.</div>
        )}
      </div>
    </div>
  );
};
