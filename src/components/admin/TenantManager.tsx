'use client';

import { useState, useTransition } from 'react';
import { createTenant, deleteTenant, updateTenant } from '../../lib/actions/tenantActions';
import { Building2, Plus, Trash2, Clock, Globe, ChevronDown, ChevronUp, Save } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  businessStartTime: string;
  businessEndTime: string;
  businessDays: string;
  timezone: string;
  createdAt: Date;
}

export const TenantManager = ({ initialTenants }: { initialTenants: Tenant[] }) => {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Tenant>>({});
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;

    startTransition(async () => {
      const res = await createTenant({ name, domain: domain.trim() || undefined });
      if (res.success && res.data) {
        setTenants([res.data as unknown as Tenant, ...tenants]);
        setName('');
        setDomain('');
      } else {
        setError(res.error || 'Failed to create tenant');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this tenant? This action cannot be undone.')) return;
    
    startTransition(async () => {
      const res = await deleteTenant(id);
      if (res.success) {
        setTenants(tenants.filter(t => t.id !== id));
      } else {
        alert(res.error || 'Failed to delete tenant');
      }
    });
  };

  const handleUpdate = (id: string) => {
    startTransition(async () => {
      const res = await updateTenant(id, {
        name: editData.name,
        domain: editData.domain,
        businessStartTime: editData.businessStartTime,
        businessEndTime: editData.businessEndTime,
        businessDays: editData.businessDays,
        timezone: editData.timezone,
      });
      if (res.success && res.data) {
        setTenants(tenants.map(t => t.id === id ? res.data as unknown as Tenant : t));
        setEditingId(null);
      } else {
        alert(res.error || 'Failed to update tenant');
      }
    });
  };

  const startEditing = (tenant: Tenant) => {
    setEditingId(tenant.id);
    setEditData(tenant);
  };

  return (
    <div className="max-w-5xl">
      <div className="bg-surface-container-low dark:bg-[#1a1f24] border border-surface-container dark:border-white/5 rounded-2xl p-6 mb-8 shadow-sm">
        <h2 className="text-sm font-bold text-on-background dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
          <Building2 className="w-4 h-4 text-primary" />
          <span>Register New Organization</span>
        </h2>
        
        {error && <div className="mb-4 p-3 bg-red-500/10 text-xs text-red-500 rounded-lg border border-red-500/20">{error}</div>}

        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-on-surface-variant dark:text-gray-400 mb-1 uppercase tracking-wider">Company Name *</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-lowest dark:bg-[#12181b] border border-surface-container dark:border-white/10 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="e.g. Acme Corp"
              required 
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-on-surface-variant dark:text-gray-400 mb-1 uppercase tracking-wider">Associated Domain</label>
            <input 
              type="text" 
              value={domain} 
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-lowest dark:bg-[#12181b] border border-surface-container dark:border-white/10 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="e.g. acme.com"
            />
          </div>
          <button 
            type="submit" 
            disabled={isPending}
            className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-gray-100 transition-all flex items-center gap-2 disabled:opacity-50 h-[44px] shadow-lg shadow-black/5"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-on-surface-variant dark:text-gray-400 mb-4 uppercase tracking-[0.2em]">Active Tenants</h3>
        {tenants.map(tenant => {
          const isEditing = editingId === tenant.id;
          
          return (
            <div key={tenant.id} className={`group bg-surface-container-lowest dark:bg-white/5 rounded-2xl border transition-all ${isEditing ? 'border-primary ring-4 ring-primary/5 shadow-xl' : 'border-surface-container/50 dark:border-white/5 hover:border-primary/50'}`}>
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-on-background dark:text-white">{tenant.name}</div>
                    <div className="text-[10px] font-medium text-on-surface-variant dark:text-gray-500 mt-0.5 tracking-tight">
                      {tenant.id} {tenant.domain && <span className="mx-1 opacity-30">|</span>} {tenant.domain && `Domain: ${tenant.domain}`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => isEditing ? setEditingId(null) : startEditing(tenant)}
                    className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-primary/10 text-primary' : 'hover:bg-surface-bright dark:hover:bg-white/5 text-on-surface-variant'}`}
                  >
                    {isEditing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => handleDelete(tenant.id)}
                    disabled={isPending}
                    className="p-2 text-on-surface-variant hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="px-5 pb-6 border-t border-surface-container dark:border-white/5 mt-2 pt-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Business Hours
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="time" 
                          value={editData.businessStartTime}
                          onChange={(e) => setEditData({...editData, businessStartTime: e.target.value})}
                          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-black/20 border border-surface-container dark:border-white/5 rounded-lg text-xs"
                        />
                        <span className="text-gray-400">-</span>
                        <input 
                          type="time" 
                          value={editData.businessEndTime}
                          onChange={(e) => setEditData({...editData, businessEndTime: e.target.value})}
                          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-black/20 border border-surface-container dark:border-white/5 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant dark:text-gray-400 mb-2 uppercase tracking-wider">Days (1=Mon, 7=Sun)</label>
                      <input 
                        type="text" 
                        value={editData.businessDays}
                        onChange={(e) => setEditData({...editData, businessDays: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-surface-container dark:border-white/5 rounded-lg text-xs"
                        placeholder="1,2,3,4,5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="w-3 h-3" />
                        Timezone
                      </label>
                      <input 
                        type="text" 
                        value={editData.timezone}
                        onChange={(e) => setEditData({...editData, timezone: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-surface-container dark:border-white/5 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex items-end">
                      <button 
                        onClick={() => handleUpdate(tenant.id)}
                        disabled={isPending}
                        className="w-full py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {tenants.length === 0 && (
          <div className="text-sm text-center py-8 text-on-surface-variant">No tenants found.</div>
        )}
      </div>
    </div>
  );
};
