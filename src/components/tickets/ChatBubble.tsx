import React from 'react';
import Image from 'next/image';

interface ChatBubbleProps {
  body: string;
  variant: 'customer' | 'agent' | 'internal';
  authorName?: string;
  timestamp?: string;
  avatarUrl?: string;
}

export const ChatBubble = ({ body, variant, authorName, timestamp, avatarUrl }: ChatBubbleProps) => {
  // Scenario 1: Customer/User Message (Left aligned)
  if (variant === 'customer') {
    return (
      <div className="flex space-x-4 max-w-3xl">
        <Image 
          src={avatarUrl || "/avatar-placeholder.jpg"} 
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover shrink-0 border border-outline-variant/20" 
          alt={authorName || "User"} 
        />
        <div>
          <div className="flex items-baseline space-x-2 mb-1">
            <span className="font-bold text-sm text-on-surface">{authorName || 'Customer'}</span>
            <span className="text-xs text-outline">{timestamp}</span>
          </div>
          <div className="bg-surface-container p-4 rounded-b-xl rounded-tr-xl text-sm text-on-surface leading-relaxed">
            {body}
          </div>
        </div>
      </div>
    );
  }

  // Scenario 2: System Automation / Internal Note / Agent (Refined for Aero-Luxe)
  const isInternal = variant === 'internal';
  
  return (
    <div className={`flex space-x-4 max-w-3xl ${variant === 'agent' ? 'ml-14' : 'ml-14'}`}>
      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/20">
        <span className="material-symbols-outlined text-sm text-outline">
          {variant === 'agent' ? 'person' : 'smart_toy'}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline space-x-2 mb-1">
          <span className="font-bold text-sm text-on-surface-variant">
            {authorName || (variant === 'agent' ? 'Agent' : 'System Analysis')}
          </span>
          {isInternal && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-secondary/10 text-secondary uppercase">Internal</span>
          )}
          <span className="text-xs text-outline font-normal">{timestamp}</span>
        </div>
        <div className={`p-4 rounded-b-xl rounded-tr-xl text-sm leading-relaxed ${
          isInternal 
            ? 'bg-secondary-container/20 border border-secondary/20 text-on-surface-variant' 
            : 'bg-primary-container/10 border border-primary/10 text-on-surface'
        }`}>
          {body}
        </div>
      </div>
    </div>
  );
};
