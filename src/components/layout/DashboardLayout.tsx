import React from 'react';
import { GlobalSidebar } from './GlobalSidebar';

interface DashboardLayoutProps {
  queue?: React.ReactNode;
  conversation?: React.ReactNode;
  context?: React.ReactNode;
}

/**
 * DashboardLayout
 * Implements the 4-Column Grid Architecture from SOP 03.
 * Columns: Sidebar (64px) | Queue (360px) | Conversation (Flex-1) | Context (320px)
 */
export const DashboardLayout = ({ queue, conversation, context }: DashboardLayoutProps) => {
  return (
    <div className="h-screen w-full flex overflow-hidden antialiased bg-surface text-on-surface font-body">
      {/* Column 1: Global Sidebar (Fixed 64px) */}
      <GlobalSidebar />

      {/* Main Content Wrapper */}
      <main className="ml-[64px] flex-1 flex h-screen w-[calc(100%-64px)] overflow-hidden">
        
        {/* Column 2: Ticket Queue (320px - 360px) */}
        <section className="w-[320px] lg:w-[360px] bg-surface-container-low flex flex-col shrink-0 z-20 border-r border-outline-variant/15">
          {queue}
        </section>

        {/* Column 3: Conversation View (Flex-1) */}
        <section className="flex-1 bg-surface-container-lowest flex flex-col relative z-30 shadow-[-20px_0_40px_rgba(23,28,31,0.02)] overflow-hidden">
          {conversation}
        </section>

        {/* Column 4: Context Panel (320px) */}
        <aside className="w-[320px] bg-surface-container-low flex flex-col shrink-0 border-l border-outline-variant/15 z-20 overflow-y-auto">
          {context}
        </aside>

      </main>
    </div>
  );
};
