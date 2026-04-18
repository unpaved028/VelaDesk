'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, Building2, Briefcase, Users, Tags, Inbox } from 'lucide-react';

export const AdminSidebar = () => {
  const pathname = usePathname();
  
  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'System', href: '/admin/system', icon: Settings },
    { label: 'Tenants', href: '/admin/tenants', icon: Building2 },
    { label: 'Workspaces', href: '/admin/workspaces', icon: Briefcase },
    { label: 'Agents', href: '/admin/agents', icon: Users },
    { label: 'Taxonomy', href: '/admin/taxonomy', icon: Tags },
    { label: 'Mailboxes', href: '/admin/mailboxes', icon: Inbox },
  ];

  return (
    <div className="w-64 bg-surface-container-low dark:bg-[#12181b] flex flex-col h-full border-r border-surface-container dark:border-white/5">
      <div className="h-16 flex items-center px-6 border-b border-surface-container dark:border-white/5">
        <h2 className="font-semibold text-lg text-on-background dark:text-white">Admin Setup</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
                isActive 
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-fixed' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright dark:hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

