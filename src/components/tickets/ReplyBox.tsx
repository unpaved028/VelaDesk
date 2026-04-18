'use client';

import React, { useState } from 'react';
import { Globe, Lock, Send } from 'lucide-react';
import { submitTicketReply } from '@/app/actions/ticketActions';

interface ReplyBoxProps {
  ticketId: string;
}

export const ReplyBox = ({ ticketId }: ReplyBoxProps) => {
  const [isInternal, setIsInternal] = useState(true);
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    // 0.5.2: Call Server Action to save message
    const res = await submitTicketReply(parseInt(ticketId, 10), text, isInternal ? 'INTERNAL' : 'PUBLIC');
    
    if (res?.success) {
      setText('');
    } else {
      console.error('Failed to submit reply:', res?.error);
    }
  };

  const macros = [
    { label: "PW Reset", text: "Vielen Dank für Ihre Geduld. Wir haben Ihr Passwort zurückgesetzt. Sie sollten eine E-Mail mit den neuen Zugangsdaten erhalten haben." },
    { label: "Hardware", text: "Ihre Hardware wurde bestellt. Die voraussichtliche Lieferzeit beträgt 3-5 Werktage." },
    { label: "Info fehlt", text: "Könnten Sie uns bitte weitere Informationen oder einen Screenshot zu diesem Problem zukommen lassen?" },
    { label: "Termin", text: "Wir haben einen Termin für den Einsatz vor Ort vereinbart. Bitte prüfen Sie die Einladung in Ihrem Kalender." }
  ];

  const handleApplyMacro = (macroText: string) => {
    setText(macroText);
    // If applying a macro for the customer, switch to public reply automatically
    if (!macroText.includes("INTERNAL:")) {
      setIsInternal(false);
    }
  };

  return (
    <div className="p-4 bg-white/80 dark:bg-[#1a1f24]/80 backdrop-blur-md border-t border-surface-container dark:border-white/5 shrink-0">
      <div className="flex flex-col gap-3">
        {/* Quick Macros */}
        <div className="flex flex-wrap gap-2 mb-1">
          {macros.map((macro, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyMacro(macro.text)}
              className="px-3 py-1.5 rounded-lg border border-surface-container dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white transition-all active:scale-95"
            >
              {macro.label}
            </button>
          ))}
        </div>

        {/* Status Toggle - Tabbed Interface */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/20 p-1 rounded-xl w-fit border border-slate-200 dark:border-white/5">
          <button
            type="button"
            onClick={() => setIsInternal(false)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${
              !isInternal 
                ? 'bg-white dark:bg-[#12181b] text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5 border-b-2 border-slate-900 dark:border-white' 
                : 'text-slate-500 hover:text-slate-700 dark:text-on-surface-variant dark:hover:text-on-surface'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>PUBLIC REPLY</span>
          </button>
          <button
            type="button"
            onClick={() => setIsInternal(true)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${
              isInternal 
                ? 'bg-[#fff9c4] dark:bg-tertiary/20 text-[#f9a825] dark:text-tertiary shadow-sm ring-1 ring-[#fbc02d]/20 dark:ring-tertiary/20 border-b-2 border-[#fbc02d] dark:border-tertiary' 
                : 'text-slate-500 hover:text-slate-700 dark:text-on-surface-variant dark:hover:text-on-surface'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>INTERNAL NOTE</span>
          </button>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className={`flex items-end gap-2 border rounded-2xl p-2 transition-all duration-200 ${
          isInternal 
            ? 'border-[#fff59d] bg-[#fffde7]/30 dark:border-tertiary/20 dark:bg-tertiary/5 focus-within:border-[#fbc02d] dark:focus-within:border-tertiary focus-within:ring-4 focus-within:ring-[#fbc02d]/10' 
            : 'border-surface-container-high dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 focus-within:border-slate-900 dark:focus-within:border-white focus-within:ring-4 focus-within:ring-slate-900/5 dark:focus-within:ring-white/5'
        }`}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isInternal ? "Add a private note for the team..." : "Send a public message to the customer..."}
            className="flex-1 min-h-[44px] max-h-[300px] resize-none bg-transparent border-none focus:outline-none text-sm text-on-background dark:text-white px-3 py-3 font-medium placeholder:text-on-surface-variant/50"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className={`shrink-0 p-3 rounded-xl transition-all active:scale-95 flex items-center justify-center ${
              !text.trim()
                ? 'opacity-30 cursor-not-allowed bg-surface-container-high text-on-surface-variant dark:bg-white/5'
                : isInternal
                  ? 'bg-[#fbc02d] dark:bg-tertiary/20 text-white dark:text-tertiary hover:shadow-lg hover:shadow-[#fbc02d]/20'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:shadow-lg hover:shadow-slate-900/20'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
