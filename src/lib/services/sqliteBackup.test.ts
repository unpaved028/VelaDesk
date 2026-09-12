import { describe, expect, it } from 'vitest';
import zlib from 'zlib';
import { decodeBackupPayload, isGzipBuffer, isSqliteDatabase, isZipBuffer } from './sqliteBackup';

const sqliteHeader = Buffer.concat([
  Buffer.from('SQLite format 3\0'),
  Buffer.alloc(32, 1),
]);

describe('sqlite backup payload', () => {
  it('accepts a raw SQLite file', () => {
    expect(isSqliteDatabase(sqliteHeader)).toBe(true);
    expect(decodeBackupPayload(sqliteHeader).subarray(0, 16).toString()).toBe('SQLite format 3\0');
  });

  it('gunzips a .db.gz snapshot', () => {
    const gzipped = zlib.gzipSync(sqliteHeader);
    expect(isGzipBuffer(gzipped)).toBe(true);
    expect(isSqliteDatabase(decodeBackupPayload(gzipped))).toBe(true);
  });

  it('rejects PKZIP and random bytes', () => {
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    expect(isZipBuffer(zip)).toBe(true);
    expect(() => decodeBackupPayload(zip)).toThrow(/ZIP/);
    expect(() => decodeBackupPayload(Buffer.from('hello'))).toThrow(/not a SQLite/);
  });

  it('rejects gzip that is not SQLite', () => {
    expect(() => decodeBackupPayload(zlib.gzipSync(Buffer.from('not-a-db')))).toThrow(/not a SQLite/);
  });
});
