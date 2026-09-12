import { VelaLogo } from '@/components/ui/VelaLogo';

export const TenantBrandMark = ({
  hasLogo,
  variant = 'horizontal',
  className,
}: {
  hasLogo: boolean;
  variant?: 'horizontal' | 'icon';
  className?: string;
}) => {
  if (hasLogo) {
    return (
      // Session-scoped image — tenantId comes from the cookie, not the URL.
      <img
        src="/api/branding/logo"
        alt=""
        className={className || (variant === 'icon' ? 'h-10 w-10 rounded-xl object-contain' : 'h-8 w-auto max-w-[160px] object-contain')}
      />
    );
  }
  return <VelaLogo variant={variant} className={className} />;
};
