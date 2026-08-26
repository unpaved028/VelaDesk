import React from 'react';
import { redirect } from 'next/navigation';
import { GlobalSidebar } from "@/components/layout/GlobalSidebar";
import { requireAgentContext } from '@/lib/auth/session';

/**
 * AgentLayout wraps all internal agent routes with the GlobalSidebar.
 * Session is required here as defense-in-depth; middleware already checks staff role (H1).
 */
export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await requireAgentContext();
  if (!authResult.ok) {
    redirect('/api/auth/signin');
  }

  return (
    <>
      <GlobalSidebar />
      <div className="ml-[64px] flex flex-1 h-screen overflow-hidden min-h-0 w-full">
        {children}
      </div>
    </>
  );
}
