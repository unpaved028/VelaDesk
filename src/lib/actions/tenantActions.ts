'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export async function getTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: tenants, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}

export async function createTenant(data: { 
  name: string; 
  domain?: string;
  businessStartTime?: string;
  businessEndTime?: string;
  businessDays?: string;
  timezone?: string;
}) {
  try {
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        domain: data.domain || null,
        businessStartTime: data.businessStartTime,
        businessEndTime: data.businessEndTime,
        businessDays: data.businessDays,
        timezone: data.timezone,
      }
    });
    revalidatePath('/admin/tenants');
    return { success: true, data: tenant, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}

export async function updateTenant(id: string, data: { 
  name?: string; 
  domain?: string | null;
  businessStartTime?: string;
  businessEndTime?: string;
  businessDays?: string;
  timezone?: string;
}) {
  try {
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...data
      }
    });
    revalidatePath('/admin/tenants');
    return { success: true, data: tenant, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}

export async function deleteTenant(id: string) {
  try {
    await prisma.tenant.delete({
      where: { id }
    });
    revalidatePath('/admin/tenants');
    return { success: true, data: null, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}
