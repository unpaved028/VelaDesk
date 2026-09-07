import React from 'react';

interface VelaLogoProps {
  variant?: 'horizontal' | 'stacked' | 'icon' | 'avatar';
  className?: string;
  size?: number | 'small' | 'large';
  /** From the VelaDesk brand identity sheet in `.agents/UI Example`. */
  tone?: 'auto' | 'light' | 'dark';
}

type MarkTone = 'light' | 'dark';

/**
 * Official mark: geometric V + cyan sail-arrow (brand sheet items 1–4).
 * Not a complete V with a blob on top — that hides the letter at 40px.
 * Dark tile: navy + white V + cyan arrow. Cyan tile (4A): white mark on #00FFFF.
 */
function BrandMark({
  letter,
  arrow,
  background,
  rounded = 'square',
}: {
  letter: string;
  arrow: string;
  background?: string;
  rounded?: 'square' | 'circle' | 'none';
}) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {background && rounded === 'circle' ? (
        <circle cx="50" cy="50" r="50" fill={background} />
      ) : null}
      {background && rounded === 'square' ? (
        <rect width="100" height="100" rx="22" fill={background} />
      ) : null}

      {/* Sail-arrow behind the left stem */}
      <path
        d="M16 60 C 26 80, 54 72, 70 38 L 82 46 L 76 20 L 56 28 L 64 36 C 52 58, 32 62, 22 50 Z"
        fill={arrow}
      />

      {/* Geometric V — stays fully visible */}
      <path d="M29 20 L47 82 H53 L71 20 H61.5 L50 68 L38.5 20 Z" fill={letter} />

      {/* Arrowhead in front of the right stem */}
      <path d="M64 36 L56 28 L76 20 L82 46 L70 38 Z" fill={arrow} />
    </svg>
  );
}

function framedColors(tone: MarkTone) {
  if (tone === 'dark') {
    // Brand sheet dark app icon / primary on navy: white V, cyan arrow
    return { background: '#000e23', letter: '#ffffff', arrow: '#00FFFF' };
  }
  // 4A — white mark on cyan
  return { background: '#00FFFF', letter: '#ffffff', arrow: '#ffffff' };
}

function wordmarkColors(tone: MarkTone) {
  if (tone === 'dark') {
    return { letter: '#ffffff', arrow: '#00FFFF' };
  }
  // Reverse — navy V, cyan arrow
  return { letter: '#000e23', arrow: '#00FFFF' };
}

function ThemedFrame({
  tone = 'auto',
  rounded = 'square',
}: {
  tone?: VelaLogoProps['tone'];
  rounded?: 'square' | 'circle';
}) {
  if (tone === 'light' || tone === 'dark') {
    return <BrandMark {...framedColors(tone)} rounded={rounded} />;
  }
  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full dark:hidden">
        <BrandMark {...framedColors('light')} rounded={rounded} />
      </div>
      <div className="hidden h-full w-full dark:block">
        <BrandMark {...framedColors('dark')} rounded={rounded} />
      </div>
    </div>
  );
}

function ThemedWordmarkMark({ tone = 'auto' }: { tone?: VelaLogoProps['tone'] }) {
  if (tone === 'light' || tone === 'dark') {
    return <BrandMark {...wordmarkColors(tone)} rounded="none" />;
  }
  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full dark:hidden">
        <BrandMark {...wordmarkColors('light')} rounded="none" />
      </div>
      <div className="hidden h-full w-full dark:block">
        <BrandMark {...wordmarkColors('dark')} rounded="none" />
      </div>
    </div>
  );
}

function iconPixels(size?: VelaLogoProps['size']): number {
  if (size === 'small') return 28;
  if (size === 'large') return 40;
  if (typeof size === 'number') return size;
  return 32;
}

export const VelaLogo = ({ variant = 'horizontal', className = '', size, tone = 'auto' }: VelaLogoProps) => {
  if (variant === 'icon') {
    const px = typeof size === 'number' ? size : undefined;
    return (
      <div className={className} style={px ? { width: px, height: px } : undefined}>
        <ThemedFrame tone={tone} />
      </div>
    );
  }

  if (variant === 'avatar') {
    const px = typeof size === 'number' ? size : 40;
    return (
      <div className={className} style={{ width: px, height: px }}>
        <ThemedFrame tone={tone} rounded="circle" />
      </div>
    );
  }

  if (variant === 'stacked') {
    const textClass = tone === 'dark' ? 'text-white' : 'text-on-surface';
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <VelaLogo variant="icon" size={size === 'large' ? 80 : 64} tone={tone} />
        <span className={`font-headline text-3xl font-bold tracking-tight ${textClass}`}>VelaDesk</span>
      </div>
    );
  }

  const iconSize = iconPixels(size);
  const textClass = size === 'small' ? 'text-base' : size === 'large' ? 'text-2xl' : 'text-xl';
  const wordClass = tone === 'dark' ? 'text-white' : 'text-on-surface';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div style={{ width: iconSize, height: iconSize }} className="shrink-0">
        <ThemedWordmarkMark tone={tone} />
      </div>
      <span className={`font-headline font-bold tracking-tight ${textClass} ${tone === 'auto' ? 'text-on-surface' : wordClass}`}>
        VelaDesk
      </span>
    </div>
  );
};
