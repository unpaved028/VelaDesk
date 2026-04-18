"use client";

import React, { useState } from 'react';
import { 
  Laptop, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Smartphone, 
  Monitor, 
  Server,
  ShieldCheck,
  Clock,
  Box
} from 'lucide-react';

/**
 * MOCK_ASSETS: Dummy data for the UI-only phase.
 * In a production scenario, these would be fetched via a Server Action or API
 * with a strict tenantId filter.
 */
const MOCK_ASSETS = [
  { id: 'AS-001', name: 'MacBook Pro 14"', type: 'Laptop', serial: 'Z0X1Y2W3V4', user: 'Max Mustermann', status: 'In Use', warranty: 'Active' },
  { id: 'AS-002', name: 'iPhone 15 Pro', type: 'Mobile', serial: 'IPH-9921-22', user: 'Erika Muster', status: 'In Use', warranty: 'Active' },
  { id: 'AS-003', name: 'Dell UltraSharp 27', type: 'Monitor', serial: 'DELL-8821-X', user: 'Office A-12', status: 'Spare', warranty: 'Expired' },
  { id: 'AS-004', name: 'Lenovo ThinkPad X1', type: 'Laptop', serial: 'LEN-TT-992', user: 'Unassigned', status: 'Repair', warranty: 'Active' },
  { id: 'AS-005', name: 'Cisco Meraki MX67', type: 'Network', serial: 'CSCO-MX-123', user: 'Server Room', status: 'In Use', warranty: 'Active' },
];

export default function AssetInventoryPage() {
  const [search, setSearch] = useState('');

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'laptop': return <Laptop className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'monitor': return <Monitor className="w-4 h-4" />;
      case 'network': return <Server className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-surface dark:bg-[#0b0f10]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-background dark:text-white">
            Asset Inventory
          </h1>
          <p className="text-on-surface-variant dark:text-white/50 text-sm mt-1">
            Verwalte und tracke die Hardware deines Unternehmens.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="w-4 h-4" />
          <span>New Asset</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Assets', value: '124', icon: Box, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'In Use', value: '98', icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Under Repair', value: '4', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Expired Warranty', value: '12', icon: Clock, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-2xl w-fit mb-4 ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-widest leading-none">{stat.label}</p>
            <p className="text-3xl font-black text-on-background dark:text-white mt-2 font-mono tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 dark:text-white/20 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" />
          <input 
            type="text" 
            placeholder="Search assets, serials, or users..."
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-white/5 transition-all text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-[0.2em]">Asset Details</th>
                <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-[0.2em]">Identifier</th>
                <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-[0.2em]">Owner</th>
                <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-[0.2em]">Live Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-[0.2em]">Warranty</th>
                <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-[0.2em] w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {MOCK_ASSETS.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        {getIcon(asset.type)}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-bold text-on-background dark:text-white leading-tight">{asset.name}</p>
                        <p className="text-[10px] text-on-surface-variant dark:text-white/30 font-bold tracking-widest uppercase">{asset.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-bold text-on-surface-variant dark:text-white/60 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded w-fit">{asset.serial}</span>
                      <span className="text-[9px] font-bold text-on-surface-variant/30 uppercase tracking-tighter">ID: {asset.id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" />
                       <span className="text-xs font-bold text-on-background dark:text-white/80">{asset.user}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest inline-flex items-center gap-2 uppercase ${
                      asset.status === 'In Use' ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500' :
                      asset.status === 'Spare' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500' :
                      'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        asset.status === 'Spare' ? 'bg-blue-500' : 
                        asset.status === 'Repair' ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                      {asset.status}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${asset.warranty === 'Active' ? 'text-green-500/60' : 'text-red-500/60'}`} />
                      <span className={`text-[10px] font-black tracking-widest uppercase ${asset.warranty === 'Active' ? 'text-green-600 dark:text-green-500/80' : 'text-red-500/80'}`}>
                        {asset.warranty}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-5 h-5 text-on-surface-variant dark:text-white/40" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex justify-between items-center px-4">
        <p className="text-[10px] font-bold text-on-surface-variant/40 dark:text-white/20 uppercase tracking-[0.3em]">
          Showing 5 of 124 Assets
        </p>
        <div className="flex gap-2">
           <button className="px-4 py-2 border border-slate-200 dark:border-white/5 rounded-xl text-[10px] font-bold uppercase opacity-50 cursor-not-allowed">Prev</button>
           <button className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-[10px] font-bold uppercase">Next</button>
        </div>
      </div>
    </div>
  );
}
