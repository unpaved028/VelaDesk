import { prisma } from '@/lib/db/prisma';
import { MailboxManager } from '@/components/admin/MailboxManager';
import { getMailboxConfigs } from '@/lib/actions/mailboxActions';

export const dynamic = 'force-dynamic';

export default async function AdminMailboxesPage() {
  const configsRes = await getMailboxConfigs();
  const configs = configsRes.success ? configsRes.data : [];

  // Fetch all workspaces with their tenant info for the dropdown
  const workspaces = await prisma.workspace.findMany({
    include: { tenant: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-on-background dark:text-white">Mailbox Configuration</h1>
          <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-2">
            Connect workspaces to Microsoft 365 via Graph API. Client Secrets are encrypted at rest using AES-256-GCM with tenant-isolated key derivation.
          </p>
        </header>

        <MailboxManager
          initialConfigs={configs || []}
          workspaces={workspaces}
        />
      </div>
    </div>
  );
}
