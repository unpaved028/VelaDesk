export type BackupSkipReason = 'no_target';

export type BackupRunResult =
  | { ok: true; skipped: true; reason: BackupSkipReason }
  | { ok: true; skipped: false; fileName: string; bytes: number; destination: string }
  | { ok: false; error: string };

export interface CloudBackupItem {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  webUrl?: string;
}

export interface FirstRunCloudCredentials {
  msTenantId: string;
  clientId: string;
  clientSecret: string;
  mailboxAddress: string;
  folderOrUrl: string;
}
