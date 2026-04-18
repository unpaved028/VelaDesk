'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Inbox, Eye, EyeOff, CheckCircle2, XCircle, KeyRound } from 'lucide-react';
import { MailboxPayload, saveMailboxConfig, deleteMailboxConfig } from '../../lib/actions/mailboxActions';

interface Workspace {
  id: string;
  name: string;
  tenantId: string;
  tenant?: { name: string };
}

interface MailboxConfig {
  id: string;
  tenantId: string;
  workspaceId: string;
  clientId: string;
  clientSecret: string; // Always redacted from server
  msTenantId: string;
  isActive: boolean;
  workspace: Workspace;
}

interface MailboxManagerProps {
  initialConfigs: MailboxConfig[];
  workspaces: Workspace[];
}

export const MailboxManager = ({ initialConfigs, workspaces }: MailboxManagerProps) => {
  const [configs, setConfigs] = useState<MailboxConfig[]>(initialConfigs);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [workspaceId, setWorkspaceId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [msTenantId, setMsTenantId] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Workspaces that already have a config should not appear in new-config dropdown
  const configuredWorkspaceIds = new Set(configs.map(c => c.workspaceId));
  const availableWorkspaces = workspaces.filter(w => !configuredWorkspaceIds.has(w.id));

  const resetForm = () => {
    setWorkspaceId('');
    setClientId('');
    setClientSecret('');
    setMsTenantId('');
    setShowSecret(false);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !clientId || !clientSecret || !msTenantId) {
      setError('All fields are required for a new mailbox configuration.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    const selectedWorkspace = workspaces.find(w => w.id === workspaceId);
    if (!selectedWorkspace) {
      setError('Selected workspace not found.');
      setIsLoading(false);
      return;
    }

    const payload: MailboxPayload = {
      workspaceId,
      tenantId: selectedWorkspace.tenantId,
      clientId,
      clientSecret,
      msTenantId,
    };

    const res = await saveMailboxConfig(payload);
    if (res.success && res.data) {
      // Refetch-like behavior: add new config to state with redacted secret
      const newConfig: MailboxConfig = {
        id: res.data.id,
        tenantId: res.data.tenantId,
        workspaceId: res.data.workspaceId,
        clientId: res.data.clientId,
        clientSecret: '********',
        msTenantId: res.data.msTenantId,
        isActive: res.data.isActive,
        workspace: selectedWorkspace as MailboxConfig['workspace'],
      };

      setConfigs(prev => {
        const exists = prev.find(c => c.workspaceId === newConfig.workspaceId);
        if (exists) {
          return prev.map(c => c.workspaceId === newConfig.workspaceId ? newConfig : c);
        }
        return [...prev, newConfig];
      });
      resetForm();
      setSuccess('Mailbox configuration saved. Client Secret has been encrypted.');
    } else {
      setError(res.error || 'Failed to save mailbox configuration.');
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string, tenantId: string) => {
    if (!confirm('Are you sure you want to delete this mailbox configuration? The Graph API connection will be lost.')) return;
    const res = await deleteMailboxConfig(id, tenantId);
    if (res.success) {
      setConfigs(prev => prev.filter(c => c.id !== id));
      setSuccess('Mailbox configuration deleted.');
    } else {
      alert(res.error || 'Failed to delete.');
    }
  };

  const baseInputStyle = "w-full p-2 bg-surface-container-lowest dark:bg-[#0b0f10] border border-surface-container dark:border-white/10 rounded-md text-sm text-on-background dark:text-white focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* Create / Edit Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-on-background dark:text-white flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" /> New Mailbox Connection
          </h2>
          <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">
            Connect a workspace to Microsoft 365 via Graph API. The Client Secret will be encrypted with AES-256-GCM before storage.
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 text-red-600 rounded text-sm flex items-center gap-2"><XCircle className="w-4 h-4 shrink-0" />{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-500/10 text-green-600 rounded text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{success}</div>}

        <div className="bg-surface-container-low dark:bg-[#12181b] p-6 rounded-xl border border-surface-container dark:border-white/5">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Workspace *</label>
              <select value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} className={baseInputStyle} required>
                <option value="" disabled>Select Workspace</option>
                {availableWorkspaces.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.tenant?.name || 'Unknown Tenant'})</option>
                ))}
              </select>
              {availableWorkspaces.length === 0 && (
                <p className="text-xs text-on-surface-variant dark:text-gray-500 mt-1 italic">All workspaces already have a mailbox configured.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Azure AD Client ID *</label>
              <input
                type="text"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className={baseInputStyle}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">
                Azure AD Client Secret * <KeyRound className="w-3 h-3 inline text-amber-500" />
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={e => setClientSecret(e.target.value)}
                  placeholder="Enter Client Secret (will be encrypted)"
                  className={`${baseInputStyle} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface transition-colors"
                  title={showSecret ? 'Hide secret' : 'Show secret'}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">⚠ This value is encrypted with AES-256-GCM (tenant-isolated) before storage. It cannot be retrieved in plaintext.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface dark:text-gray-300 mb-1">Microsoft Tenant ID *</label>
              <input
                type="text"
                value={msTenantId}
                onChange={e => setMsTenantId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className={baseInputStyle}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || availableWorkspaces.length === 0}
              className="mt-2 bg-primary text-on-primary font-medium py-2 px-4 rounded-md text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isLoading ? 'Encrypting & Saving...' : 'Save Mailbox Configuration'}
            </button>
          </form>
        </div>
      </section>

      {/* List Section */}
      <section>
        <div className="mb-6 pt-0 lg:pt-14">
          <h2 className="text-sm font-semibold text-on-surface-variant dark:text-gray-400 uppercase tracking-wider">
            Configured Mailboxes ({configs.length})
          </h2>
        </div>

        <div className="flex flex-col gap-2">
          {configs.map(config => {
            const tenantName = config.workspace?.tenant?.name || 'Unknown';
            return (
              <div
                key={config.id}
                className="p-4 bg-surface-container-lowest dark:bg-white/5 border border-surface-container dark:border-white/10 rounded-lg group hover:bg-surface-bright dark:hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-on-background dark:text-white flex items-center gap-2">
                      <Inbox className="w-4 h-4 text-primary shrink-0" />
                      {config.workspace?.name || config.workspaceId}
                    </h4>
                    <div className="mt-2 space-y-1">
                      <div className="text-[11px] text-on-surface-variant dark:text-gray-400 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded">{tenantName}</span>
                        <span className={`px-1.5 py-0.5 rounded ${config.isActive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                          {config.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-[11px] text-on-surface-variant/70 dark:text-gray-500 font-mono space-y-0.5">
                        <div>Client ID: <span className="text-on-surface-variant dark:text-gray-400">{config.clientId}</span></div>
                        <div>MS Tenant: <span className="text-on-surface-variant dark:text-gray-400">{config.msTenantId}</span></div>
                        <div>Secret: <span className="text-amber-600 dark:text-amber-400">●●●●●●●● (encrypted)</span></div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(config.id, config.tenantId)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-error hover:bg-error/10 rounded-md transition-all shrink-0"
                    title="Delete mailbox configuration"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {configs.length === 0 && (
            <div className="text-center py-8">
              <Inbox className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">No mailbox configurations found.</p>
              <p className="text-xs text-on-surface-variant/60 mt-1">Use the form to connect a workspace to Microsoft 365.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};
