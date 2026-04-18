'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Ticket, Users, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from "./ThemeToggle";

export const GlobalSidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard', active: pathname === '/' },
    { href: '/tickets', icon: Ticket, label: 'Tickets', active: pathname.startsWith('/tickets') },
    { href: '/customers', icon: Users, label: 'Customers', active: pathname.startsWith('/customers') },
    { href: '/admin', icon: ShieldCheck, label: 'Admin', active: pathname.startsWith('/admin') },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[64px] z-50 bg-[#0b0f10] flex flex-col items-center py-6 gap-6">
      {navItems.map((item) => (
        <Link 
          key={item.href}
          href={item.href} 
          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group relative ${
            item.active 
              ? 'bg-primary text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]' 
              : 'text-white/50 hover:text-white hover:bg-white/10'
          }`}
          title={item.label}
        >
          <item.icon className={`w-6 h-6 ${item.active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
          {item.active && (
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_var(--primary)]" />
          )}
        </Link>
      ))}
      
      <div className="mt-auto">
        <ThemeToggle />
      </div>
    </aside>
  );
};

