import React from 'react';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { GlobalSidebar } from "@/components/layout/GlobalSidebar";
import { unauthenticatedSignInPath } from '@/lib/auth/bootstrapAuth';
import { isAdminPortalRole } from '@/lib/auth/roles';
import { readStaffBootstrapEnabled } from '@/lib/auth/entraConfig';
import { requireAgentContext } from '@/lib/auth/session';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await requireAgentContext();
  if (!authResult.ok) {
    redirect(unauthenticatedSignInPath(await readStaffBootstrapEnabled()));
  }
  if (!isAdminPortalRole(authResult.ctx.role)) {
    redirect('/tickets');
  }

  return (
    <>
      <GlobalSidebar />
      <div className="ml-[64px] flex w-full h-full">
        <AdminSidebar />
        <main className="flex h-full flex-1 flex-col overflow-hidden bg-surface-container-lowest">
          {children}
        </main>
      </div>
    </>
  );
}
