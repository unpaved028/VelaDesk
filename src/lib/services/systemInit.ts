import { prisma } from '@/lib/db/prisma';

/**
 * Same rule as /api/system/init-status: config row + at least one admin.
 * A missing schema means first-run, not "already initialized".
 */
export async function isSystemInitialized(): Promise<boolean> {
  try {
    const [config, adminCount] = await Promise.all([
      prisma.systemConfig.findUnique({
        where: { id: 'global' },
        select: { id: true },
      }),
      prisma.user.count({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
      }),
    ]);
    return Boolean(config) && adminCount > 0;
  } catch {
    return false;
  }
}
