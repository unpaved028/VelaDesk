import React, { useState, useEffect } from 'react';
import { Shield, Network, Globe, Lock, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { saveCloudflareToken, getCloudflareTokenStatus } from '@/lib/actions/networkActions';

export const NetworkSecurityForm = () => {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('connected');

  useEffect(() => {
    async function fetchStatus() {
      setStatus('checking');
      const res = await getCloudflareTokenStatus();
      if (res.success && res.data) {
        setStatus(res.data.status as 'connected' | 'disconnected');
      } else {
        setStatus('disconnected');
      }
    }
    fetchStatus();
  }, []);

  const handleSaveAndConnect = async () => {
    setStatus('checking');
    const res = await saveCloudflareToken(token);
    if (res.success) {
      setStatus('connected');
    } else {
      setStatus('disconnected');
      alert('Error saving token: ' + res.error);
    }
  };

  return (
    <div className="bg-white dark:bg-white/5 rounded-[40px] border border-surface-container dark:border-white/5 p-8 md:p-12 shadow-2xl dark:shadow-none overflow-hidden relative group">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Shield className="w-32 h-32 text-primary" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-lg font-black tracking-tight mb-2 flex items-center gap-3 underline decoration-primary/20 decoration-8 underline-offset-4 leading-none">
              Network & Security
            </h3>
            <p className="text-[10px] font-medium text-on-surface-variant/40 uppercase tracking-[0.2em]">
              Manage edge connectivity and tunneling
            </p>
          </div>

          <div className="flex items-center gap-4 bg-surface-container-low dark:bg-black/20 p-2 pr-6 rounded-2xl border border-surface-container dark:border-white/5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              status === 'connected' ? 'bg-emerald-500/20 text-emerald-500' : 
              status === 'checking' ? 'bg-amber-500/20 text-amber-500' : 'bg-error-container/20 text-error'
            }`}>
              {status === 'connected' ? <Globe className="w-5 h-5 animate-pulse" /> : 
               status === 'checking' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[8px] font-black uppercase tracking-widest opacity-40">Tunnel Status</div>
              <div className={`text-xs font-bold ${
                status === 'connected' ? 'text-emerald-500' : 
                status === 'checking' ? 'text-amber-500' : 'text-error'
              }`}>
                {status === 'connected' ? 'CONNECTED' : 
                 status === 'checking' ? 'VERIFYING...' : 'DISCONNECTED'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Cloudflare Tunnel Setup */}
          <div className="space-y-8">
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-3xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-background dark:text-white mb-1">Cloudflare Zero Trust</h4>
                <p className="text-[10px] text-on-surface-variant/60 leading-relaxed font-medium">
                  Use Cloudflare Tunnel to expose VelaDesk to the internet without opening firewall ports.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 opacity-60">
                    Tunnel Token
                  </label>
                  <button 
                    onClick={() => setShowToken(!showToken)}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    {showToken ? 'Hide Secret' : 'View Secret'}
                  </button>
                </div>
                <div className="relative group/input">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 opacity-20 group-focus-within/input:opacity-100 group-focus-within/input:text-primary transition-all">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="eyJhIjoi..."
                    className="w-full bg-surface-container-low dark:bg-white/5 border border-surface-container dark:border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-surface-bright dark:focus:bg-white/[0.08] transition-all placeholder:text-on-surface-variant/20 text-sm font-medium"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant/40 ml-1 leading-relaxed flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Sensitive data. Token is encrypted via AES-256 before storage.
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleSaveAndConnect}
                  className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  disabled={status === 'checking'}
                >
                  Save & Connect
                </button>
                <a 
                  href="https://dash.cloudflare.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-2xl bg-surface-container-low dark:bg-white/5 border border-surface-container dark:border-white/10 flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95 group/link"
                >
                  <ExternalLink className="w-5 h-5 opacity-40 group-hover/link:opacity-100 group-hover/link:text-primary transition-all" />
                </a>
              </div>
            </div>
          </div>

          {/* Security Features Info */}
          <div className="space-y-6 lg:pl-12 lg:border-l border-surface-container dark:border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Security Posture</h4>
            <div className="space-y-4">
              <SecurityFeature 
                icon={CheckCircle2} 
                title="Strict SSL Enforcement" 
                desc="All requests are forced to HTTPS via edge-routing." 
                active={true}
              />
              <SecurityFeature 
                icon={CheckCircle2} 
                title="WAF (Web Application Firewall)" 
                desc="Automatic mitigation of common XSS and SQLi attacks." 
                active={true}
              />
              <SecurityFeature 
                icon={Lock} 
                title="Rate Limiting" 
                desc="Prevents brute-force attacks on login endpoints." 
                active={false}
              />
            </div>

            <div className="mt-8 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-2 text-amber-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Advisory</span>
              </div>
              <p className="text-[10px] text-on-surface-variant/60 leading-relaxed italic font-medium">
                "Ensure your origin firewall blocks all traffic EXCEPT from Cloudflare IPs for maximum security."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SecurityFeature = ({ icon: Icon, title, desc, active }: { icon: any, title: string, desc: string, active: boolean }) => (
  <div className="flex gap-4">
    <div className={`mt-1 ${active ? 'text-primary' : 'opacity-20'}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <div className="text-xs font-bold mb-0.5">{title}</div>
      <div className="text-[10px] text-on-surface-variant/40 leading-relaxed">{desc}</div>
    </div>
  </div>
);
