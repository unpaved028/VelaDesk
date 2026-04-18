import React from 'react';
import { Check } from 'lucide-react';

/**
 * Valid Ticket Statuses from Prisma:
 * NEW, OPEN, PENDING, RESOLVED, CLOSED
 */
export type TicketStatus = 'NEW' | 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';

interface TicketStatusStepperProps {
  status: TicketStatus;
}

/**
 * TicketStatusStepper visualization for the customer portal.
 * Maps technical TicketStatus values to a 3-step customer-friendly timeline.
 */
export const TicketStatusStepper = ({ status }: TicketStatusStepperProps) => {
  const steps = [
    { id: 'step1', label: 'Ticket eröffnet', description: 'Wir haben Ihre Anfrage erhalten' },
    { id: 'step2', label: 'In Bearbeitung', description: 'Ein Agent arbeitet an Ihrer Lösung' },
    { id: 'step3', label: 'Wartet auf Sie', description: 'Wir benötigen weitere Informationen' },
  ];

  // Logic to determine current index (0-based)
  // Step 1: NEW
  // Step 2: OPEN, RESOLVED, CLOSED
  // Step 3: PENDING
  const getCurrentStepIndex = () => {
    switch (status) {
      case 'NEW':
        return 0;
      case 'OPEN':
        return 1;
      case 'PENDING':
        return 2;
      case 'RESOLVED':
      case 'CLOSED':
        return 3; // Beyond the 3 steps (Completed state)
      default:
        return 0;
    }
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="w-full py-12 px-4 sm:px-0">
      <div className="flex justify-between items-start relative max-w-3xl mx-auto">
        {/* Background Track */}
        <div className="absolute top-[18px] left-0 w-full h-[2px] bg-slate-200 dark:bg-white/5 -z-10 rounded-full"></div>
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-[18px] left-0 h-[2px] bg-slate-900 dark:bg-primary transition-all duration-1000 ease-out -z-10 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
          style={{ width: `${Math.min((currentIndex / (steps.length - 1)) * 100, 100)}%` }}
        ></div>

        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-4 text-center group">
              {/* Circle Indicator */}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                isCompleted 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                  : isActive 
                    ? 'bg-white dark:bg-[#1a1f24] border-slate-900 dark:border-primary text-slate-900 dark:text-primary shadow-xl scale-110' 
                    : 'bg-white dark:bg-[#0b0f10] border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/20'
              }`}>
                {isCompleted ? (
                  <Check className="w-5 h-5 animate-in zoom-in duration-300" />
                ) : (
                  <span className="text-xs font-bold leading-none">{index + 1}</span>
                )}
              </div>

              {/* Label & Description */}
              <div className="flex flex-col gap-1.5 px-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                  isActive || isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-white/20'
                }`}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="text-[10px] font-medium leading-tight text-slate-500 dark:text-white/40 max-w-[120px] animate-in fade-in slide-in-from-top-1 duration-500">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
