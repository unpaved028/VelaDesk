'use client';

import React, { useState } from 'react';
import { Database, Cloud, Clock, ShieldCheck, Save, RefreshCw, HardDrive, Mail } from 'lucide-react';
import { saveBackupConfig } from '@/lib/actions/systemConfig';

interface BackupConfigFormProps {
  initialData: {
    backupSchedule: string;
    backupTargetMailbox: string | null;
    backupTargetFolder: string;
  };
  mailboxes: { id: string; mailboxAddress: string }[];
}

export const BackupConfigForm = ({ initialData, mailboxes }: BackupConfigFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState(initialData.backupSchedule);
  const [targetMailbox, setTargetMailbox] = useState(initialData.backupTargetMailbox || '');
  const [destinationPath, setDestinationPath] = useState(initialData.backupTargetFolder);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    const result = await saveBackupConfig({
      backupSchedule: schedule,
      backupTargetMailbox: targetMailbox || null,
      backupTargetFolder: destinationPath
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Backup configuration saved successfully.' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to save configuration.' });
    }
    
    setIsLoading(false);
  };

  const baseInputStyle = "w-full p-4 bg-surface-container-low dark:bg-white/5 border border-surface-container dark:border-white/10 rounded-2xl text-sm transition-all focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-white/10";

  return (
    <div className="bg-white dark:bg-white/5 rounded-[40px] border border-surface-container dark:border-white/5 p-8 md:p-12 shadow-2xl dark:shadow-none">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
            <Database className="w-6 h-6 text-primary" /> Offsite Backup
          </h3>
          <p className="text-sm text-on-surface-variant/60 mt-2">
            Securely back up your SQLite database to the cloud via Microsoft Graph API.
          </p>
        </div>
        <div className="px-3 py-1 bg-green-500/10 text-green-600 text-[10px] font-bold rounded-full border border-green-500/20 uppercase">
          Engine Active
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {message && (
          <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Schedule Section */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant/80">
              <Clock className="w-3 h-3" /> Backup Schedule (CRON)
            </label>
            <input 
              type="text" 
              value={schedule} 
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="e.g. 0 3 * * *"
              className={baseInputStyle}
              required
            />
            <p className="text-[10px] text-on-surface-variant/50 italic">
              Use standard cron format (e.g., "0 3 * * *" for 03:00 daily).
            </p>
          </div>

          {/* Target Mailbox Section */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant/80">
              <Mail className="w-3 h-3" /> Target OneDrive Mailbox
            </label>
            <select
              value={targetMailbox}
              onChange={(e) => setTargetMailbox(e.target.value)}
              className={baseInputStyle}
            >
              <option value="">-- No Offsite Backup --</option>
              {mailboxes.map(mb => (
                <option key={mb.id} value={mb.mailboxAddress}>{mb.mailboxAddress}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant/80">
            <RefreshCw className="w-3 h-3" /> Destination Path
          </label>
          <input 
            type="text" 
            value={destinationPath} 
            onChange={(e) => setDestinationPath(e.target.value)}
            placeholder="VelaDeskBackups"
            className={baseInputStyle}
          />
          <p className="text-[10px] text-on-surface-variant/50 italic">
            Folder name in the root of the targeted OneDrive.
          </p>
        </div>

        <div className="pt-6 border-t border-surface-container dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant/60">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            Graph API Upload
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-xl shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
