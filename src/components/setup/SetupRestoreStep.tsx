'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cloud, Database, Upload } from 'lucide-react';
import { listFirstRunCloudBackups, restoreFirstRunFromCloud } from '@/lib/actions/backupActions';
import type { CloudBackupItem, FirstRunCloudCredentials } from '@/types/backup';

interface SetupRestoreStepProps {
  onError: (message: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}

const emptyCloud: FirstRunCloudCredentials = {
  msTenantId: '',
  clientId: '',
  clientSecret: '',
  mailboxAddress: '',
  folderOrUrl: 'VelaDeskBackups',
};

export const SetupRestoreStep = ({ onError, isSubmitting, setIsSubmitting }: SetupRestoreStepProps) => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [cloud, setCloud] = useState(emptyCloud);
  const [items, setItems] = useState<CloudBackupItem[]>([]);
  const [selectedId, setSelectedId] = useState('');

  const finish = async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const status = await fetch('/api/system/init-status', { cache: 'no-store' });
        const payload = (await status.json()) as { data?: { isInitialized?: boolean } };
        if (payload.data?.isInitialized) {
          router.push('/login');
          return;
        }
      } catch {
        // init-status can lag one tick while Prisma reconnects
      }
      await new Promise((resolve) => window.setTimeout(resolve, 400));
    }
    router.push('/login');
  };

  const restoreFile = async () => {
    if (!file) {
      onError('Choose a .db or .db.gz backup file.');
      return;
    }
    onError(null);
    setIsSubmitting(true);
    try {
      const body = new FormData();
      body.set('file', file);
      const response = await fetch('/api/system/restore', { method: 'POST', body });
      const payload = (await response.json()) as { success: boolean; error: string | null };
      if (!payload.success) {
        onError(payload.error || 'Restore failed.');
        return;
      }
      await finish();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Restore failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const listCloud = async () => {
    onError(null);
    setIsSubmitting(true);
    const result = await listFirstRunCloudBackups(cloud);
    setIsSubmitting(false);
    if (!result.success || !result.data) {
      onError(result.error || 'Could not list backups.');
      return;
    }
    setItems(result.data);
    setSelectedId(result.data[0]?.id ?? '');
    if (result.data.length === 0) {
      onError('No VelaDesk backups in that folder.');
    }
  };

  const restoreCloud = async () => {
    onError(null);
    setIsSubmitting(true);
    const result = await restoreFirstRunFromCloud({ ...cloud, itemId: selectedId || undefined });
    setIsSubmitting(false);
    if (!result.success) {
      onError(result.error || 'Cloud restore failed.');
      return;
    }
    await finish();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight mb-2">Restore from backup</h2>
        <p className="text-sm text-on-surface-variant/60 leading-relaxed">
          Upload a VelaDesk SQLite file, or pull the latest snapshot from OneDrive / SharePoint.
          This replaces the empty database. Do not continue the fresh-install wizard afterwards.
        </p>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-primary" />
          <div className="text-sm font-bold">Upload file</div>
        </div>
        <input
          type="file"
          accept=".db,.db.gz,application/gzip,application/x-sqlite3"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-widest file:text-slate-900"
        />
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void restoreFile()}
          className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-900 disabled:opacity-50"
        >
          <Database className="w-4 h-4" />
          Restore this file
        </button>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Cloud className="w-5 h-5 text-primary" />
          <div>
            <div className="text-sm font-bold">Microsoft 365 vault</div>
            <p className="text-[11px] text-white/40">
              Shared mailboxes often have no OneDrive. Prefer a SharePoint site URL or a licensed user.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CloudField
            label="Entra tenant ID"
            value={cloud.msTenantId}
            onChange={(value) => setCloud((prev) => ({ ...prev, msTenantId: value }))}
          />
          <CloudField
            label="Mailbox (Graph app)"
            value={cloud.mailboxAddress}
            onChange={(value) => setCloud((prev) => ({ ...prev, mailboxAddress: value }))}
          />
          <CloudField
            label="Client ID"
            value={cloud.clientId}
            onChange={(value) => setCloud((prev) => ({ ...prev, clientId: value }))}
          />
          <CloudField
            label="Client secret"
            type="password"
            value={cloud.clientSecret}
            onChange={(value) => setCloud((prev) => ({ ...prev, clientSecret: value }))}
          />
        </div>
        <CloudField
          label="OneDrive folder or SharePoint site URL"
          value={cloud.folderOrUrl}
          onChange={(value) => setCloud((prev) => ({ ...prev, folderOrUrl: value }))}
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void listCloud()}
            className="rounded-2xl border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            List backups
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void restoreCloud()}
            className="rounded-2xl bg-tertiary px-5 py-3 text-xs font-black uppercase tracking-widest text-on-tertiary disabled:opacity-50"
          >
            Restore latest / selected
          </button>
        </div>
        {items.length > 0 && (
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({Math.round(item.size / 1024)} KB)
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

const CloudField = ({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) => (
  <label className="space-y-1 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
    {label}
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white normal-case tracking-normal opacity-100"
    />
  </label>
);
