import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VelaLogo } from '@/components/ui/VelaLogo';
import { LetterAvatar } from '@/components/ui/LetterAvatar';
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
    <div className="flex min-h-screen flex-col bg-surface text-on-surface antialiased transition-colors">
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-outline-variant/15 bg-surface-container-lowest/80 px-6 backdrop-blur-xl md:px-12">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <VelaLogo variant="horizontal" />
            <span className="hidden text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 sm:inline">
              Serviceportal
            </span>
          </div>
          <PortalNav isCustomerAdmin={session?.isCustomerAdmin === true} />
        </div>

        <div className="flex items-center gap-6">
          <ThemeToggle variant="bar" />
          <div className="hidden h-6 w-px bg-outline-variant/20 sm:block" />
          <Link href="/portal/profile" className="group flex items-center gap-3">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-bold tracking-tight transition-colors group-hover:text-primary">{displayName}</span>
              <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">{roleLabel}</span>
            </div>
            <LetterAvatar name={displayName} />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 justify-center bg-surface-container-low/50 px-6 py-12">
        <div className="w-full max-w-5xl">
          {children}
        </div>
      </main>

      <footer className="border-t border-outline-variant/15 px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="opacity-60">
            <VelaLogo variant="horizontal" size="small" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
            © 2026 VelaDesk
          </p>
        </div>
      </footer>
    </div>
  );
}
