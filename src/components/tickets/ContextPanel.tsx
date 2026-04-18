import { User, Clock, Building2, Phone, Mail, Laptop, Smartphone, Box } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';

interface ContextPanelProps {
  ticketId?: number;
}

export const ContextPanel = async ({ ticketId }: ContextPanelProps) => {
  let requesterName = 'Alice Smith';

  if (ticketId) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });
    
    if (ticket) {
      const user = await prisma.user.findUnique({
        where: { id: ticket.requesterId }
      });
      if (user) requesterName = user.name;
    }
  }

  return (
    <aside className="w-80 bg-surface-container-high dark:bg-[#12181b] flex flex-col h-full border-l-0 overflow-y-auto custom-scrollbar shrink-0 min-h-0">
      <div className="p-4 border-b border-surface-container dark:border-white/5 bg-transparent">
        <h3 className="text-sm font-semibold text-on-background dark:text-white mb-4">Requester Details</h3>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-surface-container-low dark:bg-white/5 flex items-center justify-center">
            <User className="w-6 h-6 text-on-surface-variant dark:text-white/70" />
          </div>
          <div>
            <div className="font-medium text-on-background dark:text-white text-sm">{requesterName}</div>
            <div className="text-xs text-on-surface-variant">Stakeholder</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Mail className="w-4 h-4" />
            <a href="mailto:alice@example.com" className="hover:underline">alice@example.com</a>
          </div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Phone className="w-4 h-4" />
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Building2 className="w-4 h-4" />
            <span>Acme Corp</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-surface-container dark:border-white/5 bg-transparent mt-4">
        <h3 className="text-sm font-semibold text-on-background dark:text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          SLA Overview
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-on-surface-variant">First Response</span>
              <span className="font-medium text-green-600 dark:text-green-400">Met</span>
            </div>
            <div className="w-full bg-surface-container dark:bg-white/10 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-on-surface-variant">Resolution</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">In 4 hours</span>
            </div>
            <div className="w-full bg-surface-container dark:bg-white/10 rounded-full h-1.5">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-transparent mt-4">
        <h3 className="text-sm font-semibold text-on-background dark:text-white mb-3 flex items-center gap-2">
          <Box className="w-4 h-4" />
          Linked Assets
        </h3>
        <div className="space-y-3">
          {/* Mock Asset 1: MacBook Pro */}
          <div className="p-3 bg-surface-container-low dark:bg-white/5 rounded-xl border border-surface-container dark:border-white/5 group hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-surface-container dark:bg-white/5 rounded-lg text-on-surface-variant dark:text-white/60">
                  <Laptop className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-on-background dark:text-white leading-none">MacBook Pro 14"</div>
                  <div className="text-[10px] text-on-surface-variant dark:text-white/30 font-medium">SN: Z0X1Y2W3V4</div>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" aria-label="Warranty Active" />
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-on-surface-variant dark:text-white/40 font-bold uppercase tracking-tighter">Warranty</span>
              <span className="text-green-600 dark:text-green-400 font-black">Active · Oct 2026</span>
            </div>
          </div>

          {/* Mock Asset 2: iPhone (Expired Case) */}
          <div className="p-3 bg-surface-container-low dark:bg-white/5 rounded-xl border border-surface-container dark:border-white/5 opacity-80">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-surface-container dark:bg-white/5 rounded-lg text-on-surface-variant dark:text-white/60">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-on-background dark:text-white leading-none">iPhone 15 Pro</div>
                  <div className="text-[10px] text-on-surface-variant dark:text-white/30 font-medium">SN: IPH-9921-22</div>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-red-500" aria-label="Warranty Expired" />
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-on-surface-variant dark:text-white/40 font-bold uppercase tracking-tighter">Warranty</span>
              <span className="text-red-500/80 font-black">Expired</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 mt-auto border-t border-surface-container dark:border-white/5">
        <button className="w-full bg-surface-container-lowest dark:bg-white/5 border border-surface-container dark:border-white/10 text-on-background dark:text-white py-2 rounded-md text-sm font-medium hover:bg-surface-bright dark:hover:bg-white/10 transition-colors">
          View Customer History
        </button>
      </div>
    </aside>
  );
};
