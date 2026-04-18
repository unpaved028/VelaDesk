import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { GlobalSidebar } from "@/components/layout/GlobalSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobalSidebar />
      <div className="ml-[64px] flex w-full h-full">
        <AdminSidebar />
        <main className="flex-1 bg-surface-container-lowest dark:bg-[#1a1f24] flex flex-col h-full overflow-hidden">
          {children}
        </main>
      </div>
    </>
  );
}
