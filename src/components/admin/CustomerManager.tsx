'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createCustomer, type CustomerRow } from '@/lib/actions/customerActions';

export const CustomerManager = ({ initialCustomers }: { initialCustomers: CustomerRow[] }) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await createCustomer({ name, email, company });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setName('');
    setEmail('');
    setCompany('');
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="grid gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6 md:grid-cols-4">
        <input
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          placeholder="Company"
          className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
        />
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Contact name"
          className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@firma.de"
          className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
        />
        <button type="submit" className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white">
          Add contact
        </button>
        {error ? <p className="text-sm text-red-600 md:col-span-4">{error}</p> : null}
      </form>

      {initialCustomers.length === 0 ? (
        <p className="text-sm text-on-surface-variant">
          No contacts yet. Inbound mail creates a contact automatically.
        </p>
      ) : (
        <div className="space-y-3">
          {initialCustomers.map((customer) => (
            <div key={customer.id} className="rounded-2xl border border-outline-variant/15 bg-surface-container-low">
              <button
                type="button"
                className="flex w-full items-center justify-between px-6 py-4 text-left"
                onClick={() => setOpenId(openId === customer.id ? null : customer.id)}
              >
                <div>
                  <p className="text-sm font-bold text-on-surface">{customer.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {customer.company || '—'} · {customer.email}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {customer.tickets.length} ticket{customer.tickets.length === 1 ? '' : 's'}
                </span>
              </button>
              {openId === customer.id ? (
                <div className="space-y-2 border-t border-outline-variant/10 px-6 py-4">
                  {customer.tickets.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">No tickets for this contact.</p>
                  ) : (
                    customer.tickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/tickets/${ticket.id}`}
                        className="block text-sm font-medium text-primary hover:underline"
                      >
                        INC-{ticket.id.toString().padStart(4, '0')} · {ticket.subject} · {ticket.status}
                      </Link>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
