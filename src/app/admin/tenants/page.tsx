import React from 'react';
import { getTenants } from '../../../lib/actions/tenantActions';
import { TenantManager } from '../../../components/admin/TenantManager';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

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
      <AdminPageHeader
        title="Tenant Management"
        description="Create and manage customer organizations (Tenants) in your installation."
      />
      
      <TenantManager initialTenants={result.data} />
    </div>
  );
}
