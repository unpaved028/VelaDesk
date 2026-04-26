import { NextResponse } from 'next/server';
import { submitCsatRating } from '@/lib/services/csatService';
import type { CsatScoreValue, CsatSubmissionPayload } from '@/types/csat';

const VALID_SCORES: CsatScoreValue[] = ['GOOD', 'NEUTRAL', 'BAD'];

/**
 * GET /api/csat/[token]?score=GOOD|NEUTRAL|BAD
 *
 * Handles the customer clicking a smiley link in the CSAT email.
 * Validates the token, records the score, and redirects to the thank-you page.
 * Using GET because the links in the email are simple <a href> tags.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const score = searchParams.get('score') as CsatScoreValue | null;

  if (!score || !VALID_SCORES.includes(score)) {
    return NextResponse.redirect(
      new URL('/csat/thanks?status=error&reason=invalid_score', request.url)
    );
  }

  const result = await submitCsatRating(token, score);

  if (!result.valid) {
    const reason = result.reason === 'This survey has already been submitted.'
      ? 'already_submitted'
      : result.reason === 'This survey link has expired.'
        ? 'expired'
        : 'invalid';

    return NextResponse.redirect(
      new URL(`/csat/thanks?status=error&reason=${reason}`, request.url)
    );
  }

  return NextResponse.redirect(
    new URL(`/csat/thanks?status=success&score=${score}`, request.url)
  );
}

/**
 * POST /api/csat/[token]
 *
 * Alternative JSON API for programmatic CSAT submission (e.g., from a custom form).
 * Accepts { score: "GOOD"|"NEUTRAL"|"BAD", comment?: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body: CsatSubmissionPayload = await request.json();

    if (!body.score || !VALID_SCORES.includes(body.score)) {
      return NextResponse.json(
        { success: false, data: null, error: 'Invalid score. Must be GOOD, NEUTRAL, or BAD.' },
        { status: 400 }
      );
    }

    const result = await submitCsatRating(token, body.score, body.comment);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, data: null, error: result.reason || 'Token validation failed.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: { ticketId: result.ticketId, score: body.score }, error: null },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
