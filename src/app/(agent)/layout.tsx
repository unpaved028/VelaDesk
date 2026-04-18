import React from 'react';
import { GlobalSidebar } from "@/components/layout/GlobalSidebar";

/**
 * AgentLayout wraps all internal agent routes with the GlobalSidebar.
 * It provides the necessary left margin to accommodate the fixed sidebar.
 */
export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 1. Global Sidebar (Fixed to the left) */}
      <GlobalSidebar />
      
      {/* 2. Main Content Wrapper (With margin for the sidebar) */}
      <div className="ml-[64px] flex flex-1 h-screen overflow-hidden min-h-0 w-full">
        {children}
      </div>
    </>
  );
}
