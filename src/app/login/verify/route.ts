import { NextRequest, NextResponse } from 'next/server';
import { publicAbsoluteUrl } from '@/lib/http/publicOrigin';

/**
 * Legacy Magic Link path. Tokens used to be emailed as /login/verify?token=
 * while the consumer lives at /api/auth/portal/verify.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const target = publicAbsoluteUrl(request, '/api/auth/portal/verify');
  if (token) target.searchParams.set('token', token);
  return NextResponse.redirect(target);
}
