'use server';

import { revalidatePath } from 'next/cache';
import { GraphApiHelper } from '@/lib/api/graph';
import { requireAdminContext, requireSuperAdminContext } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getErrorMessage } from '@/lib/errors';
import { resolveBackupTarget } from '@/lib/services/backupTarget';
import { runOffsiteBackup } from '@/lib/services/backupWorker';
import { decryptSecret } from '@/lib/services/encryption';
import { GraphDriveClient } from '@/lib/services/graphDrive';
import { applySqliteRestore } from '@/lib/services/sqliteBackup';
import { isSystemInitialized } from '@/lib/services/systemInit';
import type { ApiResponse } from '@/types/api';
import type { BackupRunResult, CloudBackupItem, FirstRunCloudCredentials } from '@/types/backup';

async function configuredDriveClient(): Promise<GraphDriveClient> {
  const config = await prisma.systemConfig.findUnique({
    where: { id: 'global' },
    select: { backupTargetMailbox: true, backupTargetFolder: true },
  });

  const mailboxAddress = config?.backupTargetMailbox?.trim() || null;
  if (!mailboxAddress) {
    throw new Error('No backup mailbox configured.');
  }

  const mailbox = await prisma.mailboxConfig.findFirst({
    where: { mailboxAddress, isActive: true },
  });
  if (!mailbox) {
    throw new Error(`No active mailbox config for ${mailboxAddress}.`);
  }

  const target = resolveBackupTarget({
    mailboxAddress,
    folderOrUrl: config?.backupTargetFolder || '',
  });
  const graph = new GraphApiHelper({
    tenantId: mailbox.msTenantId,
    clientId: mailbox.clientId,
    clientSecret: decryptSecret(mailbox.clientSecret, mailbox.tenantId),
  });
  return new GraphDriveClient(await graph.getAccessToken(), target);
}

function driveFromCredentials(input: FirstRunCloudCredentials): Promise<GraphDriveClient> {
  const target = resolveBackupTarget({
    mailboxAddress: input.mailboxAddress.trim(),
    folderOrUrl: input.folderOrUrl.trim(),
  });
  const graph = new GraphApiHelper({
    tenantId: input.msTenantId.trim(),
    clientId: input.clientId.trim(),
    clientSecret: input.clientSecret,
  });
  return graph.getAccessToken().then((token) => new GraphDriveClient(token, target));
}

function requireCloudFields(input: FirstRunCloudCredentials): string | null {
  if (!input.msTenantId.trim() || !input.clientId.trim() || !input.clientSecret.trim()) {
    return 'Entra tenant ID, client ID, and client secret are required.';
  }
  if (!input.mailboxAddress.trim()) {
    return 'Mailbox address is required so Graph can obtain a token.';
  }
  if (!input.folderOrUrl.trim()) {
    return 'Enter a OneDrive folder name or a SharePoint site URL.';
  }
  return null;
}

export async function runOffsiteBackupNow(): Promise<ApiResponse<BackupRunResult>> {
  const auth = await requireAdminContext();
  if (!auth.ok) {
    return { success: false, data: null, error: auth.error };
  }

  const result = await runOffsiteBackup();
  if (!result.ok) {
    return { success: false, data: result, error: result.error };
  }
  if (result.skipped) {
    return { success: false, data: result, error: 'No offsite target configured.' };
  }
  return { success: true, data: result, error: null };
}

export async function listCloudBackups(): Promise<ApiResponse<CloudBackupItem[]>> {
  const auth = await requireAdminContext();
  if (!auth.ok) {
    return { success: false, data: null, error: auth.error };
  }

  try {
    const drive = await configuredDriveClient();
    return { success: true, data: await drive.list(), error: null };
  } catch (error) {
    return { success: false, data: null, error: getErrorMessage(error, 'Could not list cloud backups.') };
  }
}

export async function testBackupTarget(): Promise<ApiResponse<{ destination: string }>> {
  const auth = await requireAdminContext();
  if (!auth.ok) {
    return { success: false, data: null, error: auth.error };
  }

  try {
    const drive = await configuredDriveClient();
    return { success: true, data: await drive.probe(), error: null };
  } catch (error) {
    return { success: false, data: null, error: getErrorMessage(error, 'Backup target test failed.') };
  }
}

export async function restoreFromCloudBackup(itemId: string): Promise<ApiResponse<{ userCount: number }>> {
  const auth = await requireSuperAdminContext();
  if (!auth.ok) {
    return { success: false, data: null, error: auth.error };
  }
  if (!itemId.trim()) {
    return { success: false, data: null, error: 'Select a backup file.' };
  }

  try {
    const drive = await configuredDriveClient();
    const payload = await drive.download(itemId.trim());
    const result = await applySqliteRestore(payload);
    revalidatePath('/', 'layout');
    return { success: true, data: result, error: null };
  } catch (error) {
    return { success: false, data: null, error: getErrorMessage(error, 'Cloud restore failed.') };
  }
}

export async function listFirstRunCloudBackups(
  input: FirstRunCloudCredentials
): Promise<ApiResponse<CloudBackupItem[]>> {
  if (await isSystemInitialized()) {
    return { success: false, data: null, error: 'System is already initialized. Use Admin → System to restore.' };
  }
  const invalid = requireCloudFields(input);
  if (invalid) return { success: false, data: null, error: invalid };

  try {
    const drive = await driveFromCredentials(input);
    return { success: true, data: await drive.list(), error: null };
  } catch (error) {
    return { success: false, data: null, error: getErrorMessage(error, 'Could not list cloud backups.') };
  }
}

export async function restoreFirstRunFromCloud(
  input: FirstRunCloudCredentials & { itemId?: string }
): Promise<ApiResponse<{ userCount: number }>> {
  if (await isSystemInitialized()) {
    return { success: false, data: null, error: 'System is already initialized. Use Admin → System to restore.' };
  }
  const invalid = requireCloudFields(input);
  if (invalid) return { success: false, data: null, error: invalid };

  try {
    const drive = await driveFromCredentials(input);
    const items = await drive.list();
    const item = input.itemId
      ? items.find((entry) => entry.id === input.itemId)
      : items[0];
    if (!item) {
      return { success: false, data: null, error: 'No VelaDesk backup found in that folder.' };
    }
    const result = await applySqliteRestore(await drive.download(item.id));
    revalidatePath('/', 'layout');
    return { success: true, data: result, error: null };
  } catch (error) {
    return { success: false, data: null, error: getErrorMessage(error, 'Cloud restore failed.') };
  }
}
