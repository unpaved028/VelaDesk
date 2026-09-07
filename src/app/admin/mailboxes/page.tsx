import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireAdminContext } from '@/lib/auth/session';
import { MailboxManager } from '@/components/admin/MailboxManager';
import { getMailboxConfigs } from '@/lib/actions/mailboxActions';

export const dynamic = 'force-dynamic';

export default async function AdminMailboxesPage() {
  const admin = await requireAdminContext();
  const configsRes = await getMailboxConfigs();
  const configs = configsRes.success ? configsRes.data : [];

  const workspaces = admin.ok
    ? await prisma.workspace.findMany({
        where: { tenantId: admin.ctx.tenantId },
        include: { tenant: { select: { name: true } } },
        orderBy: { name: 'asc' },
      })
    : [];

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-on-background dark:text-white">Mailbox Configuration</h1>
            <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-2">
              Connect a shared mailbox via Microsoft Graph. Secrets are encrypted at rest (AES-256-GCM, tenant-isolated).
            </p>
          </div>
          <Link
            href="/admin/mailboxes/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary/90"
          >
            Entra / PowerShell setup
          </Link>
        </header>

        <MailboxManager
          initialConfigs={configs || []}
          workspaces={workspaces}
        />
      </div>
    </div>
  );
}
