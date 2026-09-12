'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAsset } from '@/app/actions/assetActions';

export const AssetCreateForm = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState('Laptop');
  const [status, setStatus] = useState('In Use');
  const [serialNumber, setSerialNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await createAsset({
      name,
      type,
      status,
      serialNumber: serialNumber.trim() || null,
    });
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setName('');
    setSerialNumber('');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 grid gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6 md:grid-cols-5">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Asset name"
        className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm md:col-span-2"
      />
      <select
        value={type}
        onChange={(event) => setType(event.target.value)}
        className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
      >
        <option>Laptop</option>
        <option>Desktop</option>
        <option>Monitor</option>
        <option>Phone</option>
        <option>Network</option>
        <option>Other</option>
      </select>
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
      >
        <option>In Use</option>
        <option>Spare</option>
        <option>Repair</option>
        <option>Retired</option>
      </select>
      <div className="flex gap-2">
        <input
          value={serialNumber}
          onChange={(event) => setSerialNumber(event.target.value)}
          placeholder="Serial"
          className="min-w-0 flex-1 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error ? <p className="text-sm text-red-600 md:col-span-5">{error}</p> : null}
    </form>
  );
};
