import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { BackupButton } from '@/components/admin/BackupButton';
import { MspSeedButton } from '@/components/admin/MspSeedButton';
import { Ticket, Users, Building2, Briefcase, Inbox } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [tenantCount, workspaceCount, agentCount, ticketCount, mailboxCount, categoryCount, config] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.workspace.count(),
      prisma.user.count({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'AGENT'] } } }),
      prisma.ticket.count(),
      prisma.mailboxConfig.count({ where: { isActive: true } }),
      prisma.ticketCategory.count(),
      prisma.systemConfig.findUnique({
        where: { id: 'global' },
        select: { entraIdConfigured: true, appVersion: true },
      }),
    ]);

  let ticketStore = 'readable';
  try {
    await prisma.ticket.findFirst({ select: { id: true, parentId: true } });
  } catch {
    ticketStore = 'schema mismatch';
  }

  const facts = [
    config?.entraIdConfigured
      ? 'Microsoft Entra SSO is marked configured.'
      : 'Microsoft Entra is not configured. Staff sign in with Magic Link.',
    mailboxCount > 0
      ? `${mailboxCount} active mailbox${mailboxCount === 1 ? '' : 'es'} — outbound mail can use Graph.`
      : 'No active mailbox — Magic Links and public replies are not emailed.',
    ticketStore === 'readable'
      ? `Ticket store is readable (${ticketCount} ticket${ticketCount === 1 ? '' : 's'}).`
      : 'Ticket store has a schema mismatch. Queue pages can fail until the database is migrated.',
  ];

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
        <div className="flex items-center gap-3">
          {categoryCount === 0 ? <MspSeedButton /> : null}
          <BackupButton />
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-low dark:bg-white/5 p-5 rounded-xl border border-surface-container dark:border-white/5 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-on-surface-variant dark:text-gray-400 uppercase tracking-wider">
                {stat.label}
              </span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <span className="text-2xl font-bold text-on-background dark:text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-low dark:bg-white/5 p-6 rounded-xl border border-surface-container dark:border-white/5">
        <h3 className="font-medium text-lg mb-2 text-on-background dark:text-white">System Status</h3>
        <p className="text-xs text-on-surface-variant mb-3">
          Version {config?.appVersion || 'unknown'}
        </p>
        <ul className="space-y-2 text-sm text-on-surface-variant">
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
