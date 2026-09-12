'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getErrorMessage } from '@/lib/errors';
import { requireAdminContext } from '@/lib/auth/session';

const MAX_BYTES = 400 * 1024;

function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export async function uploadTenantLogo(formData: FormData) {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false as const, data: null, error: admin.error };

  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, data: null, error: 'Choose a PNG, JPEG, or WebP file.' };
  }
  if (file.size > MAX_BYTES) {
    return { success: false as const, data: null, error: 'Logo must be 400 KB or smaller.' };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageMime(bytes);
  if (!mime) {
    return { success: false as const, data: null, error: 'Only PNG, JPEG, or WebP is accepted.' };
  }

  try {
    await prisma.tenant.update({
      where: { id: admin.ctx.tenantId },
      data: { logoMime: mime, logoData: Buffer.from(bytes) },
    });
    revalidatePath('/admin/appearance');
    revalidatePath('/portal');
    return { success: true as const, data: true, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}

export async function clearTenantLogo() {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false as const, data: null, error: admin.error };

  try {
    await prisma.tenant.update({
      where: { id: admin.ctx.tenantId },
      data: { logoMime: null, logoData: null },
    });
    revalidatePath('/admin/appearance');
    revalidatePath('/portal');
    return { success: true as const, data: true, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}
