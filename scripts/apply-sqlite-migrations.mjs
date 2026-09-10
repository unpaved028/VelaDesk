/**
 * Apply prisma/migrations to SQLite without the Prisma CLI.
 *
 * The runner image cannot `prisma migrate deploy`: Prisma 6's CLI pulls
 * @prisma/config → effect/c12/jiti, which we do not copy into the
 * standalone image (and npx would fetch the wrong major).
 *
 * Checksums match `prisma migrate deploy` (SHA-256 of migration.sql) so a
 * later CLI run will not rewrite history.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const here = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = process.env.VELADESK_MIGRATIONS_DIR
  || path.join(here, '..', 'prisma', 'migrations');

function resolveDatabasePath() {
  const url = process.env.DATABASE_URL || 'file:./data/dev.db';
  const filePath = url.startsWith('file:') ? url.slice('file:'.length) : url;
  if (path.isAbsolute(filePath)) return filePath;
  // Prisma file: URLs are relative to the schema directory (/app/prisma).
  return path.resolve(process.cwd(), 'prisma', filePath);
}

function checksumOf(sql) {
  return crypto.createHash('sha256').update(sql, 'utf8').digest('hex');
}

function isAlreadyAppliedError(error) {
  const message = String(error && error.message ? error.message : error).toLowerCase();
  return (
    message.includes('duplicate column') ||
    message.includes('already exists') ||
    message.includes('duplicate column name')
  );
}

function splitSqlStatements(sql) {
  return sql
    .split(';')
    .map((part) => part.trim())
    .filter((part) => {
      if (!part) return false;
      const meaningful = part
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('--'));
      return meaningful.length > 0;
    });
}

function applySql(db, sql) {
  try {
    db.exec(sql);
    return;
  } catch (error) {
    if (!isAlreadyAppliedError(error)) throw error;
  }

  for (const statement of splitSqlStatements(sql)) {
    try {
      db.exec(statement);
    } catch (error) {
      if (!isAlreadyAppliedError(error)) throw error;
      console.info(`[migrate] already present: ${statement.replace(/\s+/g, ' ').slice(0, 96)}`);
    }
  }
}

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `);
}

function listMigrationDirs(root) {
  if (!fs.existsSync(root)) {
    throw new Error(`Migrations directory not found: ${root}`);
  }
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function alreadyApplied(db, name) {
  const row = db
    .prepare(
      'SELECT 1 AS ok FROM "_prisma_migrations" WHERE "migration_name" = ? AND "rolled_back_at" IS NULL'
    )
    .get(name);
  return Boolean(row);
}

function recordMigration(db, name, checksum) {
  db.prepare(
    `INSERT INTO "_prisma_migrations"
      ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
     VALUES (?, ?, current_timestamp, ?, NULL, NULL, current_timestamp, 1)`
  ).run(crypto.randomUUID(), checksum, name);
}

function main() {
  const dbPath = resolveDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  try {
    ensureMigrationsTable(db);
    const names = listMigrationDirs(MIGRATIONS_DIR);
    let applied = 0;
    let skipped = 0;

    for (const name of names) {
      const file = path.join(MIGRATIONS_DIR, name, 'migration.sql');
      if (!fs.existsSync(file)) {
        console.warn(`[migrate] skip ${name}: no migration.sql`);
        continue;
      }
      if (alreadyApplied(db, name)) {
        skipped += 1;
        continue;
      }

      const sql = fs.readFileSync(file, 'utf8');
      console.info(`[migrate] applying ${name}`);
      applySql(db, sql);
      recordMigration(db, name, checksumOf(sql));
      applied += 1;
    }

    console.info(`[migrate] done. applied=${applied} already=${skipped} db=${dbPath}`);
  } finally {
    db.close();
  }
}

main();
