export const BACKUP_RETENTION_COUNT = 14;
export const DEFAULT_BACKUP_FOLDER = 'VelaDeskBackups';

export interface SharePointTarget {
  kind: 'sharepoint';
  hostname: string;
  serverRelativePath: string;
  folder: string;
}

export interface OneDriveTarget {
  kind: 'onedrive';
  mailboxAddress: string;
  folder: string;
}

export type DriveTarget = SharePointTarget | OneDriveTarget;

export function looksLikeSharePointUrl(value: string): boolean {
  return parseSharePointSiteUrl(value) !== null;
}

/**
 * Accepts a site URL, optionally with a library-relative folder:
 * https://contoso.sharepoint.com/sites/IT
 * https://contoso.sharepoint.com/sites/IT/Shared Documents/VelaDeskBackups
 */
export function parseSharePointSiteUrl(value: string): SharePointTarget | null {
  const trimmed = value.trim();
  if (!/^https:\/\//i.test(trimmed)) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!/\.sharepoint\.com$/i.test(url.hostname)) return null;

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const root = parts[0].toLowerCase();
  if (root !== 'sites' && root !== 'teams') return null;

  const folderFromPath = parts.slice(2).map((part) => decodeURIComponent(part)).join('/');
  return {
    kind: 'sharepoint',
    hostname: url.hostname.toLowerCase(),
    serverRelativePath: `/${parts[0]}/${parts[1]}`,
    folder: sanitizeFolder(folderFromPath || DEFAULT_BACKUP_FOLDER),
  };
}

export function sanitizeFolder(value: string): string {
  const segments = value
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  if (segments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error('Folder path must not contain parent segments.');
  }

  return segments.join('/') || DEFAULT_BACKUP_FOLDER;
}

export function encodeDrivePath(relative: string): string {
  return sanitizeFolder(relative)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function composeBackupTargetFolder(sharePointUrl: string, folder: string): string {
  const site = sharePointUrl.trim().replace(/\/+$/, '');
  const dest = folder.trim() || DEFAULT_BACKUP_FOLDER;
  if (!site) return dest;
  return `${site}/${dest}`;
}

export function splitBackupTargetFolder(value: string): { sharePointUrl: string; folder: string } {
  const parsed = parseSharePointSiteUrl(value);
  if (!parsed) {
    return { sharePointUrl: '', folder: value.trim() || DEFAULT_BACKUP_FOLDER };
  }
  return {
    sharePointUrl: `https://${parsed.hostname}${parsed.serverRelativePath}`,
    folder: parsed.folder,
  };
}

export function resolveBackupTarget(input: {
  mailboxAddress: string | null;
  folderOrUrl: string;
}): DriveTarget {
  const parsed = parseSharePointSiteUrl(input.folderOrUrl);
  if (parsed) return parsed;

  if (!input.mailboxAddress?.trim()) {
    throw new Error('Select a mailbox for OneDrive, or paste a SharePoint site URL.');
  }

  return {
    kind: 'onedrive',
    mailboxAddress: input.mailboxAddress.trim(),
    folder: sanitizeFolder(input.folderOrUrl || DEFAULT_BACKUP_FOLDER),
  };
}

export function formatDriveDestination(target: DriveTarget): string {
  if (target.kind === 'sharepoint') {
    return `SharePoint ${target.hostname}${target.serverRelativePath}/${target.folder}`;
  }
  return `OneDrive ${target.mailboxAddress}/${target.folder}`;
}

export function isVelaDeskBackupName(name: string): boolean {
  return /^VelaDesk-backup-.+\.(db|db\.gz)$/i.test(name);
}
