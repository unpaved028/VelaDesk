"use client";

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Globe, Mail, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

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

      const data = await res.json();

      if (data.success) {
        setStatus('sent');
      } else {
        setErrorMessage(data.error || 'Failed to send magic link.');
        setStatus('error');
      }
    } catch {
      setErrorMessage('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f10] text-white p-6 antialiased">
      <div className="w-full max-w-md flex flex-col items-center gap-12">
        {/* Branding Logo */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-2xl dark:shadow-none transition-transform hover:scale-110 duration-500">
            <Globe className="w-8 h-8 text-[#0b0f10]" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl font-bold tracking-tight">VelaDesk</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-loose">Service Management Cloud</p>
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
                <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
                <p className="text-white/40 text-sm font-medium leading-relaxed">
                  We've sent a magic link to <br/>
                  <span className="text-white font-bold">{email}</span>. 
                  Click the link in the email to sign in instantly.
                </p>
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
                <p className="text-white/40 text-sm font-medium">Enter your email to receive a secure magic link.</p>
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
                  className="w-full h-16 bg-white text-[#0b0f10] rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-white/90 hover:scale-[1.02] active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
           <p className="text-[10px] uppercase font-bold tracking-widest">© 2024 VelaDesk Computing Systems</p>
        </div>
      </div>
    </div>
  );
}
