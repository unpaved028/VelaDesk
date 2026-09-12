'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const AdminSidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
    { label: 'System', href: '/admin/system', icon: 'tune' },
    { label: 'Tenants', href: '/admin/tenants', icon: 'domain' },
    { label: 'Workspaces', href: '/admin/workspaces', icon: 'work' },
    { label: 'Agents', href: '/admin/agents', icon: 'group' },
    { label: 'Taxonomy', href: '/admin/taxonomy', icon: 'sell' },
    { label: 'Customers', href: '/admin/customers', icon: 'apartment' },
    { label: 'Macros', href: '/admin/macros', icon: 'quick_phrases' },
    { label: 'Mailboxes', href: '/admin/mailboxes', icon: 'inbox' },
    { label: 'Routing', href: '/admin/routing', icon: 'alt_route' },
    { label: 'Assets', href: '/admin/assets', icon: 'devices' },
    { label: 'Billing', href: '/admin/billing', icon: 'receipt_long' },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r border-outline-variant/15 bg-surface-container-low">
      <div className="flex h-16 items-center border-b border-outline-variant/15 px-6">
        <h2 className="font-headline text-lg font-semibold text-on-surface">Admin</h2>
      </div>
      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-[1]' : ''}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
