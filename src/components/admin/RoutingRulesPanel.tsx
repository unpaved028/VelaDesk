'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoutingRuleList } from '@/components/admin/RoutingRuleList';
import { RoutingRuleForm } from '@/components/admin/RoutingRuleForm';

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

interface RoutingRulesPanelProps {
  tenantId: string;
  initialRules: RoutingRule[];
  workspaces: { id: string; name: string }[];
}

export const RoutingRulesPanel = ({ tenantId, initialRules, workspaces }: RoutingRulesPanelProps) => {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          disabled={workspaces.length === 0}
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add New Rule
        </button>
      </div>

      {workspaces.length === 0 ? (
        <p className="text-sm text-on-surface-variant">
          No workspaces in this tenant. Create a workspace before adding a routing rule.
        </p>
      ) : (
        <RoutingRuleList tenantId={tenantId} initialRules={initialRules} workspaces={workspaces} />
      )}

      {showAddForm ? (
        <RoutingRuleForm
          tenantId={tenantId}
          workspaces={workspaces}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
};
