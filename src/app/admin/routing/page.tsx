'use client';

import { useState, useEffect } from 'react';
import { RoutingRuleList } from '@/components/admin/RoutingRuleList';
import { RoutingRuleForm } from '@/components/admin/RoutingRuleForm';
import { getRoutingRules } from '@/lib/actions/routingActions';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
// Note: In Phase 2 this will come from a dedicated workspace action
import { PrismaClient } from '@prisma/client';

export default function RoutingManagementPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // For MVP/Demo: Fetching tenant 1. 
  // In Phase 0.6.5/0.8.3 this will use session data.
  const DEFAULT_TENANT_ID = "cm0yid8z60000kltw11h87msn"; 

  const fetchData = async () => {
    setLoading(true);
    const result = await getRoutingRules(DEFAULT_TENANT_ID);
    
    // Fetch workspaces - in a real client component we'd use a server action
    // but for simplicity here we fetch via an internal API or pass from parent if it were server-side.
    // For this task, we'll simulate the load.
    if (result.success) {
      setRules(result.data || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    
    // Simulate fetching workspaces (Normally via Server Action passed to Client Component)
    // We'll use a fetch to an internal API we assume exists or a mock for this UI task.
    fetch('/api/admin/workspaces?tenantId=' + DEFAULT_TENANT_ID)
      .then(res => res.json())
      .then(json => {
        if (json.success) setWorkspaces(json.data);
      })
      .catch(() => {
        // Fallback for demo if API route is not yet ready
        setWorkspaces([
          { id: "cm0yid8z90001kltwpxunv2k4", name: "IT Support" },
          { id: "cm0yid8zb0002kltw1z7r5v0p", name: "HR Service" }
        ]);
      });
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar">
      <AdminPageHeader
        title="Email Routing Rules"
        description="Manage how incoming emails are assigned to specific workspaces based on sender patterns."
        actions={
          <>
            <button
              onClick={fetchData}
              className="rounded-xl border border-outline-variant/20 p-2.5 text-on-surface transition-colors hover:bg-surface-container"
              title="Reload"
              type="button"
            >
              <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add New Rule
            </button>
          </>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
          <span className="text-xs font-medium text-on-surface-variant dark:text-gray-500">Loading rules...</span>
        </div>
      ) : (
        <RoutingRuleList 
          tenantId={DEFAULT_TENANT_ID} 
          initialRules={rules} 
          workspaces={workspaces}
        />
      )}

      {showAddForm && (
        <RoutingRuleForm
          tenantId={DEFAULT_TENANT_ID}
          workspaces={workspaces}
          onClose={() => setShowAddForm(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
