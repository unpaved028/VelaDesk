import { PrismaClient } from '@prisma/client';

// Ensure Prisma has a fallback DATABASE_URL in process.env so it doesn't throw 
// "Environment variable not found: DATABASE_URL" when schema.prisma requires it.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
