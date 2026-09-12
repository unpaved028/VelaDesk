import { describe, expect, it } from 'vitest';
import {
  composeBackupTargetFolder,
  encodeDrivePath,
  isVelaDeskBackupName,
  parseSharePointSiteUrl,
  resolveBackupTarget,
  sanitizeFolder,
  splitBackupTargetFolder,
} from './backupTarget';

describe('parseSharePointSiteUrl', () => {
  it('reads a site URL and defaults the folder', () => {
    expect(parseSharePointSiteUrl('https://contoso.sharepoint.com/sites/IT')).toEqual({
      kind: 'sharepoint',
      hostname: 'contoso.sharepoint.com',
      serverRelativePath: '/sites/IT',
      folder: 'VelaDeskBackups',
    });
  });

  it('keeps a library-relative folder', () => {
    const parsed = parseSharePointSiteUrl(
      'https://contoso.sharepoint.com/sites/IT/Shared%20Documents/VelaDeskBackups'
    );
    expect(parsed?.folder).toBe('Shared Documents/VelaDeskBackups');
  });

  it('rejects a plain folder name', () => {
    expect(parseSharePointSiteUrl('VelaDeskBackups')).toBeNull();
  });
});

describe('sanitizeFolder', () => {
  it('strips slashes and rejects parent segments', () => {
    expect(sanitizeFolder('/Vault/Prod/')).toBe('Vault/Prod');
    expect(() => sanitizeFolder('../etc')).toThrow(/parent/);
  });
});

describe('encodeDrivePath', () => {
  it('encodes each segment', () => {
    expect(encodeDrivePath('Shared Documents/VelaDeskBackups')).toBe(
      'Shared%20Documents/VelaDeskBackups'
    );
  });
});

describe('resolveBackupTarget', () => {
  it('uses OneDrive when the folder is not a SharePoint URL', () => {
    expect(resolveBackupTarget({ mailboxAddress: 'vault@contoso.com', folderOrUrl: 'Vault' })).toEqual({
      kind: 'onedrive',
      mailboxAddress: 'vault@contoso.com',
      folder: 'Vault',
    });
  });

  it('prefers SharePoint when a site URL is stored in the folder field', () => {
    const target = resolveBackupTarget({
      mailboxAddress: 'vault@contoso.com',
      folderOrUrl: 'https://contoso.sharepoint.com/sites/IT',
    });
    expect(target.kind).toBe('sharepoint');
  });
});

describe('backup folder helpers', () => {
  it('round-trips a SharePoint site + folder', () => {
    const stored = composeBackupTargetFolder('https://contoso.sharepoint.com/sites/IT', 'Vault');
    expect(splitBackupTargetFolder(stored)).toEqual({
      sharePointUrl: 'https://contoso.sharepoint.com/sites/IT',
      folder: 'Vault',
    });
  });

  it('recognizes backup file names', () => {
    expect(isVelaDeskBackupName('VelaDesk-backup-2026-09-13T00-00-00.db.gz')).toBe(true);
    expect(isVelaDeskBackupName('notes.txt')).toBe(false);
  });
});
