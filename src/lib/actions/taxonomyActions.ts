'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

export interface CategoryPayload {
  name: string;
  description?: string;
  tenantId: string;
  workspaceId?: string;
}

export interface SLAPayload {
  name: string;
  responseHours: number;
  resolutionHours: number;
  tenantId: string;
  workspaceId?: string;
}

// ---- Ticket Categories ----

export async function getCategories() {
  try {
    const categories = await prisma.ticketCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        workspace: true,
        _count: {
          select: { tickets: true }
        }
      }
    });
    return { success: true, data: categories, error: null };
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return { success: false, data: null, error: error.message };
  }
}

export async function createCategory(data: CategoryPayload) {
  try {
    const category = await prisma.ticketCategory.create({
      data: {
        name: data.name,
        description: data.description || null,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId || null,
      },
      include: {
        workspace: true,
        _count: { select: { tickets: true } }
      }
    });

    revalidatePath('/admin/taxonomy');
    return { success: true, data: category, error: null };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return { success: false, data: null, error: error.message };
  }
}

export async function deleteCategory(id: string, tenantId: string) {
  try {
    await prisma.ticketCategory.delete({
      where: { id, tenantId } // SECURITY: Ensure tenant separation
    });
    revalidatePath('/admin/taxonomy');
    return { success: true, data: null, error: null };
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return { success: false, data: null, error: 'Cannot delete category. Ensure no tickets are attached.' };
  }
}

// ---- SLA Policies ----

export async function getSLAs() {
  try {
    const slas = await prisma.sLA_Policy.findMany({
      orderBy: { name: 'asc' },
      include: {
        workspace: true
      }
    });
    return { success: true, data: slas, error: null };
  } catch (error: any) {
    console.error('Error fetching SLAs:', error);
    return { success: false, data: null, error: error.message };
  }
}

export async function createSLA(data: SLAPayload) {
  try {
    const sla = await prisma.sLA_Policy.create({
      data: {
        name: data.name,
        responseHours: data.responseHours,
        resolutionHours: data.resolutionHours,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId || null,
      },
      include: {
        workspace: true
      }
    });

    revalidatePath('/admin/taxonomy');
    return { success: true, data: sla, error: null };
  } catch (error: any) {
    console.error('Error creating SLA:', error);
    return { success: false, data: null, error: error.message };
  }
}

export async function deleteSLA(id: string, tenantId: string) {
  try {
    await prisma.sLA_Policy.delete({
      where: { id, tenantId } // SECURITY: Ensure tenant separation
    });
    revalidatePath('/admin/taxonomy');
    return { success: true, data: null, error: null };
  } catch (error: any) {
    console.error('Error deleting SLA:', error);
    return { success: false, data: null, error: error.message };
  }
}
