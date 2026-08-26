import path from 'path';

/**
 * Resolves the SQLite file from DATABASE_URL.
 * Prisma `file:` URLs are relative to the prisma/ directory (schema location).
 * Docker mounts ./data → /app/prisma/data, so production default is file:./data/dev.db.
 */
export function getSqliteDatabasePath(): string {
  const url = process.env.DATABASE_URL || defaultSqliteUrl();
  const filePath = url.startsWith('file:') ? url.slice('file:'.length) : url;

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(process.cwd(), 'prisma', filePath);
}

export function defaultSqliteUrl(): string {
  return process.env.NODE_ENV === 'production' ? 'file:./data/dev.db' : 'file:./dev.db';
}
