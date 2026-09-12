'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortalTicket } from '@/app/actions/portalTicketActions';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import type { PortalCopy } from '@/lib/i18n/customerFacing';

interface CatalogService {
  id: string;
  title: string;
  description: string;
  category: string;
}

export const CatalogBrowser = ({
  items,
  copy,
}: {
  items: CatalogService[];
  copy: PortalCopy;
}) => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = items.filter((service) =>
    `${service.title} ${service.description} ${service.category}`.toLowerCase().includes(search.toLowerCase())
  );

  const openTicket = async (service: { title: string; description: string }, id: string) => {
    setPendingId(id);
    setError(null);
    const result = await createPortalTicket(service.title, service.description);
    setPendingId(null);
    if (!result.success || !result.data) {
      setError(result.error || copy.catalogError);
      return;
    }
    router.push(`/portal/tickets/${result.data.id}`);
  };

  return (
    <div className="flex flex-col gap-10">
      <PortalPageHeader
        title={copy.catalogTitle}
        description={copy.catalogDescription}
        actions={
          <input
            type="text"
            placeholder={copy.catalogSearch}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 md:w-80"
          />
        }
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {items.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{copy.catalogEmpty}</p>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => (
            <button
              key={service.id}
              type="button"
              disabled={pendingId === service.id}
              onClick={() => openTicket(service, service.id)}
              className="flex flex-col rounded-[32px] border border-surface-container bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl disabled:opacity-60 dark:border-white/5 dark:bg-surface-container"
            >
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {service.category}
              </span>
              <h3 className="mb-3 text-xl font-bold tracking-tight text-on-surface">{service.title}</h3>
              <p className="flex-1 text-sm text-on-surface-variant">{service.description}</p>
              <span className="mt-8 text-xs font-bold text-primary">
                {pendingId === service.id ? copy.catalogCreating : copy.catalogCreate}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">{copy.catalogEmpty}</p>
      )}

      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-[#000e23] p-8 md:flex-row md:items-center">
        <div>
          <h2 className="font-headline text-2xl font-bold text-white">{copy.catalogMissing}</h2>
          <p className="font-medium text-white/60">{copy.catalogGeneralBody}</p>
        </div>
        <button
          type="button"
          disabled={pendingId === 'general'}
          onClick={() => openTicket({ title: copy.catalogGeneralTitle, description: copy.catalogGeneralBody }, 'general')}
          className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#000e23]"
        >
          {copy.catalogContact}
        </button>
      </div>
    </div>
  );
};
