'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { runMspBestPracticesSeed } from '@/lib/actions/seedActions';

export const MspSeedButton = () => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    const result = await runMspBestPracticesSeed();
    setBusy(false);
    if (!result.success) {
      setError(result.error || 'Seed failed.');
      return;
    }
    router.push('/admin/taxonomy');
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={handleClick}
        className="px-4 py-2 rounded-xl bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-widest disabled:opacity-50"
      >
        {busy ? 'Seeding…' : 'MSP Best Practices'}
      </button>
      {error ? <p className="text-[10px] text-error">{error}</p> : null}
    </div>
  );
};
