'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getErrorMessage } from '@/lib/errors';
import { requireAdminContext } from '@/lib/auth/session';
import { ensureCustomer } from '@/lib/services/customers';

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  tickets: { id: number; subject: string; status: string }[];
}

export async function listCustomers(): Promise<{ success: boolean; data: CustomerRow[] | null; error: string | null }> {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false, data: null, error: admin.error };

  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId: admin.ctx.tenantId },
      orderBy: [{ company: 'asc' }, { name: 'asc' }],
    });
    const keys = customers.flatMap((customer) => [customer.id, customer.email]);
    const tickets = keys.length
      ? await prisma.ticket.findMany({
          where: { tenantId: admin.ctx.tenantId, requesterId: { in: keys } },
          select: { id: true, subject: true, status: true, requesterId: true },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    const rows = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      company: customer.company,
      tickets: tickets.filter(
        (ticket) => ticket.requesterId === customer.id || ticket.requesterId.toLowerCase() === customer.email
      ),
    }));

    return { success: true, data: rows, error: null };
  } catch (error: unknown) {
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}

export async function createCustomer(data: {
  name: string;
  email: string;
  company?: string;
}): Promise<{ success: boolean; data: { id: string } | null; error: string | null }> {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false, data: null, error: admin.error };

  const email = data.email.trim().toLowerCase();
  const name = data.name.trim();
  if (!name || !email.includes('@')) {
    return { success: false, data: null, error: 'Name and a valid email are required.' };
  }

  try {
    const customer = await ensureCustomer({
      tenantId: admin.ctx.tenantId,
      email,
      name,
      company: data.company?.trim() || null,
    });
    if (!customer) {
      return { success: false, data: null, error: 'Could not save the contact.' };
    }
    if (data.company?.trim() && customer.company !== data.company.trim()) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { name, company: data.company.trim() },
      });
    }
    revalidatePath('/admin/customers');
    return { success: true, data: { id: customer.id }, error: null };
  } catch (error: unknown) {
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}
