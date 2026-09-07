import type { Metadata } from 'next';
import { VelaLogo } from '@/components/ui/VelaLogo';

export const metadata: Metadata = {
  title: 'Thank You — VelaDesk',
  description: 'Thank you for your feedback.',
};

const EMOJI_MAP: Record<string, string> = {
  GOOD: '😊',
  NEUTRAL: '😐',
  BAD: '😞',
};

const LABEL_MAP: Record<string, string> = {
  GOOD: 'Glad to hear it!',
  NEUTRAL: "We'll try to do better.",
  BAD: "We're sorry. We'll work on improving.",
};

const ERROR_MESSAGES: Record<string, string> = {
  already_submitted: 'You have already submitted feedback for this ticket.',
  expired: 'This survey link has expired.',
  invalid: 'This survey link is invalid.',
  invalid_score: 'Invalid rating. Please use the links from your email.',
};

/**
 * /csat/thanks — Public thank-you page shown after CSAT submission.
 * Reads status + score/reason from search params (set by the API redirect).
 * No authentication required — this is a public-facing page.
 */
export default async function CsatThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; score?: string; reason?: string }>;
}) {
  const resolvedParams = await searchParams;
  const status = resolvedParams.status || 'error';
  const score = resolvedParams.score || '';
  const reason = resolvedParams.reason || 'invalid';

  const isSuccess = status === 'success';

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-xl">
        <div className="flex items-center gap-3 bg-[#000e23] px-8 py-6">
          <div className="h-10 w-10 overflow-hidden rounded-xl">
            <VelaLogo variant="icon" className="h-full w-full" />
          </div>
          <div>
            <h1 className="font-headline text-lg font-bold text-white">VelaDesk</h1>
            <p className="mt-0.5 text-xs text-white/50">Customer Feedback</p>
          </div>
        </div>

        <div className="px-8 py-10 text-center">
          {isSuccess ? (
            <>
              <div className="mb-4 text-6xl">{EMOJI_MAP[score] || '✅'}</div>
              <h2 className="mb-2 font-headline text-xl font-bold text-on-surface">
                Thank You!
              </h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {LABEL_MAP[score] || 'Your feedback has been recorded.'}
              </p>
              <p className="mt-6 text-xs text-on-surface-variant/70">
                Your response helps us continuously improve our service.
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 text-5xl">⚠️</div>
              <h2 className="mb-2 font-headline text-xl font-bold text-on-surface">
                Oops
              </h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {ERROR_MESSAGES[reason] || 'Something went wrong.'}
              </p>
            </>
          )}
        </div>

        <div className="border-t border-outline-variant/15 bg-surface-container-low px-8 py-4">
          <p className="text-center text-[11px] text-on-surface-variant">
            © 2026 VelaDesk
          </p>
        </div>
      </div>
    </div>
  );
}
