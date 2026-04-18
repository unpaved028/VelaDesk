'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

export interface AgentPayload {
  name: string;
  email: string;
  role: Role;
  tenantId: string;
}

export async function getAgents() {
  try {
    const agents = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'AGENT']
        }
      },
      orderBy: { name: 'asc' },
      include: {
        tenant: true
      }
    });
    return { success: true, data: agents, error: null };
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return { success: false, data: null, error: error.message };
  }
}

export async function createAgent(data: AgentPayload) {
  try {
    // Basic validation
    if (!data.name || !data.email || !data.tenantId || !data.role) {
      return { success: false, data: null, error: 'All fields are required.' };
    }

    if (!['ADMIN', 'AGENT'].includes(data.role)) {
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
      },
      include: {
        tenant: true
      }
    });

    revalidatePath('/admin/agents');
    return { success: true, data: newAgent, error: null };
  } catch (error: any) {
    console.error('Error creating agent:', error);
    return { success: false, data: null, error: error.message };
  }
}

export async function deleteAgent(id: string, tenantId: string) {
  try {
    await prisma.user.delete({
      where: { id, tenantId } // SECURITY: Ensure tenant isolation
    });
    revalidatePath('/admin/agents');
    return { success: true, data: null, error: null };
  } catch (error: any) {
    console.error('Error deleting agent:', error);
    return { success: false, data: null, error: 'Cannot delete agent. They might have assigned tickets.' };
  }
}
