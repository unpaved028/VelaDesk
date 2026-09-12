import { prisma } from '@/lib/db/prisma';
import { GraphApiHelper } from '@/lib/api/graph';
import type { BackupRunResult } from '@/types/backup';
import { BACKUP_RETENTION_COUNT, looksLikeSharePointUrl, resolveBackupTarget } from './backupTarget';
import { decryptSecret } from './encryption';
import { GraphDriveClient } from './graphDrive';
import { createSqliteBackupGzip } from './sqliteBackup';

export async function runOffsiteBackup(): Promise<BackupRunResult> {
  const config = await prisma.systemConfig.findUnique({
    where: { id: 'global' },
    select: {
      backupTargetMailbox: true,
      backupTargetFolder: true,
    },
  });

  const mailboxAddress = config?.backupTargetMailbox?.trim() || null;
  const folderOrUrl = config?.backupTargetFolder?.trim() || '';

  if (!mailboxAddress && !looksLikeSharePointUrl(folderOrUrl)) {
    return { ok: true, skipped: true, reason: 'no_target' };
  }

  if (!mailboxAddress) {
    return {
      ok: false,
      error: 'Select the mailbox whose Graph app should upload the backup.',
    };
  }

  // Instance-level vault: the mailbox is the Graph credential source, not a tenant-scoped ticket store.
  const mailbox = await prisma.mailboxConfig.findFirst({
    where: { mailboxAddress, isActive: true },
  });

  if (!mailbox) {
    return { ok: false, error: `No active mailbox config for ${mailboxAddress}.` };
  }

  try {
    const target = resolveBackupTarget({ mailboxAddress, folderOrUrl });
    const clientSecret = decryptSecret(mailbox.clientSecret, mailbox.tenantId);
    const graph = new GraphApiHelper({
      tenantId: mailbox.msTenantId,
      clientId: mailbox.clientId,
      clientSecret,
    });
    const token = await graph.getAccessToken();
    const drive = new GraphDriveClient(token, target);
    const snapshot = await createSqliteBackupGzip();
    await drive.upload(snapshot.buffer, snapshot.fileName);
    await drive.prune(BACKUP_RETENTION_COUNT);

    return {
      ok: true,
      skipped: false,
      fileName: snapshot.fileName,
      bytes: snapshot.buffer.length,
      destination: drive.destination(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Offsite backup failed.';
    console.error('[BackupWorker] Backup failed:', message);
    return { ok: false, error: message };
  }
}

export class BackupWorker {
  public static async executeBackup(): Promise<BackupRunResult> {
    return runOffsiteBackup();
  }
}
