'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VelaLogo } from '../ui/VelaLogo';
import { ThemeToggle } from "./ThemeToggle";

export const GlobalSidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: 'dashboard', label: 'Dashboard', active: pathname === '/' },
    { href: '/tickets', icon: 'confirmation_number', label: 'Tickets', active: pathname.startsWith('/tickets') },
    { href: '/customers', icon: 'group', label: 'Customers', active: pathname.startsWith('/customers') },
    { href: '/admin', icon: 'settings', label: 'Settings', active: pathname.startsWith('/admin') },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[64px] z-50 flex flex-col items-center py-6 border-r border-outline-variant/15 bg-slate-100/40 backdrop-blur-xl dark:bg-[#000e23] shadow-2xl shadow-black/5 dark:shadow-black">
      {/* Brand Logo */}
      <div className="mb-8 w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary-fixed/20">
        <VelaLogo variant="icon" className="w-full h-full" />
      </div>

      <nav className="flex flex-col items-center gap-4 flex-1">
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative group ${
              item.active 
                ? 'bg-primary-container text-on-primary-container shadow-md' 
                : 'text-outline hover:text-on-surface hover:bg-surface-variant/50'
            }`}
            title={item.label}
          >
            <span className={`material-symbols-outlined text-[24px] ${item.active ? 'fill-[1]' : ''}`}>
              {item.icon}
            </span>
            
            {/* Active Indicator Dot */}
            {item.active && (
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary-fixed rounded-full shadow-[0_0_8px_var(--primary-fixed)]" />
            )}

            {/* Tooltip (Desktop only) */}
            <div className="absolute left-14 px-2 py-1 bg-surface-container-highest text-on-surface text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 uppercase tracking-widest shadow-xl border border-outline-variant/10">
              {item.label}
            </div>
          </Link>
        ))}
      </nav>
      
      <div className="mt-auto flex flex-col items-center gap-4">
        <ThemeToggle />
      </div>
    </aside>
  );
};

