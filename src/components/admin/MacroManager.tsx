'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMacro, deleteMacro } from '@/lib/actions/macroActions';

interface MacroRow {
  id: string;
  title: string;
  body: string;
}

export const MacroManager = ({ initialMacros }: { initialMacros: MacroRow[] }) => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await createMacro({ title, body });
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setTitle('');
    setBody('');
    router.refresh();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">New macro</h2>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Reply text"
          rows={5}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Save macro
        </button>
      </form>

      <div className="space-y-3">
        {initialMacros.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No macros yet. Saved replies appear in the ticket reply box.</p>
        ) : (
          initialMacros.map((macro) => (
            <div key={macro.id} className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
              <div className="mb-2 flex items-start justify-between gap-4">
                <h3 className="text-sm font-bold text-on-surface">{macro.title}</h3>
                <button
                  type="button"
                  className="text-xs font-bold text-red-600"
                  onClick={async () => {
                    await deleteMacro(macro.id);
                    router.refresh();
                  }}
                >
                  Delete
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-on-surface-variant">{macro.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
