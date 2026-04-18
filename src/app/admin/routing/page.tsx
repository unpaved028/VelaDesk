'use client';

import { useState, useEffect } from 'react';
import { RoutingRuleList } from '@/components/admin/RoutingRuleList';
import { RoutingRuleForm } from '@/components/admin/RoutingRuleForm';
import { getRoutingRules } from '@/lib/actions/routingActions';
import { Plus, Route, RefreshCcw } from 'lucide-react';
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
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Route className="w-5 h-5 text-primary dark:text-tertiary" />
            <span className="text-xs font-bold text-primary dark:text-tertiary uppercase tracking-widest">Automation</span>
          </div>
          <h1 className="text-2xl font-bold text-on-background dark:text-white">Email Routing Rules</h1>
          <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-1">
            Manage how incoming emails are assigned to specific workspaces based on sender patterns.
          </p>
        </div>
        
        <div className="flex gap-2">
           <button 
            onClick={fetchData}
            className="p-2.5 border border-surface-container dark:border-white/10 text-on-background dark:text-white rounded-xl hover:bg-surface-bright dark:hover:bg-white/5 transition-all"
            title="Reload"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-gray-100 transition-all shadow-lg shadow-black/5"
          >
            <Plus className="w-4 h-4" />
            Add New Rule
          </button>
        </div>
      </header>

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
