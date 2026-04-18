import { NextRequest, NextResponse } from 'next/server';
import { validateAndConsumeToken, purgeExpiredTokens } from '@/lib/services/magicLink';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_HOURS } from '@/lib/services/portalSession';

/**
 * GET /api/auth/portal/verify?token=...
 *
 * This is the endpoint the Magic Link URL points to.
 * Flow:
 * 1. Extract token from query string
 * 2. Validate & consume the Magic Link token (single-use)
 * 3. On success: create a JWT session, set it as HTTP-only cookie, redirect to /portal
 * 4. On failure: redirect to /login with error
 *
 * We also opportunistically purge expired tokens on each verification attempt
 * to keep the DB clean without needing a separate CRON job.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/login?error=missing_token', request.url)
    );
  }

  // Validate and consume the magic link token
  const result = await validateAndConsumeToken(token);

  if (!result.valid || !result.email || !result.tenantId) {
    // Redirect back to login with human-readable error
    const errorParam = encodeURIComponent(result.reason || 'invalid_token');
    return NextResponse.redirect(
      new URL(`/login?error=${errorParam}`, request.url)
    );
  }

  // Token valid — create a session JWT
  const sessionToken = createSessionToken(result.email, result.tenantId);

  // Set the session cookie and redirect to the portal
  const response = NextResponse.redirect(new URL('/portal', request.url));

  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,                           // Prevents XSS access to session
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax',                          // CSRF protection while allowing navigations
    path: '/',                                // Available on all routes (middleware needs access)
    maxAge: SESSION_TTL_HOURS * 60 * 60,      // Cookie expiry matches JWT expiry
  });

  // Opportunistic cleanup — fire and forget, don't block the redirect
  purgeExpiredTokens().catch(() => {
    // Swallow errors — cleanup is best-effort, should never block login
  });

  return response;
}
