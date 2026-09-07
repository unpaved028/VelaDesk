import React from 'react';

interface VelaLogoProps {
  variant?: 'horizontal' | 'stacked' | 'icon' | 'avatar';
  className?: string;
  size?: number | 'small' | 'large';
}

/**
 * Single VelaDesk mark (Brand Identity 4A / horizontal wordmark).
 * V + wave on cyan for chrome; same geometry as icon.svg / apple-icon.svg.
 */
function BrandMark({
  background,
  letter,
  wave,
  rounded = 'square',
}: {
  background: string;
  letter: string;
  wave: string;
  rounded?: 'square' | 'circle';
}) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {rounded === 'circle' ? (
        <circle cx="50" cy="50" r="50" fill={background} />
      ) : (
        <rect width="100" height="100" rx="24" fill={background} />
      )}
      <path d="M28 25 L45 75 L56 75 L72 25 L58 25 L49 55 L39 25 Z" fill={letter} />
      <path
        d="M20 55 C 30 75, 60 70, 75 40 L 85 45 L 80 25 L 60 30 L 68 37 C 55 58, 35 55, 25 45 Z"
        fill={wave}
      />
    </svg>
  );
}

function iconPixels(size?: VelaLogoProps['size']): number {
  if (size === 'small') return 28;
  if (size === 'large') return 40;
  if (typeof size === 'number') return size;
  return 32;
}

export const VelaLogo = ({ variant = 'horizontal', className = '', size }: VelaLogoProps) => {
  if (variant === 'icon') {
    const px = typeof size === 'number' ? size : undefined;
    return (
      <div className={className} style={px ? { width: px, height: px } : undefined}>
        <BrandMark background="#00fbff" letter="#000e23" wave="#000e23" />
      </div>
    );
  }

  if (variant === 'avatar') {
    const px = typeof size === 'number' ? size : 40;
    return (
      <div className={className} style={{ width: px, height: px }}>
        <BrandMark background="#00fbff" letter="#000e23" wave="#000e23" rounded="circle" />
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <VelaLogo variant="icon" size={size === 'large' ? 80 : 64} />
        <span className="font-headline text-3xl font-bold tracking-tight text-on-surface">VelaDesk</span>
      </div>
    );
  }

  const iconSize = iconPixels(size);
  const textClass = size === 'small' ? 'text-base' : size === 'large' ? 'text-2xl' : 'text-xl';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div style={{ width: iconSize, height: iconSize }} className="shrink-0">
        <BrandMark background="#00fbff" letter="#000e23" wave="#000e23" />
      </div>
      <span className={`font-headline font-bold tracking-tight text-on-surface ${textClass}`}>
        VelaDesk
      </span>
    </div>
  );
};
