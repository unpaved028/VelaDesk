import { createReadStream } from 'fs';
import fs from 'fs';
import { NextResponse } from 'next/server';
import { requireSuperAdminContext, isDevAuthBypassEnabled } from '@/lib/auth/session';
import { createSqliteSnapshotFile } from '@/lib/services/sqliteBackup';

/**
 * GET /api/admin/backup
 *
 * Streams a consistent SQLite snapshot. SUPER_ADMIN only.
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

  try {
    const snapshot = await createSqliteSnapshotFile();
    const stream = createReadStream(snapshot.path);

    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: string | Buffer) => {
          controller.enqueue(new Uint8Array(Buffer.from(chunk)));
        });
        stream.on('end', () => {
          fs.rmSync(snapshot.path, { force: true });
          controller.close();
        });
        stream.on('error', (err) => {
          fs.rmSync(snapshot.path, { force: true });
          controller.error(err);
        });
      },
      cancel() {
        stream.destroy();
        fs.rmSync(snapshot.path, { force: true });
      },
    });

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="${snapshot.fileName}"`,
        'Content-Length': snapshot.size.toString(),
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
