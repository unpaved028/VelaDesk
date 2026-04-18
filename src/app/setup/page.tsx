'use client';

import React, { useState } from 'react';
import { saveCloudflareToken } from '@/lib/actions/networkActions';
import { 
  Rocket, 
  ChevronRight, 
  ChevronLeft, 
  Globe, 
  User, 
  ShieldCheck, 
  CheckCircle2,
  Mail,
  Lock,
  Workflow,
  Zap,
  Database
} from 'lucide-react';

export default function SetupWizardPage() {
  const [step, setStep] = useState(1);
  const [cloudflareToken, setCloudflareToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const totalSteps = 5;

  const handleNextStep = async () => {
    if (step === 3 && cloudflareToken) {
      setIsSaving(true);
      await saveCloudflareToken(cloudflareToken);
      setIsSaving(false);
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
  };
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-[#0b0f10] text-white flex flex-col items-center justify-center p-6 antialiased selection:bg-primary/30">
      {/* Background Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <main className="w-full max-w-2xl z-10">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 border border-white/10 rounded-3xl mb-8 shadow-2xl">
            <Rocket className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
            Welcome to VelaDesk
          </h1>
          <p className="text-on-surface-variant/60 font-medium tracking-tight">
            Your journey to lightweight, high-performance ITIL management starts here.
          </p>
        </div>

        {/* Wizard Card */}
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden shadow-[0_24px_80px_-12px_rgba(0,0,0,0.5)]">
          {/* Progress Bar */}
          <div className="h-1 bg-white/5">
            <div 
              className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_20px_rgba(var(--primary-rgb),0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-8 md:p-12">
            {/* Step Counter */}
            <div className="flex items-center gap-2 mb-10">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    i + 1 <= step ? 'bg-primary' : 'bg-white/10'
                  }`}
                />
              ))}
              <span className="ml-4 text-[10px] font-black uppercase tracking-widest opacity-40">
                Step {step} / {totalSteps}
              </span>
            </div>

            {/* Content Area */}
            <div className="min-h-[320px] animate-in fade-in slide-in-from-right-8 duration-500">
              
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Systems Analysis</h2>
                    <p className="text-sm text-on-surface-variant/60 leading-relaxed">
                      We've analyzed your environment. Everything looks ready for detonation.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatusItem icon={ShieldCheck} label="SQLite Database" status="Ready" />
                    <StatusItem icon={Workflow} label="Node.js Runtime" status="Ready" />
                    <StatusItem icon={Globe} label="Network Access" status="Online" />
                    <StatusItem icon={Lock} label="Encryption Module" status="Active" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Global Administrator</h2>
                    <p className="text-sm text-on-surface-variant/60 leading-relaxed">
                      Create your master account. This user will have full access to all tenants.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <InputGroup label="First Name" placeholder="Admin" icon={User} />
                      <InputGroup label="Last Name" placeholder="User" />
                    </div>
                    <InputGroup label="Admin Email" placeholder="admin@domain.com" icon={Mail} />
                    <InputGroup label="Password" type="password" placeholder="••••••••" icon={Lock} />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <h2 className="text-2xl font-black tracking-tight">External Access</h2>
                       <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">Optional</span>
                    </div>
                    <p className="text-sm text-on-surface-variant/60 leading-relaxed">
                      Enable secure remote access via Cloudflare Tunnel. You can skip this and configure it later.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <InputGroup 
                      label="Cloudflare Tunnel Token" 
                      placeholder="eyJhIjoi..." 
                      icon={Shield} 
                      type="password"
                      description="Paste your Cloudflare Tunnel token to automatically link this instance."
                      value={cloudflareToken}
                      onChange={(e) => setCloudflareToken(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">General Settings</h2>
                    <p className="text-sm text-on-surface-variant/60 leading-relaxed">
                      Configure the foundation of your VelaDesk instance.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <InputGroup 
                      label="Application URL" 
                      placeholder="https://VelaDesk.yourdomain.com" 
                      icon={Globe} 
                      description="Used for external links and magic link generation."
                    />
                    <InputGroup 
                      label="System Email" 
                      placeholder="no-reply@yourdomain.com" 
                      icon={Mail}
                      description="The default sender address for system notifications."
                    />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="flex flex-col items-center py-6 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-8 ring-8 ring-emerald-500/5">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight mb-4">Configuration Ready!</h2>
                  <p className="text-sm text-on-surface-variant/60 max-w-sm mb-12 leading-relaxed">
                    Account and system settings are finalized. How would you like to begin?
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl text-left">
                    {/* Option 1: Empty Start */}
                    <button 
                      onClick={() => window.location.href = '/admin'}
                      className="group p-6 rounded-[24px] bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:bg-white/[0.08] flex flex-col items-start gap-4 active:scale-[0.98]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <Rocket className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div>
                        <div className="text-sm font-bold mb-1">Lean Start</div>
                        <div className="text-[10px] text-on-surface-variant/40 leading-relaxed font-medium">Start with a clean database. Configure everything from scratch.</div>
                      </div>
                    </button>

                    {/* Option 2: MSP Best Practices */}
                    <button 
                      onClick={() => window.location.href = '/admin?seed=true'}
                      className="group p-6 rounded-[24px] bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:bg-white/[0.08] flex flex-col items-start gap-4 active:scale-[0.98]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Zap className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                      </div>
                      <div>
                        <div className="text-sm font-bold mb-1">MSP Best Practices</div>
                        <div className="text-[10px] text-on-surface-variant/40 leading-relaxed font-medium">Pre-fill database with ITIL categories, SLAs, and standard workflows.</div>
                      </div>
                    </button>

                    {/* Option 3: Restore */}
                    <button 
                      onClick={() => alert('Disaster Recovery Wizard would start here')}
                      className="group md:col-span-2 relative p-6 rounded-[24px] bg-tertiary/10 border border-tertiary/20 hover:border-tertiary/50 transition-all hover:bg-tertiary/20 flex items-center gap-6 active:scale-[0.98] overflow-hidden"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-tertiary flex items-center justify-center shadow-lg shadow-tertiary/40 shrink-0">
                        <Database className="w-7 h-7 text-on-tertiary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-bold text-white">Restore from Backup</div>
                          <span className="px-2 py-0.5 bg-tertiary text-[8px] font-black uppercase tracking-widest rounded-full">Disaster Recovery</span>
                        </div>
                        <div className="text-[10px] text-white/50 leading-relaxed font-medium">Upload an existing VelaDesk DB or sync directly from your OneDrive vault.</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-tertiary group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Navigation Buttons */}
            {step < 4 && (
              <div className="mt-12 flex items-center justify-between">
                <button 
                  onClick={prevStep}
                  disabled={step === 1}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                    step === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-white/5'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button 
                  onClick={handleNextStep}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : (step === 3 ? "Finalize Setup" : "Next Step")}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-10 flex items-center justify-center gap-8 opacity-40">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <Lock className="w-3 h-3" />
            <span>End-to-End Encryption Enabled</span>
          </div>
          <div className="w-1 h-1 bg-white rounded-full" />
          <div className="text-[10px] font-bold uppercase tracking-widest">
            v1.0.0 Stable Build
          </div>
        </div>
      </main>
    </div>
  );
}

// Internal Helper Components
const StatusItem = ({ icon: Icon, label, status }: { icon: any, label: string, status: string }) => (
  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div>
      <div className="text-[10px] font-black uppercase tracking-tighter opacity-40 mb-0.5">{label}</div>
      <div className="text-xs font-bold text-emerald-400">{status}</div>
    </div>
  </div>
);

const InputGroup = ({ label, placeholder, icon: Icon, description, type = "text", value, onChange }: { label: string, placeholder: string, icon?: any, description?: string, type?: string, value?: string, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 opacity-60">
      {label}
    </label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-5 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 group-focus-within:text-primary transition-all">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input 
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.08] transition-all placeholder:text-white/20 text-sm font-medium ${Icon ? 'pl-14 pr-6' : 'px-6'}`}
      />
    </div>
    {description && (
      <p className="text-[10px] text-on-surface-variant/40 ml-1 leading-relaxed">
        {description}
      </p>
    )}
  </div>
);
