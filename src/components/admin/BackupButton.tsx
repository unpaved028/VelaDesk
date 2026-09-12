'use client';

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * SUPER_ADMIN local snapshot. Errors stay on the page — B1 forbids alert().
 */
export const BackupButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBackup = async () => {
    setIsLoading(true);
    setIsDone(false);
    setError(null);

    try {
      const res = await fetch('/api/admin/backup');
      const contentType = res.headers.get('Content-Type') || '';

      if (!res.ok) {
        if (contentType.includes('application/json')) {
          const err = (await res.json()) as { error?: string };
          setError(err.error || 'Download denied.');
        } else {
          setError(`Download failed (${res.status}).`);
        }
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const fileNameMatch = disposition.match(/filename="(.+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : 'VelaDesk-backup.db';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Backup download failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void handleBackup()}
        disabled={isLoading}
        className="flex shrink-0 items-center gap-2 rounded-lg border border-surface-container bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-background transition-colors hover:bg-surface-bright disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        title="Download a consistent SQLite snapshot. SUPER_ADMIN only."
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isDone ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isLoading ? 'Downloading...' : isDone ? 'Snapshot saved' : 'Download snapshot'}
      </button>
      {error ? <p className="max-w-xs text-right text-xs text-red-600">{error}</p> : null}
    </div>
  );
};
