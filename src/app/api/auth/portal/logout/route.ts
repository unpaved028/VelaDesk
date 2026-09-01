import { NextRequest, NextResponse } from 'next/server';
import { PORTAL_SESSION_COOKIE_NAME, STAFF_SESSION_COOKIE_NAME } from '@/lib/auth/sessionCookies';

/**
 * POST /api/auth/portal/logout
 *
 * Clears portal and staff bootstrap session cookies, then redirects to /login.
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  const expired = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };

  response.cookies.set(PORTAL_SESSION_COOKIE_NAME, '', expired);
  response.cookies.set(STAFF_SESSION_COOKIE_NAME, '', expired);

  return response;
}
