import { prisma } from '@/lib/db/prisma';

export async function ensureCustomer(input: {
  tenantId: string;
  email: string;
  name?: string;
  company?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email.includes('@')) return null;

  const existing = await prisma.customer.findFirst({
    where: { tenantId: input.tenantId, email },
  });
  if (existing) return existing;

  const domain = email.split('@')[1] || null;
  return prisma.customer.create({
    data: {
      tenantId: input.tenantId,
      email,
      name: input.name?.trim() || email,
      company: input.company?.trim() || domain,
    },
  });
}
