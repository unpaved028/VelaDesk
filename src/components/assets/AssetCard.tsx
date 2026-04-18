import React from 'react';
import { Laptop, Cpu, Hash, Calendar, ShieldCheck, Tag } from 'lucide-react';

interface AssetCardProps {
  name: string;
  type: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyStatus: 'active' | 'expired';
  tags: string[];
}

export const AssetCard = ({ 
  name, 
  type, 
  serialNumber, 
  purchaseDate, 
  warrantyStatus, 
  tags 
}: AssetCardProps) => {
  return (
    <div className="p-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-xl dark:hover:bg-white/10 transition-all group flex flex-col gap-6 w-full">
      {/* Asset Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            {type.toLowerCase().includes('laptop') || type.toLowerCase().includes('computer') ? (
              <Laptop className="w-6 h-6" />
            ) : (
              <Cpu className="w-6 h-6" />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base font-bold text-on-background dark:text-white leading-tight">{name}</h3>
            <span className="text-[10px] font-bold text-on-surface-variant/40 dark:text-white/40 tracking-wider uppercase">{type}</span>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm ${
          warrantyStatus === 'active' 
            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500 border border-green-200 dark:border-green-500/20' 
            : 'bg-red-100 dark:bg-error-container/20 text-red-600 dark:text-error border border-red-200 dark:border-error/20'
        }`}>
          {warrantyStatus}
        </div>
      </div>

      {/* Asset Grid Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-black/20 p-3 rounded-2xl border border-slate-200 dark:border-white/5">
          <Hash className="w-3.5 h-3.5 text-on-surface-variant/40" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-tighter">Serial No.</span>
            <span className="text-xs font-bold text-on-background dark:text-white/80">{serialNumber}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-black/20 p-3 rounded-2xl border border-slate-200 dark:border-white/5">
          <Calendar className="w-3.5 h-3.5 text-on-surface-variant/40" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-tighter">Purchase Date</span>
            <span className="text-xs font-bold text-on-background dark:text-white/80">{purchaseDate}</span>
          </div>
        </div>
      </div>

      {/* Tags section */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-container dark:border-white/5">
        {tags.map((tag) => (
          <div key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/60 rounded-full text-[10px] font-bold tracking-tight border border-slate-200 dark:border-white/10">
            <Tag className="w-2.5 h-2.5 opacity-50" />
            <span>{tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
