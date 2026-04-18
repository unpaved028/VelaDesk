'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export async function getWorkspaces() {
  try {
    const workspaces = await prisma.workspace.findMany({
      include: { tenant: true },
      orderBy: { name: 'asc' }
    });
    return { success: true, data: workspaces, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}

export async function createWorkspace(data: { tenantId: string; name: string; type: string }) {
  try {
    if (!data.tenantId) throw new Error("tenantId is strictly required");
    
    const workspace = await prisma.workspace.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        type: data.type,
      }
    });
    revalidatePath('/admin/workspaces');
    return { success: true, data: workspace, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}

export async function deleteWorkspace(id: string, tenantId: string) {
  try {
    // SECURITY: Always enforce tenantId when mutating workspace
    await prisma.workspace.delete({
      where: { 
        id: id,
        tenantId: tenantId
      }
    });
    revalidatePath('/admin/workspaces');
    return { success: true, data: null, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}
