'use client';

import React, { useState } from 'react';
import { 
  Rocket, 
  ChevronRight, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Database, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UpdateWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = () => {
    setIsFinishing(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  const baseInputStyle = "w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

  return (
    <div className="min-h-screen bg-[#0b0f10] text-white flex flex-col items-center justify-center p-6 antialiased selection:bg-primary/30">
      
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-2xl relative">
        
        {/* Progress bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2].map((i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : 'bg-white/10'}`}
            />
          ))}
        </div>

        {/* Step 1: Changelog */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-10 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
                <Sparkles className="w-3 h-3" /> System Update v0.15.0
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent mb-4">
                What's New in This Release
              </h1>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                We've upgraded your system with new enterprise-grade features and stability improvements.
              </p>
            </header>

            <div className="grid gap-4 mb-10">
              <ChangeItem 
                icon={Database} 
                title="Automated DB Migrations" 
                description="Zero-touch database updates. Your schema is now automatically synchronized on system startup."
              />
              <ChangeItem 
                icon={ShieldCheck} 
                title="Microsoft Entra ID Login" 
                description="Enhanced security for your agents. Single Sign-On (SSO) via your organization's Microsoft account."
              />
              <ChangeItem 
                icon={Zap} 
                title="Magic Invite Links" 
                description="Onboard experts in seconds. Generate temporary links for verified organization members."
              />
            </div>

            <button 
              onClick={() => setStep(2)}
              className="w-full group py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all active:scale-[0.98]"
            >
              Continue to Configuration <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Step 2: New Configuration */}
        {step === 2 && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <header className="mb-10">
              <h2 className="text-3xl font-black text-white mb-2">Finalize New Settings</h2>
              <p className="text-gray-400 text-sm italic">New features require a bit of configuration to get started.</p>
            </header>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-10 space-y-8 backdrop-blur-xl">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-primary/20 rounded-lg">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-white mb-1">Backup Retention Policy</label>
                    <p className="text-xs text-gray-500 mb-3">How many backups should we keep in your Microsoft 365 storage?</p>
                    <select className={baseInputStyle}>
                      <option>7 Backups (Standard)</option>
                      <option>30 Backups (Business)</option>
                      <option>Unlimited (Compliance)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-tertiary/20 rounded-lg">
                    <Rocket className="w-5 h-5 text-tertiary" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-white mb-1">Automatic Minor Updates</label>
                    <p className="text-xs text-gray-500 mb-3">Should the system automatically apply non-breaking patches?</p>
                    <div className="flex gap-4">
                      <button className="flex-1 py-3 px-4 rounded-xl border-2 border-primary bg-primary/10 text-primary text-xs font-black uppercase tracking-tighter transition-all">Enable</button>
                      <button className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 text-gray-400 text-xs font-black uppercase tracking-tighter transition-all">Manual Only</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/10 flex items-center gap-3">
                 <Info className="w-4 h-4 text-primary" />
                 <p className="text-[10px] text-gray-500 italic uppercase font-medium">These settings can be changed later in the system panel.</p>
              </div>
            </div>

            <button 
              onClick={handleFinish}
              disabled={isFinishing}
              className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-2xl flex items-center justify-center gap-3 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isFinishing ? (
                <>
                  <CheckCircle2 className="w-5 h-5 animate-bounce" /> Loading Environment...
                </>
              ) : (
                <>
                  Apply & Get Started <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

const ChangeItem = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="group p-5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl transition-all cursor-default">
    <div className="flex items-start gap-4">
      <div className="p-2.5 bg-white/5 rounded-xl group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
        <Icon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);
