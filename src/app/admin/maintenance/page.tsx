'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="absolute inset-0 z-[100] bg-[#0b0f10] text-white flex flex-col items-center justify-center p-6 antialiased">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-error/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-md text-center space-y-6">
        <div className="inline-flex justify-center items-center w-20 h-20 bg-error/20 rounded-3xl mb-4">
          <ShieldAlert className="w-10 h-10 text-error" />
        </div>
        <h1 className="text-3xl font-black text-white">System Update in Progress</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          VelaDesk is currently undergoing a scheduled system update. The dashboard is temporarily locked for normal agents to ensure data integrity.
        </p>
        <p className="text-gray-500 text-xs italic">
          An administrator is currently reviewing the update. You will be automatically redirected once the update is complete. Please check back soon.
        </p>
      </div>
    </div>
  );
}
