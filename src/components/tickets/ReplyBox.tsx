'use client';

import React, { useState } from 'react';
import { submitTicketReply } from '@/app/actions/ticketActions';

interface ReplyBoxProps {
  ticketId: number;
}

// 0.5.2: Polished Aero-Luxe Reply Box
// Based on SOP 03.4.C Design Standard
export const ReplyBox = ({ ticketId }: ReplyBoxProps) => {
  const [isInternal, setIsInternal] = useState(false);
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    // Save message via Server Action
    const res = await submitTicketReply(ticketId, text, isInternal ? 'INTERNAL' : 'PUBLIC');
    
    if (res?.success) {
      setText('');
    } else {
      console.error('Failed to submit reply:', res?.error);
    }
  };

  const macros = [
    { label: "PW Reset", text: "Vielen Dank für Ihre Geduld. Wir haben Ihr Passwort zurückgesetzt." },
    { label: "Hardware", text: "Ihre Hardware wurde bestellt. Lieferzeit 3-5 Werktage." },
    { label: "Check Status", text: "Gibt es neue Informationen zu Ihrem Anliegen?" }
  ];

  return (
    <div className="p-6 bg-surface border-t border-outline-variant/15 shrink-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
      {/* 1. Macro Quick Actions */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {macros.map((macro, idx) => (
          <button
            key={idx}
            onClick={() => setText(macro.text)}
            className="whitespace-nowrap px-4 py-1.5 rounded-full border border-outline-variant/15 text-[10px] font-bold uppercase tracking-widest text-outline hover:bg-surface-container-high hover:border-primary-fixed/30 hover:text-primary transition-all bg-surface-container-lowest/50"
          >
            {macro.label}
          </button>
        ))}
      </div>

      {/* 2. Main Compose Area */}
      <div className={`bg-surface-container-highest/50 backdrop-blur-sm rounded-2xl p-2 transition-all duration-500 border-2 ${
        isInternal 
          ? 'focus-within:bg-secondary-container/5 focus-within:border-secondary shadow-[0_0_30px_rgba(27,54,86,0.1)] border-transparent' 
          : 'focus-within:bg-surface-container-lowest focus-within:border-primary-fixed shadow-[0_0_30px_rgba(0,251,251,0.1)] border-transparent'
      }`}>
        
        {/* Toggle Controls (Premium Segmented Style) */}
        <div className="flex items-center p-1 bg-surface-container-low rounded-xl w-fit mb-3 border border-outline-variant/10 shadow-inner">
          <button 
            type="button"
            onClick={() => setIsInternal(false)}
            className={`flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.1em] px-4 py-1.5 rounded-lg transition-all duration-300 relative ${
              !isInternal 
                ? 'bg-primary-fixed text-on-primary-fixed shadow-md shadow-primary-fixed/20 scale-[1.02]' 
                : 'text-outline hover:text-on-surface hover:bg-surface-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
            Public Reply
          </button>
          <button 
            type="button"
            onClick={() => setIsInternal(true)}
            className={`flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.1em] px-4 py-1.5 rounded-lg transition-all duration-300 relative ${
              isInternal 
                ? 'bg-secondary text-white shadow-md shadow-secondary/20 scale-[1.02]' 
                : 'text-outline hover:text-on-surface hover:bg-surface-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">visibility_off</span>
            Internal Note
          </button>
        </div>

        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
          className="w-full bg-transparent border-none resize-none text-sm text-on-surface focus:ring-0 placeholder:text-outline/40 p-3 outline-none min-h-[120px] font-body leading-relaxed custom-scrollbar" 
          placeholder={isInternal ? "Internal notes are only visible to agents..." : "Type your message to the customer..."} 
          rows={3} 
        />

        <div className="flex justify-between items-center mt-1 px-2 pb-2">
          {/* Action Tools */}
          <div className="flex items-center gap-0.5">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container-high hover:text-primary transition-all">
              <span className="material-symbols-outlined text-[18px]">attach_file</span>
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container-high hover:text-primary transition-all">
              <span className="material-symbols-outlined text-[18px]">emoji_emotions</span>
            </button>
            <div className="w-px h-3 bg-outline-variant/20 mx-1"></div>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container-high hover:text-on-surface transition-all">
              <span className="material-symbols-outlined text-[18px]">format_bold</span>
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container-high hover:text-on-surface transition-all">
              <span className="material-symbols-outlined text-[18px]">format_italic</span>
            </button>
          </div>

          {/* Send Action */}
          <div className="flex items-center gap-3">
             <span className="text-[9px] font-bold text-outline/40 uppercase tracking-tighter hidden sm:inline">
               ⌘ + Enter to send
             </span>
            <button 
              onClick={handleSubmit}
              disabled={!text.trim()}
              className={`px-5 py-2 rounded-xl transition-all font-black text-xs flex items-center gap-2 group relative overflow-hidden ${
                !text.trim() 
                  ? 'bg-surface-container-high text-outline/30 cursor-not-allowed opacity-50' 
                  : isInternal 
                    ? 'bg-secondary text-white shadow-lg shadow-secondary/20 hover:shadow-secondary/40 hover:-translate-y-0.5 active:translate-y-0' 
                    : 'bg-primary-fixed text-on-primary-fixed shadow-lg shadow-primary-fixed/20 hover:shadow-primary-fixed/40 hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                {isInternal ? 'push_pin' : 'send'}
              </span>
              {isInternal ? 'Post Note' : 'Send'}
              
              {text.trim() && (
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
