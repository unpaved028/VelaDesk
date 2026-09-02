import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isStaffRole } from '@/lib/auth/roles';
import { postVerifyPath } from '@/lib/auth/bootstrapAuth';
import { readStaffBootstrapEnabled } from '@/lib/auth/entraConfig';
import { publicAbsoluteUrl } from '@/lib/http/publicOrigin';
import { validateAndConsumeToken, purgeExpiredTokens } from '@/lib/services/magicLink';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_HOURS } from '@/lib/services/portalSession';
import {
  createStaffSessionToken,
  SESSION_TTL_HOURS as STAFF_SESSION_TTL_HOURS,
  STAFF_SESSION_COOKIE_NAME,
  staffSessionCookieOptions,
} from '@/lib/services/staffSession';

/**
 * GET /api/auth/portal/verify?token=...
 *
 * Consumes a Magic Link token, then:
 * - Staff (while Entra is not configured): HMAC staff cookie → /admin or /tickets
 * - Customers: HMAC portal cookie → /portal
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(publicAbsoluteUrl(request, '/login?error=missing_token'));
  }

  const result = await validateAndConsumeToken(token);

  if (!result.valid || !result.email || !result.tenantId) {
    const errorParam = encodeURIComponent(result.reason || 'invalid_token');
    return NextResponse.redirect(publicAbsoluteUrl(request, `/login?error=${errorParam}`));
  }

  const [user, staffBootstrapEnabled] = await Promise.all([
    prisma.user.findFirst({
      where: { email: result.email, tenantId: result.tenantId },
      select: { id: true, isCustomerAdmin: true, role: true, name: true },
    }),
    readStaffBootstrapEnabled(),
  ]);

  if (user && isStaffRole(user.role)) {
    if (!staffBootstrapEnabled) {
      return NextResponse.redirect(publicAbsoluteUrl(request, '/api/auth/signin'));
    }

    const sessionToken = createStaffSessionToken({
      email: result.email,
      tenantId: result.tenantId,
      userId: user.id,
      role: user.role,
    });
    const dest = postVerifyPath('staff', user.role);
    const response = NextResponse.redirect(publicAbsoluteUrl(request, dest));
    response.cookies.set(
      STAFF_SESSION_COOKIE_NAME,
      sessionToken,
      staffSessionCookieOptions(STAFF_SESSION_TTL_HOURS * 60 * 60)
    );
    purgeExpiredTokens().catch(() => {});
    return response;
  }

  const sessionToken = createSessionToken(result.email, result.tenantId, {
    isCustomerAdmin: user?.role === 'CUSTOMER' && user.isCustomerAdmin === true,
    name: user?.name,
  });

  const response = NextResponse.redirect(
    publicAbsoluteUrl(request, postVerifyPath('portal', user?.role))
  );

  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_HOURS * 60 * 60,
  });

  purgeExpiredTokens().catch(() => {});

  return response;
}
