import Link from 'next/link';

interface PortalNavProps {
  isCustomerAdmin: boolean;
}

export const PortalNav = ({ isCustomerAdmin }: PortalNavProps) => {
  return (
    <nav className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-widest">
      <Link href="/portal" className="text-on-surface-variant hover:text-primary transition-colors">
        Meine Tickets
      </Link>
      {isCustomerAdmin ? (
        <>
          <Link href="/portal/company" className="text-on-surface-variant hover:text-primary transition-colors">
            Alle Firmen-Tickets
          </Link>
          <Link href="/portal/assets" className="text-on-surface-variant hover:text-primary transition-colors">
            Asset Übersicht
          </Link>
        </>
      ) : null}
    </nav>
  );
};
