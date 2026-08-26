import { NextResponse } from 'next/server';
import { createReadStream, statSync } from 'fs';
import { requireSuperAdminContext, isDevAuthBypassEnabled } from '@/lib/auth/session';
import { getSqliteDatabasePath } from '@/lib/db/sqlitePath';

/**
 * GET /api/admin/backup
 *
 * Streams the SQLite database file. Instance-level operation — SUPER_ADMIN only.
 * Auth.js session is the source of truth (SOP-05). DEV_BYPASS_AUTH is ignored
 * in production.
 */
export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const bypass = isDevAuthBypassEnabled(
    /(?:^|;\s*)DEV_BYPASS_AUTH=true(?:;|$)/.test(cookieHeader) ? 'true' : undefined
  );

  if (!bypass) {
    const authResult = await requireSuperAdminContext();
    if (!authResult.ok) {
      const status = authResult.error === 'Not authenticated.' ? 401 : 403;
      return NextResponse.json(
        { success: false, data: null, error: authResult.error },
        { status }
      );
    }
  }

  const dbPath = getSqliteDatabasePath();

  try {
    const stat = statSync(dbPath);
    if (!stat.isFile()) {
      return NextResponse.json(
        { success: false, data: null, error: 'Database file not found.' },
        { status: 404 }
      );
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `VelaDesk-backup-${timestamp}.db`;

    const stream = createReadStream(dbPath);

    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: string | Buffer) => {
          controller.enqueue(new Uint8Array(Buffer.from(chunk)));
        });
        stream.on('end', () => {
          controller.close();
        });
        stream.on('error', (err) => {
          controller.error(err);
        });
      },
      cancel() {
        stream.destroy();
      }
    });

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Backup download failed:', message);
    return NextResponse.json(
      { success: false, data: null, error: `Backup failed: ${message}` },
      { status: 500 }
    );
  }
}
