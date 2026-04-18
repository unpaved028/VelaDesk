'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Tag, Clock } from 'lucide-react';
import { CategoryPayload, SLAPayload, createCategory, deleteCategory, createSLA, deleteSLA } from '../../lib/actions/taxonomyActions';

interface TaxonomyManagerProps {
  initialCategories: any[];
  initialSLAs: any[];
  tenants: any[];
  workspaces: any[];
}

export const TaxonomyManager = ({ initialCategories, initialSLAs, tenants, workspaces }: TaxonomyManagerProps) => {
  const [categories, setCategories] = useState(initialCategories);
  const [slas, setSlas] = useState(initialSLAs);
  
  // Forms state
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isSlaLoading, setIsSlaLoading] = useState(false);
  
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catTenant, setCatTenant] = useState(tenants[0]?.id || '');
  const [catWorkspace, setCatWorkspace] = useState('');
  
  const [slaName, setSlaName] = useState('');
  const [slaResponse, setSlaResponse] = useState(4);
  const [slaResolution, setSlaResolution] = useState(24);
  const [slaTenant, setSlaTenant] = useState(tenants[0]?.id || '');
  const [slaWorkspace, setSlaWorkspace] = useState('');

  const [error, setError] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catTenant) return;

    setIsCategoryLoading(true);
    setError('');

    const payload: CategoryPayload = {
      name: catName,
      description: catDesc,
      tenantId: catTenant,
      workspaceId: catWorkspace || undefined
    };

    const res = await createCategory(payload);
    if (res.success && res.data) {
      setCategories([...categories, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setCatName('');
      setCatDesc('');
    } else {
      setError(res.error || 'Failed to create category');
    }
    setIsCategoryLoading(false);
  };

  const handleCreateSLA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slaName || !slaTenant) return;

    setIsSlaLoading(true);
    setError('');

    const payload: SLAPayload = {
      name: slaName,
      responseHours: slaResponse,
      resolutionHours: slaResolution,
      tenantId: slaTenant,
      workspaceId: slaWorkspace || undefined
    };

    const res = await createSLA(payload);
    if (res.success && res.data) {
      setSlas([...slas, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setSlaName('');
      setSlaResponse(4);
      setSlaResolution(24);
    } else {
      setError(res.error || 'Failed to create SLA');
    }
    setIsSlaLoading(false);
  };

  const handleDeleteCategory = async (id: string, tenantId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    const res = await deleteCategory(id, tenantId);
    if (res.success) {
      setCategories(categories.filter(c => c.id !== id));
    } else {
      alert(res.error);
    }
  };

  const handleDeleteSLA = async (id: string, tenantId: string) => {
    if (!confirm('Are you sure you want to delete this SLA?')) return;
    const res = await deleteSLA(id, tenantId);
    if (res.success) {
      setSlas(slas.filter(s => s.id !== id));
    } else {
      alert(res.error);
    }
  };

  const baseInputStyle = "w-full p-2 bg-surface-container-lowest dark:bg-[#0b0f10] border border-surface-container dark:border-white/10 rounded-md text-sm text-on-background dark:text-white pb-2 focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Category Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-on-background dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" /> Ticket Categories
          </h2>
          <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">Classify tickets by topic (e.g. Hardware, Network).</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 text-red-600 rounded text-sm">{error}</div>}

        <div className="bg-surface-container-low dark:bg-[#12181b] p-6 rounded-xl border border-surface-container dark:border-white/5 mb-8">
          <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Tenant *</label>
                <select value={catTenant} onChange={e => setCatTenant(e.target.value)} className={baseInputStyle} required>
                  <option value="" disabled>Select Tenant</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Workspace (Optional)</label>
                <select value={catWorkspace} onChange={e => setCatWorkspace(e.target.value)} className={baseInputStyle}>
                  <option value="">Global (All Workspaces)</option>
                  {workspaces.filter(w => w.tenantId === catTenant).map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Category Name *</label>
              <input type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Software Licenses" className={baseInputStyle} required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Description</label>
              <input type="text" value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Short description" className={baseInputStyle} />
            </div>

            <button type="submit" disabled={isCategoryLoading} className="mt-2 bg-primary text-on-primary font-medium py-2 px-4 rounded-md text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              {isCategoryLoading ? 'Creating...' : 'Create Category'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2">
          {categories.map(cat => {
            const tName = tenants.find(t => t.id === cat.tenantId)?.name || 'Unknown';
            return (
              <div key={cat.id} className="p-4 bg-surface-container-lowest dark:bg-white/5 border border-surface-container dark:border-white/10 rounded-lg flex items-center justify-between group hover:bg-surface-bright dark:hover:bg-white/10 transition-colors">
                <div>
                  <h4 className="text-sm font-semibold text-on-background dark:text-white flex items-center gap-2">
                    {cat.name}
                  </h4>
                  <div className="text-[11px] text-on-surface-variant dark:text-gray-400 mt-1 flex gap-2">
                    <span className="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded">{tName}</span>
                    {cat.workspace && <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded">{cat.workspace.name}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteCategory(cat.id, cat.tenantId)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-error hover:bg-error/10 rounded-md transition-all"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          {categories.length === 0 && <p className="text-sm text-on-surface-variant text-center py-4">No categories configured.</p>}
        </div>
      </section>

      {/* SLA Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-on-background dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> SLA Policies
          </h2>
          <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">Define target times for response and resolution.</p>
        </div>

        <div className="bg-surface-container-low dark:bg-[#12181b] p-6 rounded-xl border border-surface-container dark:border-white/5 mb-8">
          <form onSubmit={handleCreateSLA} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Tenant *</label>
                <select value={slaTenant} onChange={e => setSlaTenant(e.target.value)} className={baseInputStyle} required>
                  <option value="" disabled>Select Tenant</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Workspace (Optional)</label>
                <select value={slaWorkspace} onChange={e => setSlaWorkspace(e.target.value)} className={baseInputStyle}>
                  <option value="">Global (All Workspaces)</option>
                  {workspaces.filter(w => w.tenantId === slaTenant).map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Policy Name *</label>
              <input type="text" value={slaName} onChange={e => setSlaName(e.target.value)} placeholder="e.g. VIP Gold Support" className={baseInputStyle} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Response Time (Hours) *</label>
                <input type="number" min="1" value={slaResponse} onChange={e => setSlaResponse(Number(e.target.value))} className={baseInputStyle} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Resolution Time (Hours) *</label>
                <input type="number" min="1" value={slaResolution} onChange={e => setSlaResolution(Number(e.target.value))} className={baseInputStyle} required />
              </div>
            </div>

            <button type="submit" disabled={isSlaLoading} className="mt-2 bg-primary text-on-primary font-medium py-2 px-4 rounded-md text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              {isSlaLoading ? 'Creating...' : 'Create SLA Policy'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2">
          {slas.map(sla => {
            const tName = tenants.find(t => t.id === sla.tenantId)?.name || 'Unknown';
            return (
              <div key={sla.id} className="p-4 bg-surface-container-lowest dark:bg-white/5 border border-surface-container dark:border-white/10 rounded-lg flex items-center justify-between group hover:bg-surface-bright dark:hover:bg-white/10 transition-colors">
                <div>
                  <h4 className="text-sm font-semibold text-on-background dark:text-white flex items-center gap-2">
                    {sla.name}
                  </h4>
                  <div className="text-[11px] text-on-surface-variant dark:text-gray-400 mt-1 flex gap-2 items-center">
                    <span className="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded">{tName}</span>
                    {sla.workspace && <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded">{sla.workspace.name}</span>}
                    <span className="px-1.5 py-0.5 bg-tertiary/10 text-tertiary rounded">Res: {sla.responseHours}h / Sol: {sla.resolutionHours}h</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteSLA(sla.id, sla.tenantId)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-error hover:bg-error/10 rounded-md transition-all"
                  title="Delete SLA"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          {slas.length === 0 && <p className="text-sm text-on-surface-variant text-center py-4">No SLAs configured.</p>}
        </div>
      </section>

    </div>
  );
};
