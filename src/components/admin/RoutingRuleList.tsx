'use client';

import { useState } from 'react';
import { deleteRoutingRule, updateRoutingRule } from '@/lib/actions/routingActions';
import { 
  GripVertical, 
  Trash2, 
  Edit2, 
  ChevronUp, 
  ChevronDown, 
  ArrowRight,
  Hash
} from 'lucide-react';
import { RoutingRuleForm } from './RoutingRuleForm';

interface RoutingRule {
  id: string;
  emailPattern: string;
  priority: number;
  isActive: boolean;
  description: string | null;
  workspaceId: string;
  workspace: {
    id: string;
    name: string;
  };
}

interface RoutingRuleListProps {
  tenantId: string;
  initialRules: RoutingRule[];
  workspaces: { id: string; name: string }[];
}

export const RoutingRuleList = ({ tenantId, initialRules, workspaces }: RoutingRuleListProps) => {
  const [rules, setRules] = useState(initialRules);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newRules = [...rules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newRules.length) return;

    // Swap locally for instant feedback
    const [moved] = newRules.splice(index, 1);
    newRules.splice(targetIndex, 0, moved);

    // Update priorities locally
    const updatedWithNewPriorities = newRules.map((rule, idx) => ({
      ...rule,
      priority: (idx + 1) * 10
    }));
    
    setRules(updatedWithNewPriorities);

    // Persist to DB
    // In a real scenario, we might want to do this in bulk, but for now we update the moved rule
    await Promise.all(
      updatedWithNewPriorities.map(r => 
        updateRoutingRule({ id: r.id, tenantId, priority: r.priority })
      )
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    setIsDeleting(id);
    const result = await deleteRoutingRule(id, tenantId);
    if (result.success) {
      setRules(rules.filter(r => r.id !== id));
    }
    setIsDeleting(null);
  };

  const handleToggle = async (rule: RoutingRule) => {
    const newStatus = !rule.isActive;
    const result = await updateRoutingRule({ id: rule.id, tenantId, isActive: newStatus });
    if (result.success) {
      setRules(rules.map(r => r.id === rule.id ? { ...r, isActive: newStatus } : r));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface dark:bg-[#12181b] border border-surface-container dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low dark:bg-white/5 border-b border-surface-container dark:border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant dark:text-gray-400 tracking-widest uppercase">Priority</th>
                <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant dark:text-gray-400 tracking-widest uppercase">Target Pattern</th>
                <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant dark:text-gray-400 tracking-widest uppercase text-center w-10">Route</th>
                <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant dark:text-gray-400 tracking-widest uppercase">Desktop/Workspace</th>
                <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant dark:text-gray-400 tracking-widest uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant dark:text-gray-400 tracking-widest uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container dark:divide-white/5">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-on-surface-variant dark:text-gray-500 italic">
                    No routing rules defined yet.
                  </td>
                </tr>
              ) : (
                rules.map((rule, index) => (
                  <tr key={rule.id} className={`group hover:bg-surface-bright dark:hover:bg-white/[0.02] transition-colors ${!rule.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-primary dark:text-tertiary">
                           {index + 1}
                        </span>
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            disabled={index === 0}
                            onClick={() => handleMove(index, 'up')}
                            className="p-0.5 hover:bg-surface-container dark:hover:bg-white/10 rounded disabled:opacity-30"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button 
                            disabled={index === rules.length - 1}
                            onClick={() => handleMove(index, 'down')}
                            className="p-0.5 hover:bg-surface-container dark:hover:bg-white/10 rounded disabled:opacity-30"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-on-background dark:text-white font-mono">
                          {rule.emailPattern}
                        </span>
                        {rule.description && (
                          <span className="text-[11px] text-on-surface-variant dark:text-gray-500 mt-1 line-clamp-1">
                            {rule.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <ArrowRight className="w-4 h-4 text-on-surface-variant/30 inline" />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface-container dark:bg-white/5 text-on-surface-variant dark:text-white text-xs font-medium rounded-lg border border-surface-container dark:border-white/5">
                        <Hash className="w-3 h-3 text-primary dark:text-tertiary" />
                        {rule.workspace.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggle(rule)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${rule.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                      >
                        <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${rule.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingRule(rule)}
                          className="p-2 text-on-surface-variant hover:text-primary dark:hover:text-white hover:bg-primary/10 dark:hover:bg-white/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(rule.id)}
                          disabled={isDeleting === rule.id}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          {isDeleting === rule.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingRule && (
        <RoutingRuleForm
          tenantId={tenantId}
          workspaces={workspaces}
          initialData={editingRule}
          onClose={() => setEditingRule(null)}
          onSuccess={() => window.location.reload()} // Simple refresh to show new state
        />
      )}
    </div>
  );
};
