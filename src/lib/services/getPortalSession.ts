import { cookies } from 'next/headers';
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

  return verifySessionToken(sessionCookie.value);
}
