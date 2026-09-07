'use server';

import { prisma } from '@/lib/db/prisma';
import { requireAdminContext } from '@/lib/auth/session';
import { getErrorMessage } from '@/lib/errors';
import { provisioningCache } from '@/lib/services/provisioningCache';
import { decryptSecret } from '@/lib/services/encryption';
import { testM365Connection } from '@/lib/actions/mailboxTestAction';
import type { M365TestResult } from '@/types/mailbox';

export interface MailboxSetupWorkspace {
  id: string;
  name: string;
}

export interface MailboxSetupToken {
  token: string;
  workspaceId: string;
  workspaceName: string;
  expiresMinutes: number;
}

export async function listMailboxSetupWorkspaces(): Promise<{
  success: boolean;
  data: MailboxSetupWorkspace[] | null;
  error: string | null;
}> {
  try {
    const admin = await requireAdminContext();
    if (!admin.ok) {
      return { success: false, data: null, error: admin.error };
    }

    const workspaces = await prisma.workspace.findMany({
      where: { tenantId: admin.ctx.tenantId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return { success: true, data: workspaces, error: null };
  } catch (error: unknown) {
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}

export async function createMailboxSetupToken(
  workspaceId?: string
): Promise<{
  success: boolean;
  data: MailboxSetupToken | null;
  error: string | null;
}> {
  try {
    const admin = await requireAdminContext();
    if (!admin.ok) {
      return { success: false, data: null, error: admin.error };
    }

    const workspace = workspaceId
      ? await prisma.workspace.findFirst({
          where: { id: workspaceId, tenantId: admin.ctx.tenantId },
          select: { id: true, name: true },
        })
      : await prisma.workspace.findFirst({
          where: { tenantId: admin.ctx.tenantId },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        });

    if (!workspace) {
      return { success: false, data: null, error: 'No workspace found for this tenant.' };
    }

    const token = provisioningCache.createToken(admin.ctx.tenantId, workspace.id);
    return {
      success: true,
      data: {
        token,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        expiresMinutes: 15,
      },
      error: null,
    };
  } catch (error: unknown) {
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}

export async function testSavedMailboxConnection(
  mailboxConfigId: string
): Promise<M365TestResult> {
  const admin = await requireAdminContext();
  if (!admin.ok) {
    return { success: false, errorCode: 'UNKNOWN', errorMessage: admin.error };
  }

  const config = await prisma.mailboxConfig.findFirst({
    where: { id: mailboxConfigId, tenantId: admin.ctx.tenantId },
  });
  if (!config) {
    return { success: false, errorCode: 'MAILBOX_NOT_FOUND', errorMessage: 'Mailbox configuration not found.' };
  }

  let clientSecret = '';
  try {
    clientSecret = decryptSecret(config.clientSecret, admin.ctx.tenantId);
  } catch {
    return {
      success: false,
      errorCode: 'AUTH_FAILED',
      errorMessage: 'Stored secret could not be decrypted.',
    };
  }

  return testM365Connection({
    mailboxAddress: config.mailboxAddress,
    msTenantId: config.msTenantId,
    clientId: config.clientId,
    clientSecret,
  });
}
