'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getErrorMessage } from '@/lib/errors';
import { requireAdminContext } from '@/lib/auth/session';
import { starterCatalogForLocale } from '@/lib/services/mspSeedCatalog';
import { normalizeLocale } from '@/lib/services/tenantFacing';

export interface CatalogRow {
  id: string;
  title: string;
  description: string;
  category: string;
  sortOrder: number;
}

export async function listCatalogItems() {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false as const, data: null, error: admin.error };

  try {
    const items = await prisma.catalogItem.findMany({
      where: { tenantId: admin.ctx.tenantId },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
    return { success: true as const, data: items, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}

export async function createCatalogItem(data: {
  title: string;
  description: string;
  category: string;
}) {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false as const, data: null, error: admin.error };

  const title = data.title.trim();
  const description = data.description.trim();
  const category = data.category.trim();
  if (!title || !description || !category) {
    return { success: false as const, data: null, error: 'Title, description, and category are required.' };
  }

  try {
    const last = await prisma.catalogItem.findFirst({
      where: { tenantId: admin.ctx.tenantId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const item = await prisma.catalogItem.create({
      data: {
        tenantId: admin.ctx.tenantId,
        title,
        description,
        category,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
    revalidatePath('/admin/appearance');
    revalidatePath('/portal/catalog');
    return { success: true as const, data: item, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}

export async function deleteCatalogItem(id: string) {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false as const, data: null, error: admin.error };

  try {
    const result = await prisma.catalogItem.deleteMany({
      where: { id, tenantId: admin.ctx.tenantId },
    });
    if (result.count === 0) {
      return { success: false as const, data: null, error: 'Catalog item not found.' };
    }
    revalidatePath('/admin/appearance');
    revalidatePath('/portal/catalog');
    return { success: true as const, data: null, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}

export async function loadStarterCatalog() {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false as const, data: null, error: admin.error };

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: admin.ctx.tenantId },
      select: { locale: true },
    });
    const locale = normalizeLocale(tenant?.locale);
    let created = 0;
    for (const [index, item] of starterCatalogForLocale(locale).entries()) {
      const existing = await prisma.catalogItem.findFirst({
        where: { tenantId: admin.ctx.tenantId, title: item.title },
        select: { id: true },
      });
      if (existing) continue;
      await prisma.catalogItem.create({
        data: {
          tenantId: admin.ctx.tenantId,
          title: item.title,
          description: item.description,
          category: item.category,
          sortOrder: index,
        },
      });
      created += 1;
    }
    revalidatePath('/admin/appearance');
    revalidatePath('/portal/catalog');
    return { success: true as const, data: { created }, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}
