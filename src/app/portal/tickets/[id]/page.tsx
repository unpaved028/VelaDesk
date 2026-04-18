import React from 'react';
import { ArrowLeft, Clock, MessageSquare, Send, User, Bot, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { TicketStatusStepper, TicketStatus } from '@/components/portal/TicketStatusStepper';
import { prisma } from '@/lib/db/prisma';
import { getPortalSession } from '@/lib/services/getPortalSession';
import { redirect } from 'next/navigation';

export default async function CustomerTicketPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const { authenticated, session } = await getPortalSession();
  
  if (!authenticated || !session) {
    redirect('/portal/login');
  }

  // Real Ticket Data Enforcement (DLP)
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: parseInt(id, 10),
      tenantId: session.tenantId,
      requesterId: session.email,
    },
    include: {
      workspace: {
        select: { name: true }
      },
      messages: {
        where: {
          isInternal: false, // Strict filter: only customer-visible messages
        },
        orderBy: {
          createdAt: 'asc',
        },
      }
    }
  });

  if (!ticket) {
    // Return a 404 or not found state
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold mb-2">Ticket nicht gefunden</h2>
        <p className="text-slate-500">Das angefragte Ticket existiert nicht oder Sie haben keine Berechtigung.</p>
        <Link href="/portal" className="mt-6 text-primary hover:underline">Zurück zur Übersicht</Link>
      </div>
    );
  }

  const formattedTicket = {
    id: ticket.id.toString(),
    subject: ticket.subject,
    status: ticket.status as TicketStatus,
    createdAt: new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(ticket.createdAt),
    workspace: ticket.workspace.name,
    messages: ticket.messages.map((m: any) => ({
      id: m.id,
      author: m.authorId === session.email ? 'Ich' : 'Support',
      type: m.authorId === session.email ? 'customer' : 'agent',
      body: m.body,
      time: new Intl.DateTimeFormat('de-DE', { timeStyle: 'short' }).format(m.createdAt)
    }))
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-700">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <Link href="/portal" className="group flex items-center gap-3 text-on-surface-variant/60 hover:text-slate-900 dark:hover:text-white transition-all">
            <div className="w-8 h-8 rounded-full border border-surface-container dark:border-white/10 flex items-center justify-center group-hover:bg-slate-100 dark:group-hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase">Zurück zur Übersicht</span>
          </Link>
          
          <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-full text-[10px] font-bold tracking-widest uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure Thread
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-400 dark:text-white/20 tracking-widest uppercase">Ticket #TK-{id.padStart(4, '0')}</span>
              <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10"></span>
              <span className="text-[11px] font-bold text-slate-400 dark:text-white/20 tracking-widest uppercase">{formattedTicket.workspace}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-background dark:text-white leading-[1.1]">{formattedTicket.subject}</h1>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-2 text-xs font-medium text-slate-500 dark:text-white/40">
             <div className="flex items-center gap-2">
               <Clock className="w-3.5 h-3.5" />
               <span>Erstellt am {formattedTicket.createdAt}</span>
             </div>
             <div className="flex items-center gap-2">
               <MessageSquare className="w-3.5 h-3.5" />
               <span>{formattedTicket.messages.length} Nachrichten</span>
             </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline (v0.8.5) */}
      <div className="bg-white/50 dark:bg-[#12181b] border border-surface-container dark:border-white/5 rounded-[40px] p-6 shadow-sm">
        <TicketStatusStepper status={formattedTicket.status} />
      </div>

      {/* Conversation Thread */}
      <div className="flex flex-col gap-8 mt-4">
        {formattedTicket.messages.map((message) => (
          <div key={message.id} className={`flex gap-5 w-full ${message.type === 'agent' ? '' : 'flex-row-reverse'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform hover:scale-105 ${
              message.type === 'agent' 
                ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/20'
            }`}>
              {message.type === 'agent' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>

            <div className={`flex flex-col gap-2 max-w-[80%] ${message.type === 'agent' ? 'items-start' : 'items-end'}`}>
              <div className={`p-7 rounded-[2.5rem] text-[15px] leading-relaxed shadow-sm ${
                message.type === 'agent' 
                  ? 'bg-white dark:bg-[#1a1f24] text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-white/5' 
                  : 'bg-slate-900 dark:bg-primary/20 text-white dark:text-white rounded-tr-none border border-primary/10'
              }`}>
                <div className="whitespace-pre-wrap">{message.body}</div>
              </div>
              <div className="px-4 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-white/20">
                <span>{message.author}</span>
                <span>•</span>
                <span>{message.time} Uhr</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Reply Area */}
      <div className="mt-12 group">
        <div className="relative p-1 bg-gradient-to-b from-slate-200 to-transparent dark:from-white/10 dark:to-transparent rounded-[42px] transition-all focus-within:from-slate-400 dark:focus-within:from-white/30">
          <div className="bg-white dark:bg-[#12181b] rounded-[40px] p-10 flex flex-col gap-8 shadow-2xl dark:shadow-none">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-background dark:text-white">Nachricht schreiben</h2>
              <div className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                Secure Channel
              </div>
            </div>
            
            <div className="relative">
              <textarea 
                placeholder="Schreiben Sie hier Ihr Update..."
                className="w-full h-40 bg-slate-50 dark:bg-[#0b0f10] border-none rounded-3xl p-6 text-[15px] focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-white/10 transition-all resize-none shadow-sm"
              ></textarea>
            </div>

            <div className="flex items-center justify-between">
               <p className="text-[11px] text-slate-400 dark:text-white/20 font-medium whitespace-nowrap overflow-hidden text-ellipsis mr-4">Anhänge können demnächst hinzugefügt werden.</p>
               <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-[20px] text-sm font-bold transition-all hover:bg-slate-800 dark:hover:bg-slate-100 hover:shadow-xl hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap">
                <Send className="w-4 h-4" />
                <span>ANTWORT SENDEN</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
