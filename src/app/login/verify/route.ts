import { NextRequest, NextResponse } from 'next/server';

/**
 * Legacy Magic Link path. Tokens used to be emailed as /login/verify?token=
 * while the consumer lives at /api/auth/portal/verify.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const target = new URL('/api/auth/portal/verify', request.url);
  if (token) target.searchParams.set('token', token);
  return NextResponse.redirect(target);
}
