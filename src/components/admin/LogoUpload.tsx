'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearTenantLogo, uploadTenantLogo } from '@/lib/actions/logoActions';
import { TenantBrandMark } from '@/components/ui/TenantBrandMark';

export const LogoUpload = ({ hasLogo }: { hasLogo: boolean }) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="mb-10 space-y-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6">
      <h2 className="font-headline text-lg font-bold text-on-surface">Logo</h2>
      <p className="text-sm text-on-surface-variant">
        Shown in the customer portal. PNG, JPEG, or WebP, max 400 KB. The product mark is the default.
      </p>
      <div className="flex h-16 items-center">
        <TenantBrandMark hasLogo={hasLogo} variant="icon" />
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          setPending(true);
          setError(null);
          const result = await uploadTenantLogo(new FormData(form));
          setPending(false);
          if (!result.success) {
            setError(result.error);
            return;
          }
          form.reset();
          router.refresh();
        }}
        className="flex flex-wrap items-center gap-3"
      >
        <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" className="text-sm" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Upload logo
        </button>
        {hasLogo ? (
          <button
            type="button"
            disabled={pending}
            className="text-sm font-bold text-red-600"
            onClick={async () => {
              setPending(true);
              await clearTenantLogo();
              setPending(false);
              router.refresh();
            }}
          >
            Use product mark
          </button>
        ) : null}
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};
