import Link from 'next/link';
import { VelaLogo } from '@/components/ui/VelaLogo';

/**
 * Unauthenticated home for a public demo. Staff still use Magic Link;
 * Entra is optional and must not block first contact.
 */
export const PublicDemoLanding = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000e23] text-white p-6 antialiased">
      <div className="w-full max-w-lg flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-6">
          <div className="h-16 w-16 overflow-hidden rounded-xl shadow-lg shadow-primary-fixed/20">
            <VelaLogo variant="icon" tone="dark" className="h-full w-full" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-headline text-4xl font-bold tracking-tight">VelaDesk</h1>
            <p className="text-xs font-bold uppercase tracking-widest leading-loose text-white/40">
              Self-hosted ITSM
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-6 text-center">
          <p className="text-sm font-medium text-white/55 leading-relaxed">
            A helpdesk for small IT teams and MSPs. Runs on a Raspberry Pi.
            Sign in with a Magic Link — Microsoft Entra is optional.
          </p>
          <ul className="text-left text-sm text-white/40 font-medium flex flex-col gap-3 px-2">
            <li>Ticket queue with three sample requests after MSP seed</li>
            <li>Staff and portal login without Entra SSO</li>
            <li>Shared mailbox later, if you want outbound mail</li>
          </ul>
        </div>

        <Link
          href="/login"
          className="flex h-16 w-full items-center justify-center rounded-2xl bg-white text-xs font-bold uppercase tracking-widest text-[#000e23] shadow-xl transition-all hover:scale-[1.02] hover:bg-white/90 active:scale-95"
        >
          Sign in with Magic Link
        </Link>

        <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">© 2026 VelaDesk</p>
      </div>
    </div>
  );
};
