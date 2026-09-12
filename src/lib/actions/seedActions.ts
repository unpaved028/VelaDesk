'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminContext } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getErrorMessage } from '@/lib/errors';
import { seedBestPracticesForTenant, type MspSeedResult } from '@/lib/services/mspSeed';
import { ApiResponse } from '@/types/api';

/**
 * First-run has no staff session yet (setup finishes before login).
 * Only then may we seed the single existing tenant without a session.
 */
async function resolveSeedTenantId(): Promise<{ ok: true; tenantId: string } | { ok: false; error: string }> {
  const admin = await requireAdminContext();
  if (admin.ok) {
    return { ok: true, tenantId: admin.ctx.tenantId };
  }

  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  if (tenants.length !== 1) {
    return { ok: false, error: 'Sign in as an admin to seed this instance.' };
  }

  return { ok: true, tenantId: tenants[0].id };
}

export async function runMspBestPracticesSeed(): Promise<ApiResponse<MspSeedResult>> {
  try {
    const tenant = await resolveSeedTenantId();
    if (!tenant.ok) {
      return { success: false, data: null, error: tenant.error };
    }

    const data = await seedBestPracticesForTenant(tenant.tenantId);
    revalidatePath('/admin');
    revalidatePath('/admin/taxonomy');
    revalidatePath('/admin/appearance');
    revalidatePath('/portal/catalog');
    revalidatePath('/tickets');
    return { success: true, data, error: null };
  } catch (error: unknown) {
    console.error('Error in runMspBestPracticesSeed:', error);
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}
