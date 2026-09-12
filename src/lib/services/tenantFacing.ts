import { prisma } from '@/lib/db/prisma';

export type CustomerLocale = 'de' | 'en';

export interface TenantFacing {
  brandName: string;
  locale: CustomerLocale;
  hasLogo: boolean;
}

export function normalizeLocale(value: string | null | undefined): CustomerLocale {
  return value === 'en' ? 'en' : 'de';
}

/**
 * Customer-facing brand and language for one tenant.
 * Fallback is the tenant name, never a hardcoded company.
 */
export async function getTenantFacing(tenantId: string): Promise<TenantFacing> {
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId },
    select: { name: true, brandName: true, locale: true, logoMime: true },
  });

  const brandName = tenant?.brandName?.trim() || tenant?.name?.trim() || 'Helpdesk';
  return {
    brandName,
    locale: normalizeLocale(tenant?.locale),
    hasLogo: Boolean(tenant?.logoMime),
  };
}
