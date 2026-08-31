import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/services/portalSession';
import { PortalSessionResult } from '@/types/portalSession';

/**
 * Server-side helper to retrieve and validate the portal session
 * from the current request's cookies.
 *
 * Use this in Server Components and Server Actions within /portal/*
 * to get the authenticated customer's email and tenantId.
 *
 * Example usage in a Server Component:
 *   const session = await getPortalSession();
 *   if (!session.authenticated) redirect('/login');
 *   // session.session.email / session.session.tenantId now available
 *
 * IMPORTANT: This function enforces requesterEmail isolation —
 * all portal data queries MUST use session.session.email and session.session.tenantId
 * as filter criteria. Never trust client-side email parameters.
 */
export async function getPortalSession(): Promise<PortalSessionResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return { authenticated: false, session: null, reason: 'No session cookie found.' };
  }

  const verified = verifySessionToken(sessionCookie.value);
  if (!verified.authenticated || !verified.session) return verified;

  const user = await prisma.user.findFirst({
    where: { email: verified.session.email, tenantId: verified.session.tenantId },
    select: { isCustomerAdmin: true, role: true, name: true },
  });

  return {
    authenticated: true,
    session: {
      ...verified.session,
      name: user?.name ?? verified.session.name ?? verified.session.email,
      // Only CUSTOMER users can be portal key-accounts — staff roles stay out of DLP widening
      isCustomerAdmin: user?.role === 'CUSTOMER' && user.isCustomerAdmin === true,
    },
  };
}
