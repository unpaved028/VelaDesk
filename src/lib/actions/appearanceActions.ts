'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getErrorMessage } from '@/lib/errors';
import { requireAdminContext } from '@/lib/auth/session';
import { normalizeLocale, type CustomerLocale } from '@/lib/services/tenantFacing';

export async function getAppearance() {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false as const, data: null, error: admin.error };

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: admin.ctx.tenantId },
      select: { name: true, brandName: true, locale: true, logoMime: true },
    });
    if (!tenant) return { success: false as const, data: null, error: 'Tenant not found.' };
    return {
      success: true as const,
      data: {
        name: tenant.name,
        brandName: tenant.brandName ?? '',
        locale: normalizeLocale(tenant.locale),
        hasLogo: Boolean(tenant.logoMime),
      },
      error: null,
    };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}

export async function updateAppearance(data: { brandName: string; locale: CustomerLocale }) {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false as const, data: null, error: admin.error };

  const brandName = data.brandName.trim();
  const locale = normalizeLocale(data.locale);

  try {
    await prisma.tenant.update({
      where: { id: admin.ctx.tenantId },
      data: {
        brandName: brandName || null,
        locale,
      },
    });
    revalidatePath('/admin/appearance');
    revalidatePath('/portal');
    return { success: true as const, data: true, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}
