'use server';

import { revalidatePath } from 'next/cache';
import type { Macro } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getErrorMessage } from '@/lib/errors';
import { requireAdminContext, requireAgentContext } from '@/lib/auth/session';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export async function listMacros(): Promise<ApiResponse<Macro[]>> {
  const auth = await requireAgentContext();
  if (!auth.ok) return { success: false, data: null, error: auth.error };

  try {
    const macros = await prisma.macro.findMany({
      where: { tenantId: auth.ctx.tenantId },
      orderBy: { title: 'asc' },
    });
    return { success: true, data: macros, error: null };
  } catch (error: unknown) {
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}

export async function createMacro(data: { title: string; body: string }): Promise<ApiResponse<Macro>> {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false, data: null, error: admin.error };

  const title = data.title.trim();
  const body = data.body.trim();
  if (!title || !body) {
    return { success: false, data: null, error: 'Title and body are required.' };
  }

  try {
    const macro = await prisma.macro.create({
      data: {
        tenantId: admin.ctx.tenantId,
        title,
        body,
      },
    });
    revalidatePath('/admin/macros');
    return { success: true, data: macro, error: null };
  } catch (error: unknown) {
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}

export async function updateMacro(id: string, data: { title: string; body: string }): Promise<ApiResponse<{ count: number }>> {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false, data: null, error: admin.error };

  try {
    const result = await prisma.macro.updateMany({
      where: { id, tenantId: admin.ctx.tenantId },
      data: { title: data.title.trim(), body: data.body.trim() },
    });
    if (result.count === 0) {
      return { success: false, data: null, error: 'Macro not found.' };
    }
    revalidatePath('/admin/macros');
    return { success: true, data: result, error: null };
  } catch (error: unknown) {
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}

export async function deleteMacro(id: string): Promise<ApiResponse<null>> {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false, data: null, error: admin.error };

  try {
    const result = await prisma.macro.deleteMany({
      where: { id, tenantId: admin.ctx.tenantId },
    });
    if (result.count === 0) {
      return { success: false, data: null, error: 'Macro not found.' };
    }
    revalidatePath('/admin/macros');
    return { success: true, data: null, error: null };
  } catch (error: unknown) {
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}
