"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Ticket, 
  User, 
  Settings, 
  X, 
  CornerDownLeft,
  LayoutDashboard,
  Users,
  Box
} from 'lucide-react';

/**
 * Omnibox (Cmd+K) Component
 * Ein globales Such- und Befehlsmenü für VelaDesk.
 * Gebaut nach SOP 03-ui-ux Designvorgaben.
 */
export const Omnibox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Globaler Keyboard-Listener für Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop mit sanftem Blur */}
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[3px] animate-in fade-in duration-300" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Das Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1a1f24] rounded-2xl shadow-2xl border border-surface-container dark:border-white/10 overflow-hidden animate-in slide-in-from-top-4 duration-200">
        
        {/* Search Header */}
        <div className="flex items-center gap-4 px-6 h-16 border-b border-surface-container dark:border-white/5 bg-surface-bright dark:bg-[#1a1f24]">
          <Search className="w-5 h-5 text-on-surface-variant dark:text-white/30" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-base text-on-background dark:text-white placeholder:text-on-surface-variant/40 dark:placeholder:text-white/20"
            placeholder="Nach Tickets, Kunden oder Funktionen suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container dark:bg-white/5 text-[10px] font-bold text-on-surface-variant dark:text-on-surface/40 uppercase tracking-tighter border border-surface-container-high dark:border-white/5">
             ESC
          </div>
        </div>

        {/* Results Area */}
        <div className="max-h-[440px] overflow-y-auto custom-scrollbar p-3 space-y-1 bg-surface-container-lowest dark:bg-[#1a1f24]">
          
          {search.length === 0 ? (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-on-surface-variant dark:text-on-surface/30 tracking-widest uppercase">
                Schnellzugriff
              </div>
              <OmniboxItem icon={Ticket} title="Neues Ticket erstellen" shortcut="N" />
              <OmniboxItem icon={LayoutDashboard} title="Dashboard öffnen" />
              <OmniboxItem icon={Box} title="CMDB / Assets" />
              
              <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-on-surface-variant dark:text-on-surface/30 tracking-widest uppercase">
                Verwaltung
              </div>
              <OmniboxItem icon={Users} title="Kundenstamm verwalten" />
              <OmniboxItem icon={Settings} title="Tenant Einstellungen" />
            </>
          ) : (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-on-surface-variant dark:text-on-surface/30 tracking-widest uppercase">
                Suchergebnisse für "{search}"
              </div>
              <OmniboxItem icon={Ticket} title={`#TK-1024: ${search} - Problem im Backend`} subtitle="Status: Offen | IT-Support" />
              <OmniboxItem icon={User} title={`Kunde: ${search}er, Max`} subtitle="Firma: Contoso GmbH" />
            </>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 h-12 bg-surface-container-low dark:bg-[#12181b] border-t border-surface-container dark:border-white/5 flex items-center justify-between text-[11px] text-on-surface-variant dark:text-on-surface/40">
           <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><CornerDownLeft className="w-3.5 h-3.5 opacity-50" /> Auswählen</span>
              <span className="flex items-center gap-1.5"><X className="w-3.5 h-3.5 opacity-50" /> Schließen</span>
           </div>
           <div className="font-semibold tracking-tight">
              VelaDesk Omnibox <span className="text-primary dark:text-white/20">v0.5</span>
           </div>
        </div>
      </div>
    </div>
  );
};

interface OmniboxItemProps { 
  icon: any; 
  title: string; 
  subtitle?: string; 
  shortcut?: string; 
}

const OmniboxItem = ({ icon: Icon, title, subtitle, shortcut }: OmniboxItemProps) => (
  <button className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-surface-container-high dark:hover:bg-white/5 transition-all group text-left">
    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container dark:bg-white/5 border border-surface-container-high dark:border-white/10 text-on-surface-variant dark:text-white/40 group-hover:text-primary dark:group-hover:text-white group-hover:bg-primary/5 dark:group-hover:bg-white/10 transition-all">
       <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
       <div className="text-sm font-semibold text-on-background dark:text-white/80 group-hover:text-on-background dark:group-hover:text-white truncate transition-colors">
         {title}
       </div>
       {subtitle && (
         <div className="text-[11px] text-on-surface-variant/60 dark:text-on-surface/40 truncate group-hover:text-on-surface-variant dark:group-hover:text-on-surface/60 transition-colors">
           {subtitle}
         </div>
       )}
    </div>
    {shortcut && (
       <div className="px-2 py-0.5 rounded border border-surface-container-high dark:border-white/10 text-[10px] font-bold text-on-surface-variant dark:text-on-surface/30">
          {shortcut}
       </div>
    )}
  </button>
);
