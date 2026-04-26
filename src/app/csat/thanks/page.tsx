import type { Metadata } from 'next';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-700 px-8 py-6">
          <h1 className="text-white text-lg font-semibold tracking-tight">VelaDesk</h1>
          <p className="text-slate-400 text-xs mt-1">Customer Feedback</p>
        </div>

        {/* Content */}
        <div className="px-8 py-10 text-center">
          {isSuccess ? (
            <>
              <div className="text-6xl mb-4">{EMOJI_MAP[score] || '✅'}</div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                Thank You!
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {LABEL_MAP[score] || 'Your feedback has been recorded.'}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-6">
                Your response helps us continuously improve our service.
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                Oops
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {ERROR_MESSAGES[reason] || 'Something went wrong.'}
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-[11px] text-center">
            Powered by VelaDesk — Modern Service Management
          </p>
        </div>
      </div>
    </div>
  );
}
