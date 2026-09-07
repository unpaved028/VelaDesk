interface LetterAvatarProps {
  name?: string;
  size?: number;
  className?: string;
}

export const LetterAvatar = ({ name, size = 40, className = '' }: LetterAvatarProps) => {
  const letter = (name?.trim() || '?').charAt(0).toUpperCase();

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-highest font-headline font-bold text-on-surface ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden
    >
      {letter}
    </div>
  );
};
