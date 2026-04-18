"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Key, 
  Mail, 
  AppWindow, 
  ArrowRight,
  ArrowLeft,
  Info,
  Globe,
  Fingerprint,
  Lock,
  Loader2,
  RefreshCw,
  PartyPopper,
  Zap,
  Terminal,
  Settings,
  Copy,
  ChevronDown,
  ChevronUp,
  Monitor,
  Check
} from 'lucide-react';
import Link from 'next/link';

type SetupType = 'auto' | 'manual' | null;

/**
 * Hybrid M365 Mailbox Wizard (Task 0.14.2)
 * Bietet dem Administrator die Wahl zwischen automatischer PowerShell-Provisionierung
 * und manuellem Azure Portal Setup.
 */
export default function HybridMailboxWizard() {
  const [setupType, setSetupType] = useState<SetupType>(null);
  
  return (
    <div className="flex-1 bg-surface dark:bg-[#0b0f10] p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/40 dark:text-on-surface/20 flex gap-2">
           <Link href="/admin/mailboxes" className="hover:text-primary transition-colors">Mailboxes</Link>
           <span>/</span>
           <span className="text-primary">New Hybrid Setup</span>
        </div>

        <div className="mb-12">
          <h1 className="text-3xl font-bold text-on-background dark:text-white mb-2 tracking-tight">Postfach-Onboarding</h1>
          <p className="text-on-surface-variant dark:text-on-surface/60">
            Wählen Sie den gewünschten Pfad für die Anbindung Ihres Microsoft 365 Postfachs.
          </p>
        </div>

        {/* Path Selection Screen */}
        {!setupType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SelectionCard 
              title="Automatisierter Speed-Launch"
              description="Erstellt die App-Registrierung vollautomatisch via PowerShell. Empfohlen für MSPs."
              icon={Terminal}
              color="text-primary"
              label="Am schnellsten"
              onClick={() => setSetupType('auto')}
            />
            <SelectionCard 
              title="Manuelle Konfiguration"
              description="Für Admins, die jede Berechtigung im Azure Portal händisch validieren möchten."
              icon={Settings}
              color="text-amber-500"
              onClick={() => setSetupType('manual')}
            />
          </div>
        )}

        {/* Automated Flow (Option A) */}
        {setupType === 'auto' && (
          <AutomatedFlow onBack={() => setSetupType(null)} />
        )}

        {/* Manual Flow (Option B / Accordion Style) */}
        {setupType === 'manual' && (
          <ManualFlow onBack={() => setSetupType(null)} />
        )}

        {/* Help Footer */}
        {!setupType && (
           <div className="mt-12 p-6 border border-dashed border-surface-container dark:border-white/10 rounded-[24px] flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-surface-container dark:bg-white/5 flex items-center justify-center">
                 <ShieldCheck className="w-6 h-6 text-on-surface-variant/40" />
              </div>
              <p className="text-xs text-on-surface-variant dark:text-on-surface/30 font-medium leading-relaxed max-w-lg">
                 Sicherheitshinweis: VelaDesk nutzt ausschließlich die Microsoft Graph API. Wir speichern keine Passwörter, sondern nur verschlüsselte OAuth-Credentials mit App-Only Permissions.
              </p>
           </div>
        )}

      </div>
    </div>
  );
}

/**
 * OPTION A: AUTOMATED FLOW (PowerShell)
 */
