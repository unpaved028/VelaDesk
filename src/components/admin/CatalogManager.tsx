'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCatalogItem, deleteCatalogItem, loadStarterCatalog } from '@/lib/actions/catalogActions';
import type { CatalogRow } from '@/lib/actions/catalogActions';

export const CatalogManager = ({ initialItems }: { initialItems: CatalogRow[] }) => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await createCatalogItem({ title, description, category });
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setTitle('');
    setDescription('');
    setCategory('');
    router.refresh();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">New catalog service</h2>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
        />
        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Category"
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What the customer is requesting"
          rows={4}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Save service
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded-xl border border-outline-variant/20 px-4 py-2 text-sm font-medium text-on-surface disabled:opacity-50"
            onClick={async () => {
              setPending(true);
              setError(null);
              const result = await loadStarterCatalog();
              setPending(false);
              if (!result.success) {
                setError(result.error);
                return;
              }
              router.refresh();
            }}
          >
            Load starter catalog
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {initialItems.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            No services yet. The portal catalog stays empty until you add items or load the starter set.
          </p>
        ) : (
          initialItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.category}</p>
                  <h3 className="text-sm font-bold text-on-surface">{item.title}</h3>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-red-600"
                  onClick={async () => {
                    await deleteCatalogItem(item.id);
                    router.refresh();
                  }}
                >
                  Delete
                </button>
              </div>
              <p className="text-sm text-on-surface-variant">{item.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
