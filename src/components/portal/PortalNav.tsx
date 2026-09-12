import Link from 'next/link';
import type { PortalCopy } from '@/lib/i18n/customerFacing';

interface PortalNavProps {
  isCustomerAdmin: boolean;
  copy: PortalCopy;
}

export const PortalNav = ({ isCustomerAdmin, copy }: PortalNavProps) => {
  return (
    <nav className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-widest">
      <Link href="/portal" className="text-on-surface-variant hover:text-primary transition-colors">
        {copy.navTickets}
      </Link>
      <Link href="/portal/catalog" className="text-on-surface-variant hover:text-primary transition-colors">
        {copy.navCatalog}
      </Link>
      {isCustomerAdmin ? (
        <>
          <Link href="/portal/company" className="text-on-surface-variant hover:text-primary transition-colors">
            {copy.navCompany}
          </Link>
          <Link href="/portal/assets" className="text-on-surface-variant hover:text-primary transition-colors">
            {copy.navAssets}
          </Link>
        </>
      ) : null}
    </nav>
  );
};