const AutomatedFlow = ({ onBack }: { onBack: () => void }) => {
  const [copied, setCopied] = useState(false);
  const psCommand = "irm https://VelaDesk.io/setup-m365.ps1 | iex";

  const handleCopy = () => {
    navigator.clipboard.writeText(psCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
       <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-white transition-colors group">
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
             <span>Zurück zur Auswahl</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-[10px] font-black uppercase text-primary tracking-widest">
             <Zap className="w-3 h-3 fill-current" />
             Option A: Automated
          </div>
       </div>

       <div className="bg-white dark:bg-[#12181b] rounded-[32px] border border-surface-container dark:border-white/5 p-8 md:p-12 shadow-sm">
          <div className="max-w-2xl">
             <h2 className="text-2xl font-bold dark:text-white mb-4">PowerShell One-Liner</h2>
             <p className="text-on-surface-variant dark:text-on-surface/50 mb-8 leading-relaxed">
                Kopieren Sie diesen Befehl und führen Sie ihn in Ihrer lokalen PowerShell aus. 
                Das Skript führt Sie durch den Login und registriert VelaDesk automatisch in Ihrem Tenant.
             </p>

             <div className="group relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-surface-container-high dark:bg-black/40 rounded-2xl p-6 font-mono text-sm dark:text-primary flex items-center justify-between border border-surface-container dark:border-white/5 shadow-inner">
                   <span className="truncate mr-4">{psCommand}</span>
                   <button 
                     onClick={handleCopy}
                     className="shrink-0 p-3 bg-white dark:bg-white/5 rounded-xl border border-surface-container dark:border-white/10 hover:border-primary transition-all active:scale-90"
                   >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                   </button>
                </div>
             </div>

             <div className="mt-12 flex items-center gap-6 p-6 bg-surface-container-low dark:bg-white/[0.02] rounded-2xl border border-surface-container dark:border-white/5">
                <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <div>
                   <h4 className="text-sm font-bold dark:text-white">Warte auf Verbindung...</h4>
                   <p className="text-xs text-on-surface-variant dark:text-on-surface/40">Sobald das Skript fertig ist, wird diese Seite automatisch aktualisiert.</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

/**
 * OPTION B: MANUAL FLOW (Accordion Style)
 */
const ManualFlow = ({ onBack }: { onBack: () => void }) => {
  const [openSection, setOpenSection] = useState<'guide' | 'form'>('guide');
  const [formData, setFormData] = useState({ mailbox: '', tenant: '', client: '', secret: '' });
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<{
    inboxDisplayName?: string;
    totalItemCount?: number;
    unreadItemCount?: number;
    errorCode?: string;
    errorMessage?: string;
  } | null>(null);

  const handleTest = async () => {
    setTestState('testing');
    setTestResult(null);

    try {
      // Dynamic import to keep the action server-only bundle clean
      const { testM365Connection } = await import('@/lib/actions/mailboxTestAction');
      const result = await testM365Connection({
        mailboxAddress: formData.mailbox,
        msTenantId: formData.tenant,
        clientId: formData.client,
        clientSecret: formData.secret,
      });

      if (result.success) {
        setTestState('success');
        setTestResult({
          inboxDisplayName: result.inboxDisplayName,
          totalItemCount: result.totalItemCount,
          unreadItemCount: result.unreadItemCount,
        });
      } else {
        setTestState('error');
        setTestResult({
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
        });
      }
    } catch (err: unknown) {
      setTestState('error');
      setTestResult({
        errorCode: 'NETWORK_ERROR',
        errorMessage: err instanceof Error ? err.message : 'Unbekannter Fehler',
      });
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
       <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-white transition-colors group">
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
             <span>Zurück zur Auswahl</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-full text-[10px] font-black uppercase text-amber-500 tracking-widest">
             <Monitor className="w-3 h-3" />
             Option B: Manual
          </div>
       </div>

       {/* Accordion 1: Guide */}
       <div className={`overflow-hidden transition-all duration-300 bg-white dark:bg-[#12181b] rounded-[24px] border ${openSection === 'guide' ? 'border-primary/30' : 'border-surface-container dark:border-white/5'}`}>
          <button 
            onClick={() => setOpenSection(openSection === 'guide' ? 'form' : 'guide')}
            className="w-full p-6 flex items-center justify-between text-left"
          >
             <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${openSection === 'guide' ? 'bg-primary/10 text-primary' : 'bg-surface-container dark:bg-white/5 text-on-surface-variant'}`}>
                   <Info className="w-4 h-4" />
                </div>
                <span className="font-bold dark:text-white">Schritt 1: Azure Portal Guide</span>
             </div>
             {openSection === 'guide' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 text-on-surface-variant" />}
          </button>
          
          {openSection === 'guide' && (
            <div className="p-8 pt-0 animate-in fade-in duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MiniGuideItem icon={AppWindow} text="App-Registrierung anlegen (VelaDesk-Service)" />
                  <MiniGuideItem icon={Mail} text="Graph Permission 'Mail.ReadWrite.Shared' vergeben" />
                  <MiniGuideItem icon={ShieldCheck} text="Admin-Consent für Permissions gewähren" />
                  <MiniGuideItem icon={Key} text="Client Secret generieren & Wert kopieren" />
               </div>
               <button 
                 onClick={() => setOpenSection('form')}
                 className="mt-8 w-full p-4 bg-surface-container dark:bg-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all active:scale-95"
               >
                  Verstanden - Weiter zur Eingabe
               </button>
            </div>
          )}
       </div>

       {/* Accordion 2: Form */}
       <div className={`overflow-hidden transition-all duration-300 bg-white dark:bg-[#12181b] rounded-[24px] border ${openSection === 'form' ? 'border-primary/30' : 'border-surface-container dark:border-white/5'}`}>
          <button 
            onClick={() => setOpenSection(openSection === 'form' ? 'guide' : 'form')}
            className="w-full p-6 flex items-center justify-between text-left"
          >
             <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${openSection === 'form' ? 'bg-primary/10 text-primary' : 'bg-surface-container dark:bg-white/5 text-on-surface-variant'}`}>
                   <Key className="w-4 h-4" />
                </div>
                <span className="font-bold dark:text-white">Schritt 2: Credentials eingeben</span>
             </div>
             {openSection === 'form' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 text-on-surface-variant" />}
          </button>

          {openSection === 'form' && (
            <div className="p-8 pt-0 animate-in fade-in duration-300 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input field="Shared Mailbox Address" value={formData.mailbox} placeholder="support@domain.de" onChange={(v: string) => setFormData({...formData, mailbox: v})} icon={Mail} />
                  <Input field="Tenant ID" value={formData.tenant} placeholder="Azure Directory ID" onChange={(v: string) => setFormData({...formData, tenant: v})} icon={Globe} />
                  <Input field="Client ID" value={formData.client} placeholder="App Application ID" onChange={(v: string) => setFormData({...formData, client: v})} icon={Fingerprint} />
                  <Input field="Client Secret" value={formData.secret} placeholder="Secret Value" onChange={(v: string) => setFormData({...formData, secret: v})} icon={Lock} type="password" />
               </div>
               
               {/* Connection Test Button */}
               <button 
                 onClick={handleTest}
                 disabled={testState === 'testing'}
                 className={`w-full py-5 font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                   testState === 'testing' 
                     ? 'bg-primary/60 text-on-primary cursor-wait' 
                     : testState === 'success'
                     ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20'
                     : 'bg-primary text-on-primary shadow-xl shadow-primary/20 hover:bg-primary/90'
                 }`}
               >
                 {testState === 'testing' && <Loader2 className="w-5 h-5 animate-spin" />}
                 {testState === 'success' && <CheckCircle2 className="w-5 h-5" />}
                 {testState === 'error' && <RefreshCw className="w-5 h-5" />}
                 <span>
                   {testState === 'idle' && 'Verbindung validieren'}
                   {testState === 'testing' && 'Verbindung wird getestet...'}
                   {testState === 'success' && 'Verbindung erfolgreich!'}
                   {testState === 'error' && 'Erneut versuchen'}
                 </span>
               </button>

               {/* Success Result */}
               {testState === 'success' && testResult && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                       <PartyPopper className="w-5 h-5 text-emerald-500" />
                       <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Postfach erfolgreich verbunden</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                       <div className="p-3 bg-white/50 dark:bg-white/5 rounded-xl text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">Ordner</p>
                          <p className="text-sm font-bold dark:text-white">{testResult.inboxDisplayName}</p>
                       </div>
                       <div className="p-3 bg-white/50 dark:bg-white/5 rounded-xl text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">Gesamt</p>
                          <p className="text-sm font-bold dark:text-white">{testResult.totalItemCount}</p>
                       </div>
                       <div className="p-3 bg-white/50 dark:bg-white/5 rounded-xl text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">Ungelesen</p>
                          <p className="text-sm font-bold dark:text-white">{testResult.unreadItemCount}</p>
                       </div>
                    </div>
                 </div>
               )}

               {/* Error Result */}
               {testState === 'error' && testResult && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-2">
                    <div className="flex items-center gap-3">
                       <ShieldCheck className="w-5 h-5 text-red-500" />
                       <h4 className="text-sm font-bold text-red-600 dark:text-red-400">
                         Verbindung fehlgeschlagen — {testResult.errorCode}
                       </h4>
                    </div>
                    <p className="text-xs text-on-surface-variant dark:text-on-surface/50 leading-relaxed">
                       {testResult.errorMessage}
                    </p>
                 </div>
               )}
            </div>
          )}
       </div>
    </div>
  );
}

/**
 * SUB-COMPONENTS
 */
const SelectionCard = ({ title, description, icon: Icon, color, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className="group relative flex flex-col items-start p-8 bg-white dark:bg-[#12181b] rounded-[32px] border border-surface-container dark:border-white/5 hover:border-primary transition-all text-left shadow-sm hover:shadow-2xl hover:shadow-primary/5 active:scale-95"
  >
     {label && (
       <div className="absolute top-6 right-8 px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black uppercase text-primary tracking-widest">
         {label}
       </div>
     )}
     <div className={`w-14 h-14 rounded-2xl bg-surface-container dark:bg-white/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors ${color}`}>
        <Icon className="w-7 h-7" />
     </div>
     <h3 className="text-xl font-bold dark:text-white mb-3 group-hover:text-primary transition-colors">{title}</h3>
     <p className="text-sm text-on-surface-variant dark:text-on-surface/40 leading-relaxed">
        {description}
     </p>
     <div className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
        <span>Setup starten</span>
        <ArrowRight className="w-4 h-4" />
     </div>
  </button>
);

const MiniGuideItem = ({ icon: Icon, text }: any) => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low dark:bg-white/[0.02] border border-surface-container dark:border-white/5">
     <Icon className="w-4 h-4 text-on-surface-variant/40" />
     <span className="text-[12px] font-medium text-on-surface-variant dark:text-on-surface/60">{text}</span>
  </div>
);

const Input = ({ field, value, placeholder, icon: Icon, type = 'text', onChange }: any) => (
  <div className="space-y-2">
     <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant/50 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" />
        {field}
     </label>
     <input 
       type={type}
       value={value}
       placeholder={placeholder}
       onChange={(e) => onChange(e.target.value)}
       className="w-full bg-surface-container-low dark:bg-white/[0.03] border border-surface-container dark:border-white/5 rounded-2xl px-5 py-4 text-sm dark:text-white placeholder:text-on-surface-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
     />
  </div>
);
