'use server';

import { prisma } from '@/lib/db/prisma';
import { requireAdminContext } from '@/lib/auth/session';
import { getErrorMessage } from '@/lib/errors';
import { revalidatePath } from 'next/cache';
import { encryptSecret } from '../services/encryption';

export interface MailboxPayload {
  workspaceId: string;
  tenantId: string;
  mailboxAddress: string; // The M365 Shared Mailbox email address (e.g. support@domain.de)
  clientId: string;
  clientSecret: string;
  msTenantId: string;
}

export async function getMailboxConfigs() {
  try {
    const admin = await requireAdminContext();
    if (!admin.ok) {
      return { success: false, data: null, error: admin.error };
    }

    const configs = await prisma.mailboxConfig.findMany({
      where: { tenantId: admin.ctx.tenantId },
      include: {
        workspace: {
          include: { tenant: true }
        }
      }
    });

    // We MUST NOT leak the decrypted secret to the client.
    // Instead, we just indicate whether one exists by an artificial string.
    const safeConfigs = configs.map(c => ({
      ...c,
      clientSecret: '********' // Redact plain secret from client
    }));

    return { success: true, data: safeConfigs, error: null };
  } catch (error: unknown) {
    console.error('Error fetching mailbox config:', error);
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}

export async function saveMailboxConfig(data: MailboxPayload) {
  try {
    const admin = await requireAdminContext();
    if (!admin.ok) {
      return { success: false, data: null, error: admin.error };
    }

    const tenantId = admin.ctx.tenantId;
    if (!data.workspaceId || !data.clientId || !data.msTenantId || !data.mailboxAddress) {
      return { success: false, data: null, error: 'All fields (Workspace, Mailbox Address, Tenant ID, Client ID, MS Tenant ID) are required.' };
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: data.workspaceId, tenantId },
      select: { id: true },
    });
    if (!workspace) {
      return { success: false, data: null, error: 'Workspace not found for this tenant.' };
    }

    const unencryptedSecret = data.clientSecret?.trim();
    
    // Determine if config already exists
    const existing = await prisma.mailboxConfig.findUnique({
      where: { workspaceId: data.workspaceId }
    });

    if (!existing && !unencryptedSecret) {
      return { success: false, data: null, error: 'Client Secret is required for new configurations.' };
    }

    let encryptedSecret = existing?.clientSecret || '';

    // If user provided a new plain secret, we encrypt it.
    if (unencryptedSecret && unencryptedSecret !== '********') {
      encryptedSecret = encryptSecret(unencryptedSecret, tenantId);
    }

    const upserted = await prisma.mailboxConfig.upsert({
      where: { workspaceId: data.workspaceId },
      update: {
        mailboxAddress: data.mailboxAddress,
        clientId: data.clientId,
        clientSecret: encryptedSecret,
        msTenantId: data.msTenantId,
      },
      create: {
        tenantId,
        workspaceId: data.workspaceId,
        mailboxAddress: data.mailboxAddress,
        clientId: data.clientId,
        clientSecret: encryptedSecret,
        msTenantId: data.msTenantId,
        isActive: true
      }
    });

    revalidatePath('/admin/mailboxes');
    return { success: true, data: upserted, error: null };
  } catch (error: unknown) {
    console.error('Error saving mailbox config:', error);
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}

export async function deleteMailboxConfig(id: string, tenantId: string) {
  try {
    const admin = await requireAdminContext();
    if (!admin.ok) {
      return { success: false, data: null, error: admin.error };
    }
    if (tenantId !== admin.ctx.tenantId) {
      return { success: false, data: null, error: 'Forbidden.' };
    }

    await prisma.mailboxConfig.delete({
      where: { id: id, tenantId: admin.ctx.tenantId }
    });

    revalidatePath('/admin/mailboxes');
    return { success: true, data: null, error: null };
  } catch (error: unknown) {
    console.error('Error deleting mailbox config:', error);
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}
