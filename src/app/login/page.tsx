"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { VelaLogo } from '@/components/ui/VelaLogo';

function LoginContent() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [delivery, setDelivery] = useState<'email' | 'copy' | 'none'>('none');
  const [magicLinkUrl, setMagicLinkUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [staffBootstrapEnabled, setStaffBootstrapEnabled] = useState(true);
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  useEffect(() => {
    fetch('/api/system/init-status')
      .then((res) => res.json())
      .then((payload: { data?: { staffBootstrapEnabled?: boolean } }) => {
        if (typeof payload.data?.staffBootstrapEnabled === 'boolean') {
          setStaffBootstrapEnabled(payload.data.staffBootstrapEnabled);
        }
      })
      .catch(() => {
        // Keep the first-run default (Magic Link for staff).
      });
  }, []);

  const handleSendMagicLink = async () => {
    if (!email) return;
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/portal/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json() as {
        success?: boolean;
        error?: string;
        data?: { message?: string; delivery?: 'email' | 'copy' | 'none'; magicLinkUrl?: string | null };
      };

      if (data.success) {
        setDelivery(data.data?.delivery ?? 'none');
        setMagicLinkUrl(data.data?.magicLinkUrl ?? null);
        setCopied(false);
        setStatus('sent');
      } else {
        setErrorMessage(data.error || 'Failed to issue a magic link.');
        setStatus('error');
      }
    } catch {
      setErrorMessage('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000e23] text-white p-6 antialiased">
      <div className="w-full max-w-md flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-6">
          <div className="h-16 w-16 overflow-hidden rounded-xl shadow-lg shadow-primary-fixed/20">
            <VelaLogo variant="icon" className="h-full w-full" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-headline text-4xl font-bold tracking-tight">VelaDesk</h1>
            <p className="text-xs font-bold uppercase tracking-widest leading-loose text-white/40">Service Management</p>
          </div>
        </div>

        {/* Error Banner (shown when redirected from verify with error) */}
        {urlError && (
          <div className="w-full flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm font-medium text-red-400">
              {urlError === 'session_expired' ? 'Your session has expired. Please sign in again.'
                : urlError === 'missing_token' ? 'Invalid login link. Please request a new one.'
                  : decodeURIComponent(urlError)}
            </p>
          </div>
        )}

        {/* Login Form Card */}
        <div className="w-full bg-white/[0.03] backdrop-blur-3xl border border-white/5 p-10 rounded-[40px] shadow-2xl flex flex-col gap-10 min-h-[440px] justify-center transition-all duration-500">

          {status === 'sent' ? (
            <div className="flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  {delivery === 'email' ? 'Check your email' : 'Sign-in link'}
                </h2>
                <p className="text-white/40 text-sm font-medium leading-relaxed">
                  {delivery === 'email' ? (
                    <>
                      A sign-in link was emailed to <span className="text-white font-bold">{email}</span>.
                    </>
                  ) : delivery === 'copy' && magicLinkUrl ? (
                    <>
                      No mailbox is configured. Nothing was emailed to{' '}
                      <span className="text-white font-bold">{email}</span>. Copy the link below.
                    </>
                  ) : (
                    <>
                      If an account exists for <span className="text-white font-bold">{email}</span>,
                      a sign-in link can be issued. Nothing was emailed.
                    </>
                  )}
                </p>
                {delivery === 'copy' && magicLinkUrl ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <input
                      readOnly
                      value={magicLinkUrl}
                      className="w-full h-12 bg-white/[0.05] border border-white/10 text-[11px] font-mono rounded-xl px-3 text-white/80"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(magicLinkUrl);
                        setCopied(true);
                      }}
                      className="h-10 rounded-xl bg-white text-[10px] font-bold uppercase tracking-widest text-[#000e23]"
                    >
                      {copied ? 'Copied' : 'Copy sign-in link'}
                    </button>
                  </div>
                ) : null}
              </div>
              <button
                onClick={() => setStatus('idle')}
                className="text-xs font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors mt-4 py-2"
              >
                ← Back to login
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
                <p className="text-white/40 text-sm font-medium">
                  {staffBootstrapEnabled
                    ? 'Enter your email to receive a secure magic link. Staff can sign in here until Microsoft Entra is connected.'
                    : 'Enter your email to receive a secure magic link.'}
                </p>
              </div>

              {/* Inline error message from API */}
              {(status === 'error' && errorMessage) && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 -mt-4">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs font-medium text-red-400">{errorMessage}</p>
                </div>
              )}

              <div className="flex flex-col gap-6">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@company.com"
                    className="w-full h-16 bg-white/[0.05] border border-white/5 text-sm font-bold rounded-2xl pl-14 pr-6 focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-white/10 placeholder:text-white/10 transition-all"
                  />
                </div>

                <button
                  onClick={handleSendMagicLink}
                  disabled={status === 'loading' || !email}
                  className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-white text-xs font-bold uppercase tracking-widest text-[#000e23] shadow-xl transition-all hover:scale-[1.02] hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Send Magic Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-white/20">
            <div className="h-px flex-1 bg-white/5"></div>
            <span className="text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">Secure Login</span>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-col items-center gap-2 opacity-20 hover:opacity-100 transition-opacity duration-500">
          <p className="text-[10px] uppercase font-bold tracking-widest">© 2026 VelaDesk</p>
        </div>
      </div>
    </div>
  );
}

// 2. Die neue exportierte Hauptkomponente mit dem Suspense-Wrapper
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#000e23]">
          <Loader2 className="w-8 h-8 animate-spin text-white/20" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}