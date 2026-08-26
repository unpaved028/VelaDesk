import pkg from '../../package.json';

/** Single source of truth — keep in sync with package.json version. */
export const APP_VERSION = pkg.version;

/** True when the running code is a higher semver than the DB-recorded appVersion. */
export function isNewer(codeVer: string, dbVer: string): boolean {
  const c = codeVer.split('.').map(Number);
  const d = dbVer.split('.').map(Number);
  for (let i = 0; i < Math.max(c.length, d.length); i++) {
    const cv = c[i] || 0;
    const dv = d[i] || 0;
    if (cv > dv) return true;
    if (cv < dv) return false;
  }
  return false;
}
