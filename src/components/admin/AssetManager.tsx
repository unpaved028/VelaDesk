'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAsset, deleteAsset, updateAsset } from '@/app/actions/assetActions';

export interface AssetCustomerOption {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

export interface AssetRow {
  id: string;
  name: string;
  type: string;
  status: string;
  serialNumber: string | null;
  location: string | null;
  warrantyExpires: string | null;
  customerId: string | null;
  customerLabel: string;
}

const TYPES = ['Laptop', 'Desktop', 'Monitor', 'Phone', 'Network', 'Other'];
const STATUSES = ['In Use', 'Spare', 'Repair', 'Retired'];

function customerLabel(customer: AssetCustomerOption): string {
  return customer.company ? `${customer.company} · ${customer.name}` : customer.name;
}

export const AssetManager = ({
  customers,
  initialAssets,
}: {
  customers: AssetCustomerOption[];
  initialAssets: AssetRow[];
}) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <form
        className="grid gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6 md:grid-cols-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setPending(true);
          setError(null);
          const result = await createAsset({
            name: String(form.get('name') || ''),
            type: String(form.get('type') || 'Laptop'),
            status: String(form.get('status') || 'In Use'),
            serialNumber: String(form.get('serialNumber') || ''),
            location: String(form.get('location') || ''),
            customerId: String(form.get('customerId') || ''),
            warrantyExpires: String(form.get('warrantyExpires') || ''),
          });
          setPending(false);
          if (!result.success) {
            setError(result.error);
            return;
          }
          event.currentTarget.reset();
          router.refresh();
        }}
      >
        <input name="name" placeholder="Asset name" required className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm md:col-span-2" />
        <select name="type" defaultValue="Laptop" className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm">
          {TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        <select name="status" defaultValue="In Use" className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm">
          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <input name="serialNumber" placeholder="Serial" className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm" />
        <input name="location" placeholder="Site / room" className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm" />
        <select name="customerId" defaultValue="" className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm">
          <option value="">No customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customerLabel(customer)}
            </option>
          ))}
        </select>
        <input name="warrantyExpires" type="date" className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm" />
        <button type="submit" disabled={pending} className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-50">
          Add
        </button>
        {error ? <p className="text-sm text-red-600 md:col-span-4">{error}</p> : null}
      </form>

      {initialAssets.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No assets stored for this tenant yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/15 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Customer</th>
                <th className="px-4 py-4">Location</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Serial</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Warranty</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {initialAssets.map((asset) =>
                editingId === asset.id ? (
                  <AssetEditRow
                    key={asset.id}
                    asset={asset}
                    customers={customers}
                    pending={pending}
                    onCancel={() => setEditingId(null)}
                    onSave={async (payload) => {
                      setPending(true);
                      setError(null);
                      const result = await updateAsset(payload);
                      setPending(false);
                      if (!result.success) {
                        setError(result.error);
                        return;
                      }
                      setEditingId(null);
                      router.refresh();
                    }}
                  />
                ) : (
                  <tr key={asset.id}>
                    <td className="px-4 py-4 text-sm font-medium text-on-surface">{asset.name}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{asset.customerLabel || '—'}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{asset.location || '—'}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{asset.type}</td>
                    <td className="px-4 py-4 font-mono text-xs text-on-surface-variant">{asset.serialNumber || '—'}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{asset.status}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{asset.warrantyExpires || '—'}</td>
                    <td className="px-4 py-4 text-right">
                      <button type="button" className="mr-3 text-xs font-bold text-primary" onClick={() => setEditingId(asset.id)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs font-bold text-red-600"
                        onClick={async () => {
                          await deleteAsset(asset.id);
                          router.refresh();
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
          <p className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
            {initialAssets.length} asset{initialAssets.length === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  );
};

const AssetEditRow = ({
  asset,
  customers,
  pending,
  onCancel,
  onSave,
}: {
  asset: AssetRow;
  customers: AssetCustomerOption[];
  pending: boolean;
  onCancel: () => void;
  onSave: (payload: Record<string, string | null>) => Promise<void>;
}) => {
  return (
    <tr>
      <td className="px-4 py-3" colSpan={8}>
        <form
          className="grid gap-2 md:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            await onSave({
              id: asset.id,
              name: String(form.get('name') || ''),
              type: String(form.get('type') || ''),
              status: String(form.get('status') || ''),
              serialNumber: String(form.get('serialNumber') || ''),
              location: String(form.get('location') || ''),
              customerId: String(form.get('customerId') || ''),
              warrantyExpires: String(form.get('warrantyExpires') || ''),
            });
          }}
        >
          <input name="name" defaultValue={asset.name} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm md:col-span-2" />
          <select name="type" defaultValue={asset.type} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm">
            {TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <select name="status" defaultValue={asset.status} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm">
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <input name="serialNumber" defaultValue={asset.serialNumber ?? ''} placeholder="Serial" className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm" />
          <input name="location" defaultValue={asset.location ?? ''} placeholder="Site / room" className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm" />
          <select name="customerId" defaultValue={asset.customerId ?? ''} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm">
            <option value="">No customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customerLabel(customer)}
              </option>
            ))}
          </select>
          <input name="warrantyExpires" type="date" defaultValue={asset.warrantyExpires ?? ''} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm" />
          <div className="flex gap-2 md:col-span-4">
            <button type="submit" disabled={pending} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold uppercase tracking-widest text-white">
              Save
            </button>
            <button type="button" className="text-xs font-bold text-on-surface-variant" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
};
