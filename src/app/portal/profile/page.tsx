'use client';

import React from 'react';
import { User, Mail, Shield, Monitor, Smartphone, Laptop, Trash2, ArrowRight } from 'lucide-react';

export default function ProfilePage() {
  // Mock Data
  const user = {
    name: "John Doe",
    email: "john.doe@VelaDesk.io",
    role: "Customer",
    department: "IT Infrastructure",
    since: "January 2024"
  };

  const assets = [
    { id: "AST-4421", name: "MacBook Pro 16\"", serial: "C02F...G0L", type: "Laptop", status: "Active", date: "2024-01-15" },
    { id: "AST-4458", name: "Dell U2723QE 4K Monitor", serial: "CN-0G...Z8", type: "Monitor", status: "Active", date: "2024-01-15" },
    { id: "AST-4502", name: "iPhone 15 Pro", serial: "MTP...XJ", type: "Smartphone", status: "In Repair", date: "2024-03-10" }
  ];

  return (
    <div className="space-y-12 pb-24">
      {/* Header Section */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl font-black tracking-tighter text-on-background dark:text-white mb-2 uppercase">
          User Profile
        </h1>
        <p className="text-on-surface-variant/60 font-medium">Manage your personal settings and registered workspace assets.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Profile Card & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-8 bg-white dark:bg-white/5 rounded-[32px] border border-surface-container dark:border-white/5 shadow-xl dark:shadow-none animate-in fade-in zoom-in-95 duration-700 delay-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center mb-6 shadow-2xl overflow-hidden ring-8 ring-slate-100 dark:ring-white/5">
                <User className="w-10 h-10 text-white dark:text-slate-900" />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-1">{user.name}</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f9a825] dark:text-tertiary px-3 py-1 bg-[#fff9c4] dark:bg-tertiary/10 rounded-full mb-6">
                {user.role}
              </span>
              
              <div className="w-full space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-bold uppercase tracking-tighter opacity-40">Department</span>
                  <span className="font-bold">{user.department}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-bold uppercase tracking-tighter opacity-40">Member since</span>
                  <span className="font-bold">{user.since}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-surface-container-high dark:bg-white/5 rounded-[32px] border border-surface-container-high dark:border-white/5 animate-in fade-in zoom-in-95 duration-700 delay-200">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 opacity-40">Account Security</h3>
            <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-slate-900 dark:hover:border-white transition-all group">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 opacity-40 group-hover:text-primary transition-colors" />
                <span className="text-sm font-bold tracking-tight">Change Password</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-all" />
            </button>
          </div>
        </div>

        {/* Form & Assets */}
        <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
          <div className="p-8 md:p-12 bg-white dark:bg-white/5 rounded-[40px] border border-surface-container dark:border-white/5 shadow-2xl dark:shadow-none">
            <h3 className="text-lg font-black tracking-tight mb-12 flex items-center gap-3 underline decoration-primary/20 decoration-8 underline-offset-4">
              General Information
            </h3>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 block ml-1">Full Display Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant opacity-20 group-focus-within:opacity-100 transition-opacity" />
                    <input 
                      type="text" 
                      defaultValue={user.name}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-12 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-white/5 focus:border-slate-900 dark:focus:border-white transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 block ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant opacity-20 group-focus-within:opacity-100 transition-opacity" />
                    <input 
                      type="email" 
                      defaultValue={user.email}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-12 py-4 text-sm font-bold opacity-50 cursor-not-allowed"
                      contentEditable={false}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-2xl">
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          <div className="p-8 md:p-12 bg-white dark:bg-white/5 rounded-[40px] border border-surface-container dark:border-white/5 shadow-2xl dark:shadow-none">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-3 underline decoration-tertiary/20 decoration-8 underline-offset-4">
                My Assets
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">{assets.length} items registered</span>
            </div>

            <div className="space-y-4">
              {assets.map((asset) => (
                <div key={asset.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/10 group-hover:scale-110 transition-transform">
                      {asset.type === 'Laptop' && <Laptop className="w-6 h-6 text-on-surface-variant" />}
                      {asset.type === 'Monitor' && <Monitor className="w-6 h-6 text-on-surface-variant" />}
                      {asset.type === 'Smartphone' && <Smartphone className="w-6 h-6 text-on-surface-variant" />}
                    </div>
                    <div>
                      <h4 className="font-black text-sm mb-1">{asset.name}</h4>
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-tighter opacity-40">
                        <span>{asset.id}</span>
                        <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                        <span>S/N: {asset.serial}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-6">
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${asset.status === 'In Repair' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {asset.status}
                      </span>
                      <span className="text-[10px] font-bold opacity-30">Assigned: {asset.date}</span>
                    </div>
                    <button className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200" title="Report Issue">
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
