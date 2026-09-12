import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import zlib from 'zlib';
import { prisma } from '@/lib/db/prisma';
import { getSqliteDatabasePath } from '@/lib/db/sqlitePath';

const execFileAsync = promisify(execFile);

const SQLITE_HEADER = Buffer.from('SQLite format 3\0');

export function isSqliteDatabase(buffer: Buffer): boolean {
  return buffer.length >= SQLITE_HEADER.length && buffer.subarray(0, SQLITE_HEADER.length).equals(SQLITE_HEADER);
}

export function isGzipBuffer(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
}

export function isZipBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
  );
}

/**
 * Accept gzip or a raw SQLite file. PKZIP is rejected on purpose — we only write gzip.
 */
export function decodeBackupPayload(buffer: Buffer): Buffer {
  if (isZipBuffer(buffer)) {
    throw new Error('ZIP archives are not supported. Upload a .db or .db.gz file.');
  }

  if (isGzipBuffer(buffer)) {
    const unzipped = zlib.gunzipSync(buffer);
    if (!isSqliteDatabase(unzipped)) {
      throw new Error('Gzip payload is not a SQLite database.');
    }
    return unzipped;
  }

  if (isSqliteDatabase(buffer)) return buffer;
  throw new Error('File is not a SQLite database or gzip backup.');
}

export function backupFileName(extension: 'db' | 'db.gz' = 'db.gz'): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `VelaDesk-backup-${stamp}.${extension}`;
}

function sqliteLiteral(filePath: string): string {
  return `'${filePath.replace(/\\/g, '/').replace(/'/g, "''")}'`;
}

function removeSqliteSidecars(dbPath: string): void {
  for (const side of [`${dbPath}-wal`, `${dbPath}-shm`]) {
    fs.rmSync(side, { force: true });
  }
}

/**
 * Consistent snapshot. Prefer VACUUM INTO so we never gzip the live file while writers are active.
 */
export async function createSqliteSnapshotFile(): Promise<{ path: string; fileName: string; size: number }> {
  const dbPath = getSqliteDatabasePath();
  if (!fs.existsSync(dbPath)) {
    throw new Error('Database file not found.');
  }

  const dest = path.join(os.tmpdir(), `veladesk-snap-${Date.now()}.db`);
  try {
    await prisma.$executeRawUnsafe(`VACUUM INTO ${sqliteLiteral(dest)}`);
  } catch {
    // VACUUM INTO needs a recent SQLite; fall back to a checkpointed copy.
    await prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE)');
    fs.copyFileSync(dbPath, dest);
  }

  const raw = fs.readFileSync(dest);
  if (!isSqliteDatabase(raw)) {
    fs.rmSync(dest, { force: true });
    throw new Error('Snapshot was not a valid SQLite file.');
  }

  return { path: dest, fileName: backupFileName('db'), size: raw.length };
}

export async function createSqliteBackupGzip(): Promise<{ buffer: Buffer; fileName: string; rawBytes: number }> {
  const snapshot = await createSqliteSnapshotFile();
  try {
    const raw = fs.readFileSync(snapshot.path);
    return {
      buffer: zlib.gzipSync(raw, { level: 9 }),
      fileName: backupFileName('db.gz'),
      rawBytes: raw.length,
    };
  } finally {
    fs.rmSync(snapshot.path, { force: true });
  }
}

export async function applyPendingSqliteMigrations(): Promise<void> {
  const script = path.resolve(process.cwd(), 'scripts', 'apply-sqlite-migrations.mjs');
  if (!fs.existsSync(script)) {
    console.warn('[restore] Migration script missing. Restart the container so schema migrations apply.');
    return;
  }

  await execFileAsync(process.execPath, ['--experimental-sqlite', script], {
    env: process.env,
    cwd: process.cwd(),
  });
}

export async function applySqliteRestore(payload: Buffer): Promise<{ userCount: number }> {
  const db = decodeBackupPayload(payload);
  const dbPath = getSqliteDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const incoming = `${dbPath}.incoming-${Date.now()}`;
  const bak = `${dbPath}.bak-${Date.now()}`;
  let replaced = false;
  fs.writeFileSync(incoming, db);

  await prisma.$disconnect();

  try {
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, bak);
    }
    // Drop WAL/SHM so SQLite cannot replay the previous journal onto the new file.
    removeSqliteSidecars(dbPath);
    fs.renameSync(incoming, dbPath);
    replaced = true;

    try {
      await applyPendingSqliteMigrations();
    } catch (error) {
      console.error('[restore] Failed to apply migrations after restore:', error);
    }

    await prisma.$connect();
    // First-run is over only when an admin exists. A customer-only dump would
    // leave /setup open and invite completeFirstRunSetup on live data (B1).
    const [userCount, adminCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
      }),
    ]);
    if (userCount < 1 || adminCount < 1) {
      throw new Error('Restored file has no administrator. This does not look like a VelaDesk backup.');
    }

    const config = await prisma.systemConfig.findUnique({
      where: { id: 'global' },
      select: { id: true },
    });
    if (!config) {
      await prisma.systemConfig.create({ data: { id: 'global' } });
    }

    return { userCount };
  } catch (error) {
    if (replaced && fs.existsSync(bak)) {
      await prisma.$disconnect().catch(() => undefined);
      removeSqliteSidecars(dbPath);
      fs.copyFileSync(bak, dbPath);
      await prisma.$connect().catch(() => undefined);
    }
    throw error;
  } finally {
    fs.rmSync(incoming, { force: true });
  }
}
