import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/services/portalSession';

/**
 * POST /api/auth/portal/logout
 *
 * Destroys the portal session by clearing the HTTP-only session cookie.
 * Redirects the user back to the login page.
 *
 * Uses POST instead of GET to follow REST semantics —
 * logout is a state-changing operation.
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));

  // Clear the session cookie by setting it with maxAge=0
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Immediately expires the cookie
  });

  return response;
}
