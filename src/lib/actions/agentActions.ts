'use server';

import { prisma } from '@/lib/db/prisma';
import { getErrorMessage } from '@/lib/errors';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

export interface AgentPayload {
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  isCustomerAdmin?: boolean;
}

export async function getAgents() {
  try {
    const agents = await prisma.user.findMany({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'ADMIN', 'AGENT', 'CUSTOMER']
        }
      },
      orderBy: { name: 'asc' },
      include: {
        tenant: true
      }
    });
    return { success: true, data: agents, error: null };
  } catch (error: unknown) {
    console.error('Error fetching agents:', error);
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}

export async function createAgent(data: AgentPayload) {
  try {
    // Basic validation
    if (!data.name || !data.email || !data.tenantId || !data.role) {
      return { success: false, data: null, error: 'All fields are required.' };
    }

    if (!['ADMIN', 'AGENT', 'CUSTOMER'].includes(data.role)) {
      return { success: false, data: null, error: 'Invalid role.' };
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existing) {
      return { success: false, data: null, error: 'A user with this email already exists.' };
    }

    const newAgent = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        tenantId: data.tenantId,
        isCustomerAdmin: data.role === 'CUSTOMER' && data.isCustomerAdmin === true,
      },
      include: {
        tenant: true
      }
    });

    revalidatePath('/admin/agents');
    return { success: true, data: newAgent, error: null };
  } catch (error: unknown) {
    console.error('Error creating agent:', error);
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}

export async function deleteAgent(id: string, tenantId: string) {
  try {
    await prisma.user.delete({
      where: { id, tenantId } // SECURITY: Ensure tenant isolation
    });
    revalidatePath('/admin/agents');
    return { success: true, data: null, error: null };
  } catch (error: unknown) {
    console.error('Error deleting agent:', error);
    return { success: false, data: null, error: 'Cannot delete agent. They might have assigned tickets.' };
  }
}

export async function setCustomerAdmin(id: string, tenantId: string, enabled: boolean) {
  try {
    const updated = await prisma.user.updateMany({
      where: { id, tenantId, role: 'CUSTOMER' },
      data: { isCustomerAdmin: enabled },
    });
    if (updated.count === 0) {
      return { success: false, data: null, error: 'Customer user not found.' };
    }
    revalidatePath('/admin/agents');
    return { success: true, data: { id, isCustomerAdmin: enabled }, error: null };
  } catch (error: unknown) {
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}
