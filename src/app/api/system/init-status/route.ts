import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isStaffBootstrapEnabled } from '@/lib/auth/bootstrapAuth';

/**
 * GET /api/system/init-status
 * 
 * Lightweight endpoint called by Edge Middleware to determine if
 * the VelaDesk instance has completed initial setup.
 * 
 * An instance is considered "initialized" when:
 * 1. A SystemConfig record exists, AND
 * 2. At least one User with role SUPER_ADMIN or ADMIN exists
 * 
 * This endpoint is intentionally unauthenticated — it only returns
 * a boolean flag, never sensitive data. Defense-in-depth: even if
 * someone calls this directly, they learn nothing exploitable.
 */
export const runtime = 'nodejs';
export const revalidate = 0; // Always fresh — critical for first-run detection

export async function GET() {
  try {
    // Parallel queries for speed — both must pass for "initialized"
    const [config, adminCount] = await Promise.all([
      prisma.systemConfig.findUnique({
        where: { id: 'global' },
        select: { id: true, appVersion: true, entraIdConfigured: true },
      }),
      prisma.user.count({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
      }),
    ]);

    const isInitialized = !!config && adminCount > 0;
    const staffBootstrapEnabled = isStaffBootstrapEnabled(config?.entraIdConfigured);

    return NextResponse.json({
      success: true,
      data: { isInitialized, staffBootstrapEnabled, entraIdConfigured: config?.entraIdConfigured === true },
      error: null,
    }, {
      status: 200,
      headers: {
        // Short cache to avoid hammering DB on every request,
        // but short enough to detect setup completion quickly
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[init-status] DB check failed:', error);
    // On DB error, assume NOT initialized to be safe —
    // this ensures the setup wizard is shown if DB is broken
    return NextResponse.json({
      success: true,
      data: { isInitialized: false, staffBootstrapEnabled: true, entraIdConfigured: false },
      error: null,
    }, { status: 200 });
  }
}
