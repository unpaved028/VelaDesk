import { prisma } from '@/lib/db/prisma';
import { isStaffBootstrapEnabled } from '@/lib/auth/bootstrapAuth';

export async function readStaffBootstrapEnabled(): Promise<boolean> {
  const config = await prisma.systemConfig.findUnique({
    where: { id: 'global' },
    select: { entraIdConfigured: true },
  });
  return isStaffBootstrapEnabled(config?.entraIdConfigured);
}
