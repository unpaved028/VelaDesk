'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Download, CheckCircle, AlertTriangle, ShieldCheck, Rocket } from 'lucide-react';
import { checkUpdatesAction, triggerAppUpdate } from '@/lib/actions/updateActions';

export const UpdateDashboard = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'checking' | 'ready' | 'updating' | 'finished'>('idle');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const [currentVersion, setCurrentVersion] = useState("0.1.0");
  const [latestVersion, setLatestVersion] = useState("0.1.0");
  const [hasUpdate, setHasUpdate] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState("");

  const checkUpdates = useCallback(async () => {
    setIsChecking(true);
    setStatus('checking');
    try {
      const res = await checkUpdatesAction();
      if (res.success && res.data) {
        setCurrentVersion(res.data.currentVersion);
        setLatestVersion(res.data.latestVersion);
        setHasUpdate(res.data.hasUpdate);
        setReleaseNotes(res.data.releaseNotes || '');
        setStatus(res.data.hasUpdate ? 'ready' : 'idle');
      } else {
        setStatus('idle');
      }
    } catch (e) {
      setStatus('idle');
    } finally {
      setIsChecking(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkUpdates();
  }, [checkUpdates]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setStatus('updating');
    
    // Simulating progress while calling actual backend
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 10;
      if (p >= 90) {
        setProgress(90);
      } else {
        setProgress(p);
      }
    }, 400);

    try {
      const res = await triggerAppUpdate();
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setStatus('finished');
        setIsUpdating(false);
      }, 500);
    } catch (e) {
      clearInterval(interval);
      setStatus('ready');
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-white/5 rounded-3xl border border-surface-container dark:border-white/5 overflow-hidden shadow-2xl dark:shadow-none animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <RefreshCcw className={`w-7 h-7 text-primary ${isUpdating || isChecking ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-on-background dark:text-white">Software Updates</h3>
              <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest mt-0.5">Maintain system health and security</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Current</span>
              <span className="text-sm font-black tracking-tight">v{currentVersion}</span>
            </div>
            {hasUpdate && (
              <>
                <div className="w-4 h-px bg-slate-200 dark:bg-white/10" />
                <div className="px-4 py-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl border border-emerald-500/20 flex flex-col items-center min-w-[100px]">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-600 dark:text-emerald-400 opacity-60">Latest</span>
                  <span className="text-sm font-black tracking-tight text-emerald-600 dark:text-emerald-400">v{latestVersion}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {status === 'ready' && hasUpdate && (
          <div className="space-y-6">
            <div className="p-6 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex gap-4 items-start">
              <Rocket className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
              <div>
                <h4 className="text-sm font-black tracking-tight text-emerald-700 dark:text-emerald-400">New Version Available!</h4>
                <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/60 mt-1 leading-relaxed whitespace-pre-wrap">
                  {releaseNotes || `Version ${latestVersion} is now available for download.`}
                </p>
              </div>
            </div>

            <button 
              onClick={handleUpdate}
              className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Download className="w-4 h-4" />
              Start Web Update
            </button>
          </div>
        )}
        
        {status === 'idle' && !hasUpdate && (
           <div className="py-8 text-center">
             <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
               <CheckCircle className="w-8 h-8 text-slate-400 dark:text-white/40" />
             </div>
             <h4 className="text-sm font-black tracking-tight mb-1 cursor-default">System is up to date</h4>
             <p className="text-xs font-medium text-on-surface-variant/60 cursor-default">You are running the latest version of VelaDesk.</p>
           </div>
        )}

        {status === 'updating' && (
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-end mb-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Running Deployment Engine...</span>
                <span className="text-lg font-black tracking-tighter">Updating to v{latestVersion}</span>
              </div>
              <span className="text-sm font-black mb-1">{Math.floor(progress)}%</span>
            </div>
            
            <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-1">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]" 
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest opacity-40 justify-center">
              <ShieldCheck className="w-3 h-3" />
              <span>Automatic pre-update backup running</span>
            </div>
          </div>
        )}

        {status === 'finished' && (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h4 className="text-xl font-black tracking-tight mb-2">Update Initiated!</h4>
            <p className="text-sm font-medium text-on-surface-variant/60 max-w-sm mb-8">
              VelaDesk is now updating to version {latestVersion}. The system will restart automatically in a few seconds.
            </p>
            <button 
              onClick={() => {
                setStatus('idle');
                setCurrentVersion(latestVersion);
                setHasUpdate(false);
              }}
              className="px-8 py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Back to Overview
            </button>
          </div>
        )}
      </div>

      <div className="px-8 py-5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-[#f9a825]" />
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter opacity-60">
            {isChecking ? 'Checking...' : (lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Not checked recently')}
          </span>
        </div>
        <button 
          onClick={checkUpdates}
          disabled={isChecking || isUpdating}
          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4 disabled:opacity-50 disabled:hover:no-underline"
        >
          Check for Updates
        </button>
      </div>
    </div>
  );
};

