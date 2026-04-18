'use client';

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';

export const BackupButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleBackup = async () => {
    setIsLoading(true);
    setIsDone(false);

    try {
      const res = await fetch('/api/admin/backup');

      if (!res.ok) {
        const err = await res.json();
        alert(`Backup failed: ${err.error || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }

      // Trigger browser download from the response blob
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
    } catch (error) {
      alert('Backup download failed. Check console for details.');
      console.error('Backup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleBackup}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low dark:bg-white/5 border border-surface-container dark:border-white/10 rounded-lg text-sm font-medium text-on-background dark:text-white hover:bg-surface-bright dark:hover:bg-white/10 transition-colors disabled:opacity-50 shrink-0"
      title="Download SQLite database backup"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isDone ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isLoading ? 'Downloading...' : isDone ? 'Backup Saved!' : '1-Click Backup'}
    </button>
  );
};
