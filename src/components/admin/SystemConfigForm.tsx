'use client';

import { useState, useTransition } from 'react';
import { updateSystemConfig } from '../../lib/actions/systemConfig';
import { Save, AlertCircle, CheckCircle2, Route } from 'lucide-react';

interface WorkspaceOption {
  id: string;
  name: string;
  tenantName: string; // for SUPER_ADMIN context
}

interface SystemConfigFormProps {
  initialData: {
    baseUrl: string;
    defaultTimezone: string;
    systemEmailSender: string;
    defaultWorkspaceId: string | null;
  };
  workspaces: WorkspaceOption[];
}

export const SystemConfigForm = ({ initialData, workspaces }: SystemConfigFormProps) => {
  const [formData, setFormData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    
    startTransition(async () => {
      const result = await updateSystemConfig({
        baseUrl: formData.baseUrl,
        defaultTimezone: formData.defaultTimezone,
        systemEmailSender: formData.systemEmailSender,
        defaultWorkspaceId: formData.defaultWorkspaceId || null,
      });
      if (result.success) {
        setNotification({ type: 'success', message: 'System configuration updated successfully.' });
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to update configuration.' });
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-surface-container-low dark:bg-white/5 border border-surface-container dark:border-white/5 rounded-xl p-6">
      
      {notification && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="baseUrl" className="block text-sm font-medium text-on-background dark:text-gray-300 mb-1">
            Base URL
          </label>
          <input
            type="url"
            id="baseUrl"
            name="baseUrl"
            value={formData.baseUrl}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-surface-container-lowest dark:bg-[#1a1f24] border border-surface-container dark:border-white/10 rounded-lg text-sm text-on-background dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="https://VelaDesk.yourdomain.com"
          />
          <p className="mt-1 text-xs text-on-surface-variant dark:text-gray-500">
            The canonical URL for this installation (used for links in emails and portal access).
          </p>
        </div>

        <div>
          <label htmlFor="defaultTimezone" className="block text-sm font-medium text-on-background dark:text-gray-300 mb-1">
            Default Timezone
          </label>
          <select
            id="defaultTimezone"
            name="defaultTimezone"
            value={formData.defaultTimezone}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-surface-container-lowest dark:bg-[#1a1f24] border border-surface-container dark:border-white/10 rounded-lg text-sm text-on-background dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="UTC">UTC</option>
            <option value="Europe/Berlin">Europe/Berlin</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </select>
          <p className="mt-1 text-xs text-on-surface-variant dark:text-gray-500">
            The fallback timezone for SLAs and date calculations.
          </p>
        </div>

        <div>
          <label htmlFor="systemEmailSender" className="block text-sm font-medium text-on-background dark:text-gray-300 mb-1">
            System Email Sender
          </label>
          <input
            type="email"
            id="systemEmailSender"
            name="systemEmailSender"
            value={formData.systemEmailSender}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-surface-container-lowest dark:bg-[#1a1f24] border border-surface-container dark:border-white/10 rounded-lg text-sm text-on-background dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="noreply@VelaDesk.local"
          />
          <p className="mt-1 text-xs text-on-surface-variant dark:text-gray-500">
            The default sender address for system notifications (like Magic Links).
          </p>
        </div>

        {/* Routing Section Divider */}
        <div className="pt-4 border-t border-surface-container dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-4 h-4 text-primary dark:text-tertiary" />
            <h3 className="text-sm font-semibold text-on-background dark:text-white">Email Routing</h3>
          </div>

          <div>
            <label htmlFor="defaultWorkspaceId" className="block text-sm font-medium text-on-background dark:text-gray-300 mb-1">
              Default Workspace (Catch-All)
            </label>
            <select
              id="defaultWorkspaceId"
              name="defaultWorkspaceId"
              value={formData.defaultWorkspaceId || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-surface-container-lowest dark:bg-[#1a1f24] border border-surface-container dark:border-white/10 rounded-lg text-sm text-on-background dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">— No Catch-All —</option>
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} ({ws.tenantName})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-on-surface-variant dark:text-gray-500">
              Incoming emails that don&apos;t match any routing rule will be assigned to this workspace. 
              If unset, unmatched emails will be dropped.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-surface-container dark:border-white/5 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Configuration</span>
        </button>
      </div>
    </form>
  );
};
