'use client';

import React from 'react';
import { KanbanBoard } from '@/components/tickets/KanbanBoard';

export default function KanbanPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-surface-container-lowest dark:bg-[#1a1f24] overflow-hidden">
      <header className="h-16 flex items-center justify-between px-8 bg-white/80 dark:bg-[#1a1f24]/80 backdrop-blur-md z-40 border-b border-surface-container dark:border-white/5 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-background dark:text-white uppercase">Kanban Board</h1>
          <p className="text-[10px] text-on-surface-variant font-medium opacity-60">Visual Ticket Management</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <KanbanBoard />
      </main>
    </div>
  );
}
