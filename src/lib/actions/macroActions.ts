'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export async function getMacros(tenantId: string): Promise<ApiResponse<any>> {
  try {
    const macros = await prisma.macro.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: macros, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}

export async function createMacro(data: { tenantId: string; title: string; body: string }): Promise<ApiResponse<any>> {
  try {
    const macro = await prisma.macro.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        body: data.body,
      }
    });
    revalidatePath('/admin/macros'); // or wherever the admin view might be
    return { success: true, data: macro, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}

export async function updateMacro(id: string, tenantId: string, data: { title: string; body: string }): Promise<ApiResponse<any>> {
  try {
    const macro = await prisma.macro.updateMany({
      where: { 
        id,
        tenantId // Enforce tenancy
      },
      data: {
        title: data.title,
        body: data.body,
      }
    });

    if (macro.count === 0) {
      throw new Error("Macro not found or access denied.");
    }

    revalidatePath('/admin/macros');
    return { success: true, data: macro, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}

export async function deleteMacro(id: string, tenantId: string): Promise<ApiResponse<any>> {
  try {
    // Check existence & tenancy first since deleteMany doesn't return the deleted object
    const macro = await prisma.macro.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!macro) {
      throw new Error("Macro not found or access denied.");
    }

    await prisma.macro.delete({
      where: { id }
    });
    
    revalidatePath('/admin/macros');
    return { success: true, data: null, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}
