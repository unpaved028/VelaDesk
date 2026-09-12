'use client';

import { useEffect, useState } from 'react';
import { getAssets, linkAssetToTicket, unlinkAssetFromTicket } from '@/app/actions/assetActions';
import type { ContextPanelAsset } from './ContextPanel';

interface AssetOption {
  id: string;
  name: string;
  type: string;
  serialNumber: string | null;
}

export const TicketAssetLinker = ({
  ticketId,
  linkedAssets,
}: {
  ticketId: number;
  linkedAssets: ContextPanelAsset[];
}) => {
  const [available, setAvailable] = useState<AssetOption[]>([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    getAssets().then((result) => {
      if (!result.success || !result.data) return;
      const linkedIds = new Set(linkedAssets.map((asset) => asset.id));
      setAvailable(
        result.data
          .filter((asset) => !linkedIds.has(asset.id))
          .map((asset) => ({
            id: asset.id,
            name: asset.name,
            type: asset.type,
            serialNumber: asset.serialNumber,
          }))
      );
    });
  }, [linkedAssets]);

  return (
    <div className="p-6">
      <h3 className="mb-6 text-[10px] font-bold uppercase tracking-widest text-outline">Linked Assets</h3>

      {linkedAssets.length === 0 ? (
        <p className="mb-4 text-xs text-on-surface-variant">No assets linked to this ticket.</p>
      ) : (
        <div className="mb-4 space-y-3">
          {linkedAssets.map((asset) => (
            <div key={asset.id} className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4">
              <p className="truncate text-xs font-bold text-on-surface">{asset.name}</p>
              <p className="mt-0.5 text-[10px] text-outline">
                {asset.type}
                {asset.serialNumber ? ` · SN: ${asset.serialNumber}` : ''}
              </p>
              <button
                type="button"
                className="mt-2 text-[10px] font-bold uppercase tracking-widest text-red-600"
                onClick={() => unlinkAssetFromTicket(ticketId, asset.id)}
              >
                Unlink
              </button>
            </div>
          ))}
        </div>
      )}

      {available.length > 0 ? (
        <div className="flex gap-2">
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-2 py-2 text-xs"
          >
            <option value="">Link an asset…</option>
            {available.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedId}
            className="rounded-lg bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white disabled:opacity-40"
            onClick={async () => {
              if (!selectedId) return;
              await linkAssetToTicket(ticketId, selectedId);
              setSelectedId('');
            }}
          >
            Link
          </button>
        </div>
      ) : (
        <p className="text-[10px] text-on-surface-variant">Create assets under Admin → Assets to link them here.</p>
      )}
    </div>
  );
};
