import React from 'react';

interface VelaLogoProps {
  variant?: 'horizontal' | 'stacked' | 'icon' | 'avatar';
  className?: string;
  size?: number | string;
}

/**
 * VelaLogo Component
 * Implements the official branding assets for VelaDesk.
 * 
 * Variants:
 * - horizontal: Primary logo for light/dark headers
 * - stacked: Prominent centered logo (e.g. login screen)
 * - icon: Cyan icon for sidebar/minimal use
 * - avatar: Circular brand mark for automated messages
 */
export const VelaLogo = ({ variant = 'horizontal', className = '', size }: VelaLogoProps) => {
  const getStyle = () => {
    if (!size) return {};
    return { width: size, height: typeof size === 'number' ? size : 'auto' };
  };

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={getStyle()}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" rx="24" fill="#00ffff" />
        <path
          d="M30 70L50 30L70 70H60L50 50L40 70H30Z"
          fill="#00142b"
        />
      </svg>
    );
  }

  if (variant === 'avatar') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={getStyle()}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="50" fill="#00ffff" />
        <path
          d="M35 65L50 35L65 65H58L50 48L42 65H35Z"
          fill="#00142b"
        />
      </svg>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`} style={getStyle()}>
        <VelaLogo variant="icon" size={80} />
        <span className="font-headline font-bold text-3xl tracking-tight text-on-surface">VelaDesk</span>
      </div>
    );
  }

  // Default: Horizontal
  return (
    <div className={`flex items-center gap-2.5 ${className}`} style={getStyle()}>
      <VelaLogo variant="icon" size={32} />
      <span className="font-headline font-bold text-xl tracking-tight text-on-surface">VelaDesk</span>
    </div>
  );
};
