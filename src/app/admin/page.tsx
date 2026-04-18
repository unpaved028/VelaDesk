import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { BackupButton } from '@/components/admin/BackupButton';
import { Ticket, Users, Building2, Briefcase, Inbox } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Gather quick stats for the dashboard
  const [tenantCount, workspaceCount, agentCount, ticketCount, mailboxCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.workspace.count(),
    prisma.user.count({ where: { role: { in: ['ADMIN', 'AGENT'] } } }),
    prisma.ticket.count(),
    prisma.mailboxConfig.count(),
  ]);

  const stats = [
    { label: 'Tenants', value: tenantCount, icon: Building2, color: 'text-blue-500' },
    { label: 'Workspaces', value: workspaceCount, icon: Briefcase, color: 'text-purple-500' },
    { label: 'Agents', value: agentCount, icon: Users, color: 'text-green-500' },
    { label: 'Tickets', value: ticketCount, icon: Ticket, color: 'text-amber-500' },
    { label: 'Mailboxes', value: mailboxCount, icon: Inbox, color: 'text-cyan-500' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-background dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-1">
            Welcome to the VelaDesk Admin Panel. Use the sidebar to configure the system.
          </p>
        </div>
        <BackupButton />
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-surface-container-low dark:bg-white/5 p-5 rounded-xl border border-surface-container dark:border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-on-surface-variant dark:text-gray-400 uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <span className="text-2xl font-bold text-on-background dark:text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-low dark:bg-white/5 p-6 rounded-xl border border-surface-container dark:border-white/5">
        <h3 className="font-medium text-lg mb-2 text-on-background dark:text-white">System Status</h3>
        <p className="text-sm text-on-surface-variant">All services are operating normally.</p>
      </div>
    </div>
  );
}

