import type { Metadata } from 'next';
import { VelaLogo } from '@/components/ui/VelaLogo';

export const metadata: Metadata = {
  title: 'Danke — VelaDesk',
  description: 'Danke für Ihr Feedback.',
};

const EMOJI_MAP: Record<string, string> = {
  GOOD: '😊',
  NEUTRAL: '😐',
  BAD: '😞',
};

const LABEL_MAP: Record<string, string> = {
  GOOD: 'Freut uns.',
  NEUTRAL: 'Wir versuchen, besser zu werden.',
  BAD: 'Das tut uns leid. Wir arbeiten daran.',
};

const ERROR_MESSAGES: Record<string, string> = {
  already_submitted: 'Für dieses Ticket wurde bereits Feedback abgegeben.',
  expired: 'Dieser Umfrage-Link ist abgelaufen.',
  invalid: 'Dieser Umfrage-Link ist ungültig.',
  invalid_score: 'Ungültige Bewertung. Bitte die Links aus der E-Mail verwenden.',
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
            <VelaLogo variant="icon" tone="dark" className="h-full w-full" />
          </div>
          <div>
            <h1 className="font-headline text-lg font-bold text-white">VelaDesk</h1>
            <p className="mt-0.5 text-xs text-white/50">Kundenfeedback</p>
          </div>
        </div>

        <div className="px-8 py-10 text-center">
          {isSuccess ? (
            <>
              <div className="mb-4 text-6xl">{EMOJI_MAP[score] || '✅'}</div>
              <h2 className="mb-2 font-headline text-xl font-bold text-on-surface">
                Danke!
              </h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {LABEL_MAP[score] || 'Ihr Feedback wurde gespeichert.'}
              </p>
              <p className="mt-6 text-xs text-on-surface-variant/70">
                Ihre Antwort hilft uns, den Service zu verbessern.
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 text-5xl">⚠️</div>
              <h2 className="mb-2 font-headline text-xl font-bold text-on-surface">
                Hinweis
              </h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {ERROR_MESSAGES[reason] || 'Etwas ist schiefgelaufen.'}
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
