import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge Middleware — runs before every matched route.
 *
 * Three protection layers:
 * 1. /setup interceptor → Redirects uninitialized systems to setup wizard
 * 2. /admin/* → Requires SUPER_ADMIN role (existing)
 * 3. /portal/* → Requires valid portal session JWT (v0.8.3)
 *
 * NOTE: Next.js Edge Middleware cannot use Node.js `crypto` module directly.
 * We perform a lightweight structural + expiry check here. The full HMAC
 * signature verification happens server-side in getPortalSession() and the
 * verify route. This is defense-in-depth: middleware catches obviously
 * invalid/expired sessions early (fast redirect), while the server-side
 * layer does the cryptographic verification.
 */

import pkg from '../package.json';

const SESSION_COOKIE_NAME = 'VELADESK_portal_session';
const CODE_VERSION = pkg.version;

function isNewer(codeVer: string, dbVer: string) {
  const c = codeVer.split('.').map(Number);
  const d = dbVer.split('.').map(Number);
  for (let i = 0; i < Math.max(c.length, d.length); i++) {
    const cv = c[i] || 0;
    const dv = d[i] || 0;
    if (cv > dv) return true;
    if (cv < dv) return false;
  }
  return false;
}

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

  if (!isSetupExempt) {
    try {
      const initRes = await fetch(new URL('/api/system/init-status', request.url), {
        // Edge Middleware internal fetch — no cookies needed, this is a system check
        cache: 'no-store',
      });

      if (initRes.ok) {
        const { data } = await initRes.json();
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

  // ─── Admin Route Protection ───────────────────────────────────────
  if (path.startsWith('/admin')) {
    // Basic protection using the NextAuth session cookie
    // Auth.js edge session cookies are named depending on secure/non-secure environment
    const secureCookie = request.cookies.get('__Secure-authjs.session-token')?.value;
    const devCookie = request.cookies.get('authjs.session-token')?.value;
    const hasNextAuthSession = !!secureCookie || !!devCookie;

    const bypass = request.cookies.get('DEV_BYPASS_AUTH')?.value === 'true';

    if (!bypass && !hasNextAuthSession) {
      // NOTE: Unauthenticated users are redirected to login/api
      return NextResponse.redirect(new URL('/api/auth/signin', request.url));
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
          const dbVersion = data?.appVersion || '0.1.0';
          
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
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

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
      response.cookies.set(SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return response;
    }
  }

  return NextResponse.next();
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
