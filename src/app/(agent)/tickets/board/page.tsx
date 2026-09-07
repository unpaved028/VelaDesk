'use client';

import React from 'react';
import { KanbanBoard } from '@/components/tickets/KanbanBoard';

export default function KanbanPage() {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-surface-container-lowest">
      <header className="z-40 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant/15 bg-surface-container-lowest/80 px-8 backdrop-blur-md">
        <div>
          <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface">Kanban Board</h1>
          <p className="text-[10px] font-medium text-on-surface-variant">Visual Ticket Management</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <KanbanBoard />
      </main>
    </div>
  );
}
