import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultSqliteUrl, getSqliteDatabasePath } from './sqlitePath';

const originalUrl = process.env.DATABASE_URL;

afterEach(() => {
  vi.unstubAllEnvs();
  if (originalUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalUrl;
  }
});

describe('defaultSqliteUrl', () => {
  it('uses prisma/data in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(defaultSqliteUrl()).toBe('file:./data/dev.db');
  });

  it('uses prisma/dev.db outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(defaultSqliteUrl()).toBe('file:./dev.db');
  });
});

describe('getSqliteDatabasePath', () => {
  it('resolves a relative file: URL against prisma/', () => {
    process.env.DATABASE_URL = 'file:./dev.db';
    expect(getSqliteDatabasePath()).toBe(path.resolve(process.cwd(), 'prisma', './dev.db'));
  });

  it('returns an absolute path unchanged', () => {
    const abs = path.resolve(process.cwd(), 'tmp-veladesk.db');
    process.env.DATABASE_URL = `file:${abs}`;
    expect(getSqliteDatabasePath()).toBe(abs);
  });
});
