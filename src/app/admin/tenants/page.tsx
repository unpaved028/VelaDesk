import React from 'react';
import { getTenants } from '../../../lib/actions/tenantActions';
import { TenantManager } from '../../../components/admin/TenantManager';

export const dynamic = 'force-dynamic';

export default async function TenantsPage() {
  const result = await getTenants();
  
  if (!result.success || !result.data) {
    return (
      <div className="p-8 h-full overflow-y-auto custom-scrollbar">
        <div className="p-4 bg-red-500/10 text-red-600 rounded-lg">
          Failed to load tenants: {result.error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-on-background dark:text-white">Tenant Management</h1>
        <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-1">
          Create and manage customer organizations (Tenants) in your installation.
        </p>
      </header>
      
      <TenantManager initialTenants={result.data} />
    </div>
  );
}
