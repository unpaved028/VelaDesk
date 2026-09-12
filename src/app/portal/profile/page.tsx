import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getPortalSession } from '@/lib/services/getPortalSession';
import { LetterAvatar } from '@/components/ui/LetterAvatar';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const { authenticated, session } = await getPortalSession();
  if (!authenticated || !session) redirect('/login');

  const displayName = session.name || session.email;
  const roleLabel = session.isCustomerAdmin ? 'Customer Admin' : 'Customer';
  const assets = session.userId
    ? await prisma.asset.findMany({
        where: { tenantId: session.tenantId, assignedToId: session.userId },
        orderBy: { name: 'asc' },
      })
    : [];

  return (
    <div className="space-y-10 pb-16">
      <PortalPageHeader
        title="Profil"
        description="Angemeldete Portal-Session. Es gibt kein Passwort — Anmeldung läuft über Magic Link."
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className="rounded-[32px] border border-surface-container bg-white p-8 dark:border-white/5 dark:bg-white/5">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6">
              <LetterAvatar name={displayName} size={96} />
            </div>
            <h2 className="mb-1 text-2xl font-black tracking-tight">{displayName}</h2>
            <p className="mb-6 text-sm text-on-surface-variant">{session.email}</p>
            <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-[32px] border border-surface-container bg-white p-8 dark:border-white/5 dark:bg-white/5">
            <h3 className="mb-4 text-lg font-black tracking-tight">My Assets</h3>
            {assets.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No assets are assigned to this account.</p>
            ) : (
              <ul className="space-y-3">
                {assets.map((asset) => (
                  <li
                    key={asset.id}
                    className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5"
                  >
                    <p className="text-sm font-bold">{asset.name}</p>
                    <p className="mt-1 text-[11px] text-on-surface-variant">
                      {asset.type}
                      {asset.serialNumber ? ` · SN ${asset.serialNumber}` : ''}
                      {` · ${asset.status}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {session.isCustomerAdmin ? (
              <p className="mt-6 text-sm">
                <Link href="/portal/assets" className="font-bold text-primary underline-offset-4 hover:underline">
                  All tenant assets
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
