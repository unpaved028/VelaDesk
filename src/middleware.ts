import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { APP_VERSION, isNewer } from '@/lib/appVersion';
import { isAdminPortalRole, isDevAuthBypassEnabled, isStaffRole } from '@/lib/auth/roles';
import { PORTAL_SESSION_COOKIE_NAME, STAFF_SESSION_COOKIE_NAME } from '@/lib/auth/sessionCookies';
import { unauthenticatedSignInPath } from '@/lib/auth/bootstrapAuth';

/**
 * Edge Middleware — runs before every matched route.
 *
 * Three protection layers:
 * 1. /setup interceptor → Redirects uninitialized systems to setup wizard
 * 2. /admin/* → Requires SUPER_ADMIN or ADMIN (JWT session role)
 * 3. / and /tickets → Requires authenticated staff session
 * 4. /portal/* → Requires valid portal session JWT (v0.8.3)
 *
 * NOTE: Next.js Edge Middleware cannot use Node.js `crypto` module directly.
 * We perform a lightweight structural + expiry check here. The full HMAC
 * signature verification happens server-side in getPortalSession() /
 * getStaffBootstrapContext(). Middleware only rejects obviously invalid tokens.
 */

const CODE_VERSION = APP_VERSION;

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ─── First-Run Setup Interceptor ──────────────────────────────────
  // Check if system is initialized before allowing access to main app routes.
  // Excluded: /setup itself, API routes, static assets, auth routes
  const isSetupExempt =
    path.startsWith('/setup') ||
    path.startsWith('/api') ||
    path.startsWith('/login') ||
    path.startsWith('/csat') ||
    path.startsWith('/_next') ||
    path.includes('.') || // Static files (favicon.ico, etc.)
    path.startsWith('/apple-icon') ||
    path.startsWith('/icon');

  // Default true so first-run (no Entra yet) is never locked behind SSO.
  let staffBootstrapEnabled = true;

  if (!isSetupExempt) {
    try {
      const initRes = await fetch(new URL('/api/system/init-status', request.url), {
        // Edge Middleware internal fetch — no cookies needed, this is a system check
        cache: 'no-store',
      });

      if (initRes.ok) {
        const { data } = await initRes.json();
        if (typeof data?.staffBootstrapEnabled === 'boolean') {
          staffBootstrapEnabled = data.staffBootstrapEnabled;
        }
        if (data && !data.isInitialized) {
          // System not initialized → redirect to setup wizard
          return NextResponse.redirect(new URL('/setup', request.url));
        }
      }
    } catch (error) {
      // If the init-status check fails (DB down, etc.), let the request through
      // rather than locking users out. The app itself will show appropriate errors.
      console.error('[Middleware] Init-status check failed:', error);
    }
  }

  // ─── Setup Guard: Prevent access to /setup after initialization ───
  if (path.startsWith('/setup')) {
    try {
      const initRes = await fetch(new URL('/api/system/init-status', request.url), {
        cache: 'no-store',
      });

      if (initRes.ok) {
        const { data } = await initRes.json();
        if (data && data.isInitialized) {
          // System already initialized → redirect away from setup
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      }
    } catch (error) {
      console.error('[Middleware] Setup guard check failed:', error);
    }
  }

  const secureCookie = request.cookies.get('__Secure-authjs.session-token')?.value;
  const devCookie = request.cookies.get('authjs.session-token')?.value;
  const hasNextAuthSession = !!secureCookie || !!devCookie;
  const bypass = isDevAuthBypassEnabled(request.cookies.get('DEV_BYPASS_AUTH')?.value);
  const signInUrl = unauthenticatedSignInPath(staffBootstrapEnabled);

  // ─── Agent Workspace Protection ──────────────────────────────────
  const isAgentApp = path === '/' || path.startsWith('/tickets');
  if (isAgentApp && !bypass) {
    if (hasNextAuthSession) {
      try {
        const sessionRes = await fetch(new URL('/api/auth/session', request.url), {
          headers: { cookie: request.headers.get('cookie') || '' },
        });
        const session = await sessionRes.json() as { user?: { role?: string } };
        if (!isStaffRole(session?.user?.role)) {
          return NextResponse.redirect(new URL(signInUrl, request.url));
        }
      } catch (error) {
        console.error('[Middleware] Agent role check failed:', error);
        return NextResponse.redirect(new URL(signInUrl, request.url));
      }
    } else {
      const staffRole = staffBootstrapEnabled
        ? readStaffCookieRole(request.cookies.get(STAFF_SESSION_COOKIE_NAME)?.value)
        : undefined;
      if (!isStaffRole(staffRole)) {
        return NextResponse.redirect(new URL(signInUrl, request.url));
      }
    }
  }

  // ─── Admin Route Protection ───────────────────────────────────────
  if (path.startsWith('/admin')) {
    if (!bypass && hasNextAuthSession) {
      try {
        const sessionRes = await fetch(new URL('/api/auth/session', request.url), {
          headers: { cookie: request.headers.get('cookie') || '' },
        });
        const session = await sessionRes.json() as { user?: { role?: string } };
        if (!isAdminPortalRole(session?.user?.role)) {
          return NextResponse.redirect(new URL('/tickets', request.url));
        }
      } catch (error) {
        console.error('[Middleware] Admin role check failed:', error);
        return NextResponse.redirect(new URL(signInUrl, request.url));
      }
    } else if (!bypass) {
      const staffRole = staffBootstrapEnabled
        ? readStaffCookieRole(request.cookies.get(STAFF_SESSION_COOKIE_NAME)?.value)
        : undefined;
      if (isStaffRole(staffRole) && !isAdminPortalRole(staffRole)) {
        return NextResponse.redirect(new URL('/tickets', request.url));
      }
      if (!isAdminPortalRole(staffRole)) {
        return NextResponse.redirect(new URL(signInUrl, request.url));
      }
    }

    // ─── Update Interceptor (Task 0.15.2) ─────────────────────────
    // Ignore internal api routes inside admin and the wizard/maintenance itself
    if (
      !bypass && 
      hasNextAuthSession && 
      !path.startsWith('/admin/update-wizard') &&
      !path.startsWith('/admin/maintenance') &&
      !path.startsWith('/admin/api')
    ) {
      try {
        const versionRes = await fetch(new URL('/api/system/version', request.url));
        if (versionRes.ok) {
          const { data } = await versionRes.json();
          const dbVersion = data?.appVersion || APP_VERSION;
          
          if (isNewer(CODE_VERSION, dbVersion)) {
            // We need to check if user is admin
            const sessionRes = await fetch(new URL('/api/auth/session', request.url), {
              headers: { cookie: request.headers.get('cookie') || '' }
            });
            const session = await sessionRes.json();
            const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

            if (isAdmin) {
              return NextResponse.redirect(new URL('/admin/update-wizard', request.url));
            } else {
              // Redirect normal agents to maintenance/locked page
              return NextResponse.redirect(new URL('/admin/maintenance', request.url));
            }
          }
        }
      } catch (error) {
        console.error('Middleware Update Check Error:', error);
      }
    }
  }

  // ─── Portal Route Protection (v0.8.3) ─────────────────────────────
  if (path.startsWith('/portal')) {
    const sessionCookie = request.cookies.get(PORTAL_SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      // No session → redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Lightweight structural + expiry check (Edge-compatible, no Node.js crypto)
    // Full HMAC verification happens server-side in getPortalSession()
    const sessionCheck = validateSessionStructure(sessionCookie);

    if (!sessionCheck.valid) {
      // Invalid or expired session → clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login?error=session_expired', request.url));
      response.cookies.set(PORTAL_SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return response;
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-veladesk-pathname', path);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function readStaffCookieRole(token: string | undefined): string | undefined {
  if (!token) return undefined;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as {
      exp?: number;
      email?: string;
      tenantId?: string;
      userId?: string;
      role?: string;
    };
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) return undefined;
    if (!payload.email || !payload.tenantId || !payload.userId || !payload.role) return undefined;
    return payload.role;
  } catch {
    return undefined;
  }
}

/**
 * Lightweight JWT structure + expiry validation for Edge Middleware.
 *
 * This does NOT verify the cryptographic signature (Edge Middleware has
 * limited crypto support). It checks:
 * 1. The token has 3 dot-separated parts (valid JWT structure)
 * 2. The payload can be decoded as JSON
 * 3. The `exp` claim is in the future
 * 4. Required claims (email, tenantId) are present
 *
 * Full HMAC-SHA256 signature verification is done server-side.
 */
function validateSessionStructure(token: string): { valid: boolean } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };

    // Decode payload (base64url → JSON)
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) return { valid: false };

    // Check required claims
    if (!payload.email || !payload.tenantId) return { valid: false };

    return { valid: true };
  } catch {
    return { valid: false };
  }
}

export const config = {
  // Run middleware on ALL routes except static assets and Next.js internals
  // This is required for the setup interceptor to work on root route (/)
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, apple-icon.svg (metadata files)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|apple-icon\\.svg).*)',
  ],
};
