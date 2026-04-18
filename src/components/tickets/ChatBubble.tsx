import React from 'react';

interface ChatBubbleProps {
  body: string;
  variant: 'customer' | 'agent' | 'internal';
  authorName?: string;
  timestamp?: string;
}

export const ChatBubble = ({ body, variant, authorName, timestamp }: ChatBubbleProps) => {
  const isRightAligned = variant !== 'customer';

  // Base bubble styles
  const baseBubbleStyle = "p-5 rounded-2xl text-sm max-w-2xl";
  
  // Variant specific styles
  const variantStyles = {
    customer: "bg-surface-container-low dark:bg-surface-container-high/20 rounded-tl-none text-on-background dark:text-on-surface/90",
    agent: "bg-tertiary-container dark:bg-primary/30 rounded-tr-none text-on-tertiary-container dark:text-on-surface/90",
    internal: "bg-[#fff9c4] dark:bg-tertiary/10 border border-[#fbc02d]/20 dark:border-tertiary/20 rounded-tr-none text-on-background dark:text-tertiary-fixed-dim/90 italic"
  };

  return (
    <div className={`flex gap-4 w-full ${isRightAligned ? 'ml-auto flex-row-reverse' : ''}`}>
      <div className={`${baseBubbleStyle} ${variantStyles[variant]}`}>
        {(authorName || timestamp) && (
          <div className="flex items-center gap-2 mb-1 opacity-60 text-[10px] uppercase font-bold tracking-wider">
            {authorName && <span>{authorName}</span>}
            {authorName && timestamp && <span>•</span>}
            {timestamp && <span>{timestamp}</span>}
          </div>
        )}
        <div className="whitespace-pre-wrap">{body}</div>
      </div>
    </div>
  );
};
