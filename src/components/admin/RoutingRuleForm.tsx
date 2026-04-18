'use client';

import { useState, useTransition } from 'react';
import { createRoutingRule, updateRoutingRule } from '@/lib/actions/routingActions';
import { Save, X, Info } from 'lucide-react';

interface WorkspaceOption {
  id: string;
  name: string;
}

interface RoutingRuleFormProps {
  tenantId: string;
  workspaces: WorkspaceOption[];
  initialData?: {
    id: string;
    emailPattern: string;
    workspaceId: string;
    priority: number;
    description: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const RoutingRuleForm = ({ 
  tenantId, 
  workspaces, 
  initialData, 
  onClose, 
  onSuccess 
}: RoutingRuleFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    emailPattern: initialData?.emailPattern || '',
    workspaceId: initialData?.workspaceId || workspaces[0]?.id || '',
    priority: initialData?.priority || 100,
    description: initialData?.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = initialData 
        ? await updateRoutingRule({
            id: initialData.id,
            tenantId,
            ...formData,
            description: formData.description || null
          })
        : await createRoutingRule({
            tenantId,
            ...formData
          });

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Operation failed');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface dark:bg-[#12181b] border border-surface-container dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-surface-container dark:border-white/5 flex justify-between items-center bg-surface-bright dark:bg-white/5">
          <h2 className="text-lg font-bold text-on-background dark:text-white">
            {initialData ? 'Edit Routing Rule' : 'New Routing Rule'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-container dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-error-container/20 border border-error/20 rounded-lg text-error text-xs font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-on-surface-variant dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Email Pattern
            </label>
            <input
              type="text"
              required
              placeholder="e.g. *@company.com or support@*"
              value={formData.emailPattern}
              onChange={e => setFormData({ ...formData, emailPattern: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-lowest dark:bg-[#1a1f24] border border-surface-container dark:border-white/10 rounded-xl text-sm text-on-background dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="mt-1.5 text-[10px] text-on-surface-variant dark:text-gray-500 italic">
              Use * for wildcards. Patterns are checked by priority (lowest number first).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Target Workspace
            </label>
            <select
              required
              value={formData.workspaceId}
              onChange={e => setFormData({ ...formData, workspaceId: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-lowest dark:bg-[#1a1f24] border border-surface-container dark:border-white/10 rounded-xl text-sm text-on-background dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-lowest dark:bg-[#1a1f24] border border-surface-container dark:border-white/10 rounded-xl text-sm text-on-background dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Why this rule exists..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-surface-container dark:border-white/10 text-on-background dark:text-white rounded-xl text-sm font-medium hover:bg-surface-bright dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-gray-100 transition-all disabled:opacity-50 shadow-lg shadow-black/5"
            >
              {isPending ? <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" /> : <Save className="w-4 h-4" />}
              Save Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
