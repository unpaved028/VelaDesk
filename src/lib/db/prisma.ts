import { PrismaClient } from '@prisma/client';
import { defaultSqliteUrl } from '@/lib/db/sqlitePath';

// Never overwrite an explicit DATABASE_URL (Docker / .env). Fallback only when unset.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = defaultSqliteUrl();
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
