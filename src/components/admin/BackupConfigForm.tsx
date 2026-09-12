'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Cloud,
  Clock,
  Database,
  Download,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import {
  listCloudBackups,
  restoreFromCloudBackup,
  runOffsiteBackupNow,
  testBackupTarget,
} from '@/lib/actions/backupActions';
import { saveBackupConfig } from '@/lib/actions/systemConfig';
import { composeBackupTargetFolder, splitBackupTargetFolder } from '@/lib/services/backupTarget';
import type { CloudBackupItem } from '@/types/backup';

interface BackupConfigFormProps {
  initialData: {
    backupSchedule: string;
    backupTargetMailbox: string | null;
    backupTargetFolder: string;
  };
  mailboxes: { id: string; mailboxAddress: string }[];
  canRestore: boolean;
}

export const BackupConfigForm = ({ initialData, mailboxes, canRestore }: BackupConfigFormProps) => {
  const parsed = useMemo(
    () => splitBackupTargetFolder(initialData.backupTargetFolder),
    [initialData.backupTargetFolder]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [schedule, setSchedule] = useState(initialData.backupSchedule);
  const [targetMailbox, setTargetMailbox] = useState(initialData.backupTargetMailbox || '');
  const [sharePointUrl, setSharePointUrl] = useState(parsed.sharePointUrl);
  const [folderName, setFolderName] = useState(parsed.folder);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [items, setItems] = useState<CloudBackupItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [vaultHint, setVaultHint] = useState<string | null>(null);

  const configured = Boolean(targetMailbox);

  const refreshList = async () => {
    const result = await listCloudBackups();
    if (!result.success || !result.data) {
      setItems([]);
      const error = result.error || 'Could not list cloud backups.';
      setVaultHint(error);
      return error;
    }
    setItems(result.data);
    setSelectedId(result.data[0]?.id ?? '');
    setVaultHint(null);
    return null;
  };

  useEffect(() => {
    if (!configured) return;
    void refreshList();
  }, [configured]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const result = await saveBackupConfig({
      backupSchedule: schedule,
      backupTargetMailbox: targetMailbox || null,
      backupTargetFolder: composeBackupTargetFolder(sharePointUrl, folderName),
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Backup configuration saved. Schedule is active now.' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to save configuration.' });
    }
    setIsSaving(false);
  };

  const handleBackupNow = async () => {
    setIsWorking(true);
    setMessage(null);
    const result = await runOffsiteBackupNow();
    if (!result.success || !result.data || !result.data.ok || result.data.skipped) {
      setMessage({ type: 'error', text: result.error || 'Offsite backup failed.' });
    } else {
      setMessage({
        type: 'success',
        text: `Uploaded ${result.data.fileName} to ${result.data.destination}.`,
      });
      await refreshList();
    }
    setIsWorking(false);
  };

  const handleTest = async () => {
    setIsWorking(true);
    setMessage(null);
    const result = await testBackupTarget();
    if (!result.success || !result.data) {
      setMessage({ type: 'error', text: result.error || 'Target test failed.' });
    } else {
      setMessage({ type: 'success', text: `Reachable: ${result.data.destination}` });
    }
    setIsWorking(false);
  };

  const handleCloudRestore = async () => {
    if (!selectedId) {
      setMessage({ type: 'error', text: 'Select a cloud backup first.' });
      return;
    }
    if (!window.confirm('This replaces the live database. A local .bak copy is kept next to the SQLite file. Continue?')) {
      return;
    }
    setIsWorking(true);
    setMessage(null);
    const result = await restoreFromCloudBackup(selectedId);
    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Cloud restore failed.' });
    } else {
      setMessage({ type: 'success', text: `Restored. ${result.data?.userCount ?? 0} users in the database. Reload the app.` });
    }
    setIsWorking(false);
  };

  const handleFileRestore = async () => {
    if (!restoreFile) {
      setMessage({ type: 'error', text: 'Choose a .db or .db.gz file.' });
      return;
    }
    if (!window.confirm('This replaces the live database. A local .bak copy is kept next to the SQLite file. Continue?')) {
      return;
    }
    setIsWorking(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.set('file', restoreFile);
      const response = await fetch('/api/system/restore', { method: 'POST', body });
      const payload = (await response.json()) as { success: boolean; error: string | null };
      if (!payload.success) {
        setMessage({ type: 'error', text: payload.error || 'Restore failed.' });
      } else {
        setMessage({ type: 'success', text: 'Database restored. Reload the app.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Restore failed.' });
    }
    setIsWorking(false);
  };

  const baseInputStyle =
    'w-full p-4 bg-surface-container-low dark:bg-white/5 border border-surface-container dark:border-white/10 rounded-2xl text-sm transition-all focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-white/10';

  return (
    <div className="bg-white dark:bg-white/5 rounded-[40px] border border-surface-container dark:border-white/5 p-8 md:p-12 shadow-2xl dark:shadow-none">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
            <Database className="w-6 h-6 text-primary" /> Offsite Backup
          </h3>
          <p className="text-sm text-on-surface-variant/60 mt-2 max-w-2xl">
            Snapshot the SQLite database and upload it through Microsoft Graph. Shared mailboxes
            usually have no OneDrive — use a licensed user or a SharePoint site.
          </p>
        </div>
        <div
          className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase ${
            configured
              ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
              : 'bg-surface-container text-on-surface-variant/60 border-surface-container'
          }`}
        >
          {configured ? 'Configured' : 'Not configured'}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {message && (
          <div
            className={`p-4 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant/80">
              <Clock className="w-3 h-3" /> Backup Schedule (CRON)
            </label>
            <input
              type="text"
              value={schedule}
              onChange={(event) => setSchedule(event.target.value)}
              placeholder="e.g. 0 3 * * *"
              className={baseInputStyle}
              required
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant/80">
              <Mail className="w-3 h-3" /> Graph mailbox
            </label>
            <select
              value={targetMailbox}
              onChange={(event) => setTargetMailbox(event.target.value)}
              className={baseInputStyle}
            >
              <option value="">-- No Offsite Backup --</option>
              {mailboxes.map((mailbox) => (
                <option key={mailbox.id} value={mailbox.mailboxAddress}>
                  {mailbox.mailboxAddress}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant/80">
              <Cloud className="w-3 h-3" /> SharePoint site (optional)
            </label>
            <input
              type="url"
              value={sharePointUrl}
              onChange={(event) => setSharePointUrl(event.target.value)}
              placeholder="https://contoso.sharepoint.com/sites/IT"
              className={baseInputStyle}
            />
            <p className="text-[10px] text-on-surface-variant/50">
              Empty = OneDrive of the selected mailbox. Needs Files.ReadWrite.All and, for sites,
              Sites.ReadWrite.All.
            </p>
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant/80">
              <RefreshCw className="w-3 h-3" /> Folder
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="VelaDeskBackups"
              className={baseInputStyle}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-surface-container dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant/60">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            Graph upload, last 14 files kept
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isWorking || !configured}
              onClick={() => void handleTest()}
              className="px-5 py-3 rounded-2xl border border-surface-container text-xs font-black uppercase tracking-widest disabled:opacity-50"
            >
              Test target
            </button>
            <button
              type="button"
              disabled={isWorking || !configured}
              onClick={() => void handleBackupNow()}
              className="px-5 py-3 rounded-2xl bg-surface-container-low text-xs font-black uppercase tracking-widest disabled:opacity-50"
            >
              Backup now
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-xl shadow-primary/20"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/80">
            Cloud vault
          </h4>
          {!canRestore ? (
            <p className="text-sm text-on-surface-variant/60">
              Restore is SUPER_ADMIN only. You can still configure the target and run Backup now.
            </p>
          ) : null}
          {vaultHint && (
            <p className="text-sm text-red-600">{vaultHint}</p>
          )}
          {items.length === 0 && !vaultHint ? (
            <p className="text-sm text-on-surface-variant/50">
              No VelaDesk backups listed yet. Save the target, grant Graph file permissions, then Backup now.
            </p>
          ) : items.length > 0 ? (
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className={baseInputStyle}
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({Math.round(item.size / 1024)} KB)
                </option>
              ))}
            </select>
          ) : null}
          {canRestore ? (
            <button
              type="button"
              disabled={isWorking || !selectedId}
              onClick={() => void handleCloudRestore()}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-red-500/20 text-red-700 text-xs font-black uppercase tracking-widest disabled:opacity-50"
            >
              <Cloud className="w-4 h-4" />
              Restore selected cloud backup
            </button>
          ) : null}
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/80">
            Local file
          </h4>
          {canRestore ? (
            <>
              <a
                href="/api/admin/backup"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-surface-container text-xs font-black uppercase tracking-widest"
              >
                <Download className="w-4 h-4" />
                Download snapshot
              </a>
              <input
                type="file"
                accept=".db,.db.gz,application/gzip,application/x-sqlite3"
                onChange={(event) => setRestoreFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
              <button
                type="button"
                disabled={isWorking}
                onClick={() => void handleFileRestore()}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-red-500/20 text-red-700 text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Restore uploaded file
              </button>
            </>
          ) : (
            <p className="text-sm text-on-surface-variant/60">
              Local download is the SUPER_ADMIN emergency exit.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
