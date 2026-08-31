'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { isSuperAdminRole, requireAdminContext } from '@/lib/auth/session';
import { encryptSecret } from '@/lib/services/encryption';
import { getErrorMessage } from '@/lib/errors';

function canManageTenant(role: string, sessionTenantId: string, tenantId: string): boolean {
  return isSuperAdminRole(role) || sessionTenantId === tenantId;
}

export async function regenerateInboundWebhook(tenantId: string) {
  try {
    const auth = await requireAdminContext();
    if (!auth.ok) return { success: false as const, data: null, error: auth.error };
    if (!canManageTenant(auth.ctx.role, auth.ctx.tenantId, tenantId)) {
      return { success: false as const, data: null, error: 'Forbidden.' };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) return { success: false as const, data: null, error: 'Tenant not found.' };

    const token = crypto.randomBytes(32).toString('hex');
    const encrypted = encryptSecret(token, tenantId);

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { inboundWebhookSecret: encrypted },
    });

    const config = await prisma.systemConfig.findUnique({
      where: { id: 'global' },
      select: { baseUrl: true },
    });
    const baseUrl = (config?.baseUrl || 'http://localhost:3000').replace(/\/$/, '');
    const url = `${baseUrl}/api/webhooks/inbound/${tenantId}?token=${token}`;

    revalidatePath('/admin/tenants');
    return { success: true as const, data: { url, token }, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}
