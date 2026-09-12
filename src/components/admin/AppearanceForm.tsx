'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateAppearance } from '@/lib/actions/appearanceActions';
import type { CustomerLocale } from '@/lib/services/tenantFacing';

export const AppearanceForm = ({
  name,
  brandName,
  locale,
}: {
  name: string;
  brandName: string;
  locale: CustomerLocale;
}) => {
  const router = useRouter();
  const [brand, setBrand] = useState(brandName);
  const [customerLocale, setCustomerLocale] = useState<CustomerLocale>(locale);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await updateAppearance({ brandName: brand, locale: customerLocale });
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-10 space-y-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6">
      <h2 className="font-headline text-lg font-bold text-on-surface">Customer-facing identity</h2>
      <p className="text-sm text-on-surface-variant">
        Shown in the portal and outbound mail for this tenant. Empty brand name uses the organization name ({name}).
      </p>
      <input
        value={brand}
        onChange={(event) => setBrand(event.target.value)}
        placeholder={name}
        className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
      />
      <select
        value={customerLocale}
        onChange={(event) => setCustomerLocale(event.target.value === 'en' ? 'en' : 'de')}
        className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
      >
        <option value="de">German (customer portal and mail)</option>
        <option value="en">English (customer portal and mail)</option>
      </select>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Save appearance
      </button>
    </form>
  );
};
