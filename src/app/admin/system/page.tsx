import React from 'react';
import { getSystemConfig } from '../../../lib/actions/systemConfig';
import { SystemConfigForm } from '../../../components/admin/SystemConfigForm';
import { UpdateDashboard } from '../../../components/admin/UpdateDashboard';
import { BackupConfigForm } from '../../../components/admin/BackupConfigForm';
import { NetworkSecurityForm } from '../../../components/admin/NetworkSecurityForm';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function SystemConfigPage() {
  const [result, workspaces, mailboxes] = await Promise.all([
    getSystemConfig(),
    prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        tenant: {
          select: { name: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.mailboxConfig.findMany({
      where: { isActive: true },
      select: { id: true, mailboxAddress: true }
    })
  ]);
  
  if (!result.success || !result.data) {
    return (
      <div className="p-8 h-full overflow-y-auto custom-scrollbar">
        <div className="p-4 bg-red-500/10 text-red-600 rounded-lg">
          Failed to load system configuration: {result.error}
        </div>
      </div>
    );
  }

  const workspaceOptions = workspaces.map(ws => ({
    id: ws.id,
    name: ws.name,
    tenantName: ws.tenant.name,
  }));

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-transparent">
      <header className="mb-12">
        <h1 className="text-3xl font-black tracking-tighter text-on-background dark:text-white uppercase">System Console</h1>
        <p className="text-sm font-medium text-on-surface-variant/60 mt-1">
          Manage core installation parameters and software lifecycle.
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-12">
        {/* Update Engine - Primary focus for lifecycle management */}
        <div className="lg:col-span-12 xl:col-span-5">
          <UpdateDashboard />
        </div>

        {/* Configuration Form - Secondary but detailed settings */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white dark:bg-white/5 rounded-[40px] border border-surface-container dark:border-white/5 p-8 md:p-12 shadow-2xl dark:shadow-none">
          <h3 className="text-lg font-black tracking-tight mb-10 flex items-center gap-3 underline decoration-primary/20 decoration-8 underline-offset-4">
            Configuration
          </h3>
          <SystemConfigForm 
            initialData={{
              baseUrl: result.data.baseUrl,
              defaultTimezone: result.data.defaultTimezone,
              systemEmailSender: result.data.systemEmailSender,
              defaultWorkspaceId: result.data.defaultWorkspaceId ?? null,
            }}
            workspaces={workspaceOptions}
          />
        </div>

        {/* Offsite Backup - Task 0.15.5 */}
        <div className="lg:col-span-12">
          <BackupConfigForm 
            initialData={{
              backupSchedule: result.data.backupSchedule,
              backupTargetMailbox: result.data.backupTargetMailbox ?? null,
              backupTargetFolder: result.data.backupTargetFolder,
            }}
            mailboxes={mailboxes}
          />
        </div>

        {/* Network & Security - Task 1.0.9 */}
        <div className="lg:col-span-12">
          <NetworkSecurityForm />
        </div>
      </div>
    </div>
  );
}
