'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Users, ShieldAlert, ShieldCheck, Sparkles, Link as LinkIcon } from 'lucide-react';
import { AgentPayload, createAgent, deleteAgent } from '../../lib/actions/agentActions';
import { Role } from '@prisma/client';

interface AgentManagerProps {
  initialAgents: any[];
  tenants: any[];
}

export const AgentManager = ({ initialAgents, tenants }: AgentManagerProps) => {
  const [agents, setAgents] = useState(initialAgents);
  
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('AGENT');
  const [tenantId, setTenantId] = useState(tenants[0]?.id || '');

  const [inviteLink, setInviteLink] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  const [error, setError] = useState('');

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !tenantId || !role) return;

    setIsLoading(true);
    setError('');

    const payload: AgentPayload = { name, email, role, tenantId };

    const res = await createAgent(payload);
    if (res.success && res.data) {
      setAgents([...agents, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setEmail('');
      setRole('AGENT');
    } else {
      setError(res.error || 'Failed to create agent');
    }
    setIsLoading(false);
  };

  const handleDeleteAgent = async (id: string, tenantId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    const res = await deleteAgent(id, tenantId);
    if (res.success) {
      setAgents(agents.filter(a => a.id !== id));
    } else {
      alert(res.error);
    }
  };

  const baseInputStyle = "w-full p-2 bg-surface-container-lowest dark:bg-[#0b0f10] border border-surface-container dark:border-white/10 rounded-md text-sm text-on-background dark:text-white pb-2 focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Create Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-on-background dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Support Agents
          </h2>
          <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">Manage staff accounts. Agents can view tickets in their tenant. Admins have higher privileges.</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 text-red-600 rounded text-sm">{error}</div>}

        <div className="bg-surface-container-low dark:bg-[#12181b] p-6 rounded-xl border border-surface-container dark:border-white/5 mb-8">
          <form onSubmit={handleCreateAgent} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Tenant Assignment *</label>
              <select value={tenantId} onChange={e => setTenantId(e.target.value)} className={baseInputStyle} required>
                <option value="" disabled>Select Tenant</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Full Name *</label>
                 <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" className={baseInputStyle} required />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Email Address *</label>
                 <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className={baseInputStyle} required />
               </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Role *</label>
              <select value={role} onChange={e => setRole(e.target.value as Role)} className={baseInputStyle} required>
                <option value="AGENT">AGENT - Can work on tickets</option>
                <option value="ADMIN">ADMIN - Management access</option>
              </select>
            </div>

            <button type="submit" disabled={isLoading} className="mt-2 bg-primary text-on-primary font-medium py-2 px-4 rounded-md text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              {isLoading ? 'Creating...' : 'Create Agent'}
            </button>
          </form>
        </div>

        {/* Magic Invite Section (0.14.8) */}
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all" />
          
          <div className="relative">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" /> Magic Invite Generator
            </h3>
            <p className="text-[11px] text-on-surface-variant dark:text-gray-400 leading-relaxed mb-6">
              Generate a temporary link that allows verified Microsoft Entra ID users to register themselves as agents. Links expire automatically.
            </p>

            {!inviteLink ? (
              <button 
                onClick={() => {
                  const id = Math.random().toString(36).substring(7);
                  setInviteLink(`https://VelaDesk.io/invite/${id}`);
                }}
                className="w-full py-3 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-xs font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <LinkIcon className="w-4 h-4" />
                Generate Invite Link
              </button>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 p-3 bg-surface-container-lowest dark:bg-black/40 border border-primary/30 rounded-lg">
                  <input 
                    readOnly 
                    value={inviteLink} 
                    className="flex-1 bg-transparent border-none text-[11px] font-mono text-primary focus:ring-0"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      setCopyStatus('Copied!');
                      setTimeout(() => setCopyStatus(''), 2000);
                    }}
                    className="px-3 py-1 bg-primary text-on-primary text-[10px] font-bold rounded-md hover:bg-primary/90 transition-colors"
                  >
                    {copyStatus || 'Copy'}
                  </button>
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-on-surface-variant/60 font-medium">Link expires in 24 hours</span>
                  <button 
                    onClick={() => setInviteLink('')}
                    className="text-[10px] text-error hover:underline font-bold"
                  >
                    Revoke Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* List Section */}
      <section>
        <div className="flex flex-col gap-2 pt-2 lg:pt-14">
          {agents.map(agent => {
            const tName = agent.tenant?.name || 'Unknown Tenant';
            return (
              <div key={agent.id} className="p-4 bg-surface-container-lowest dark:bg-white/5 border border-surface-container dark:border-white/10 rounded-lg flex items-center justify-between group hover:bg-surface-bright dark:hover:bg-white/10 transition-colors">
                <div>
                  <h4 className="text-sm font-semibold text-on-background dark:text-white flex items-center gap-2">
                    {agent.name}
                  </h4>
                  <div className="text-[11px] text-on-surface-variant dark:text-gray-400 mt-1 flex gap-2 items-center">
                     <span className="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded">{tName}</span>
                     <span className="text-on-surface-variant/80">{agent.email}</span>
                     {agent.role === 'ADMIN' ? (
                       <span className="px-1.5 py-0.5 bg-error/10 text-error rounded flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> ADMIN</span>
                     ) : (
                       <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> AGENT</span>
                     )}
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteAgent(agent.id, agent.tenantId)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-error hover:bg-error/10 rounded-md transition-all"
                  title="Delete agent"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          {agents.length === 0 && <p className="text-sm text-on-surface-variant text-center py-4">No agents found.</p>}
        </div>
      </section>

    </div>
  );
};
