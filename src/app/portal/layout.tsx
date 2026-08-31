import React from 'react';
import { Globe, User } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getPortalSession } from '@/lib/services/getPortalSession';
import { PortalNav } from '@/components/portal/PortalNav';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await getPortalSession();
  const displayName = session?.name || session?.email || 'Customer';
  const roleLabel = session?.isCustomerAdmin ? 'Customer Admin' : 'Customer';

  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-[#0b0f10] text-on-background dark:text-white transition-colors antialiased">
      <header className="h-20 flex items-center justify-between px-6 md:px-12 bg-white/80 dark:bg-[#1a1f24]/80 backdrop-blur-xl border-b border-surface-container dark:border-white/5 z-50 sticky top-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-lg dark:shadow-none">
              <Globe className="w-6 h-6 text-white dark:text-[#0b0f10]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-xl leading-none">VelaDesk</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 dark:text-white/40 mt-1">Service Portal</span>
            </div>
          </div>
          <PortalNav isCustomerAdmin={session?.isCustomerAdmin === true} />
        </div>
        
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <div className="h-6 w-px bg-surface-container dark:bg-white/10 hidden sm:block" />
          <Link href="/portal/profile" className="flex items-center gap-3 group">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">{displayName}</span>
              <span className="text-[10px] text-on-surface-variant/60 dark:text-white/40 uppercase font-bold tracking-tighter">{roleLabel}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
              <User className="w-5 h-5 text-slate-600 dark:text-white" />
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex justify-center py-12 px-6 bg-slate-50/50 dark:bg-transparent">
        <div className="w-full max-w-5xl">
          {children}
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-surface-container dark:border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-40">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-bold tracking-tight">VelaDesk Compute</span>
          </div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/40">
            © 2026 • Powered by VelaDesk Service Management Cloud
          </p>
        </div>
      </footer>
    </div>
  );
}
