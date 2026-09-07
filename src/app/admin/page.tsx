import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { BackupButton } from '@/components/admin/BackupButton';
import { MspSeedButton } from '@/components/admin/MspSeedButton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

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
    { label: 'Tenants', value: tenantCount, icon: 'domain' },
    { label: 'Workspaces', value: workspaceCount, icon: 'work' },
    { label: 'Agents', value: agentCount, icon: 'group' },
    { label: 'Tickets', value: ticketCount, icon: 'confirmation_number' },
    { label: 'Mailboxes', value: mailboxCount, icon: 'inbox' },
  ];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-8">
      <AdminPageHeader
        title="Admin Dashboard"
        description="Welcome to the VelaDesk Admin Panel. Use the sidebar to configure the system."
        actions={
          <>
            {categoryCount === 0 ? <MspSeedButton /> : null}
            <BackupButton />
          </>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-2 rounded-xl border border-outline-variant/15 bg-surface-container-low p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                {stat.label}
              </span>
              <span className="material-symbols-outlined text-[18px] text-primary">{stat.icon}</span>
            </div>
            <span className="font-headline text-2xl font-bold text-on-surface">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-6">
        <h3 className="mb-2 font-headline text-lg font-medium text-on-surface">System Status</h3>
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
