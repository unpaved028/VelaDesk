'use client';

import React, { useState } from 'react';
import { 
  Laptop, 
  Key, 
  Smartphone, 
  Monitor, 
  ShieldCheck, 
  Wifi, 
  Zap, 
  FileText,
  Search,
  ArrowRight
} from 'lucide-react';

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
  color: string;
}

const services: ServiceItem[] = [
  {
    id: 'nb-1',
    title: 'Neues Notebook',
    description: 'Bestellung eines Standard-Laptops für neue Mitarbeiter oder als Ersatzgerät.',
    icon: Laptop,
    category: 'Hardware',
    color: 'bg-blue-500'
  },
  {
    id: 'sw-1',
    title: 'Software-Lizenz',
    description: 'Beantragen Sie Lizenzen für Adobe Creative Cloud, JetBrains oder Office 365.',
    icon: Key,
    category: 'Software',
    color: 'bg-purple-500'
  },
  {
    id: 'ph-1',
    title: 'Diensthandy',
    description: 'Neues iPhone oder Android-Gerät inklusive Mobilfunkvertrag anfordern.',
    icon: Smartphone,
    category: 'Hardware',
    color: 'bg-green-500'
  },
  {
    id: 'acc-1',
    title: 'VPN Zugang',
    description: 'Einrichtung oder Fehlerbehebung für Ihren Remote-Zugriff auf das Firmennetz.',
    icon: Wifi,
    category: 'Zugriff',
    color: 'bg-amber-500'
  },
  {
    id: 'hw-2',
    title: 'Monitor & Peripherie',
    description: 'Zusätzliche Monitore, Dockingstations, Tastaturen oder Mäuse bestellen.',
    icon: Monitor,
    category: 'Hardware',
    color: 'bg-indigo-500'
  },
  {
    id: 'sec-1',
    title: 'Sicherheits-Audit',
    description: 'Überprüfung von Berechtigungen oder Meldung verdächtiger Aktivitäten.',
    icon: ShieldCheck,
    category: 'Security',
    color: 'bg-rose-500'
  }
];

export default function RequestCatalogPage() {
  const [search, setSearch] = useState('');

  const filteredServices = services.filter(service => 
    service.title.toLowerCase().includes(search.toLowerCase()) ||
    service.description.toLowerCase().includes(search.toLowerCase()) ||
    service.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Search & Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-white/20 tracking-widest uppercase mb-1">
            <Zap className="w-3 h-3 fill-current" />
            <span>ITIL Service Catalog</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-background dark:text-white leading-[1.1]">
            Was benötigen Sie heute?
          </h1>
          <p className="text-slate-500 dark:text-white/40 max-w-xl text-lg font-medium leading-relaxed">
            Wählen Sie eine Dienstleistung aus unserem Katalog aus oder nutzen Sie die Suche, um schneller ans Ziel zu kommen.
          </p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Katalog durchsuchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-surface-container dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Grid Layout */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div 
              key={service.id}
              className="group relative flex flex-col bg-white dark:bg-[#12181b] border border-surface-container dark:border-white/5 rounded-[32px] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl ${service.color} bg-opacity-10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <service.icon className={`w-7 h-7 text-white dark:text-on-surface`} />
                {/* Fallback colors for light mode since we use text-white on generic bg-opacity-10 */}
                <style jsx>{`
                  div :global(svg) {
                    color: ${service.color.replace('bg-', '')};
                  }
                  .dark div :global(svg) {
                    color: inherit;
                  }
                `}</style>
              </div>

              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/20 mb-2 block">
                  {service.category}
                </span>
                <h3 className="text-xl font-bold text-on-background dark:text-white mb-3 tracking-tight group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-white/40 leading-relaxed font-medium">
                  {service.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-primary dark:text-primary-active group-hover:underline underline-offset-4 cursor-pointer flex items-center gap-2">
                  Antrag erstellen
                  <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold mb-2">Keine Treffer</h3>
          <p className="text-slate-500 dark:text-white/40">Versuchen Sie es mit einem anderen Suchbegriff.</p>
        </div>
      )}

      {/* Quick Actions Footer */}
      <div className="bg-slate-900 dark:bg-white rounded-[40px] p-8 md:p-12 mt-10 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col gap-2">
          <h2 className="text-white dark:text-[#0b0f10] text-3xl font-extrabold tracking-tight">Nicht gefunden?</h2>
          <p className="text-white/60 dark:text-[#0b0f10]/60 font-medium">Öffnen Sie ein allgemeines Ticket für Ihr Anliegen.</p>
        </div>
        <button className="relative z-10 bg-white dark:bg-[#0b0f10] text-slate-900 dark:text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl active:scale-95">
          Support kontaktieren
        </button>
      </div>
    </div>
  );
}
