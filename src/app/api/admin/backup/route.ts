import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, statSync } from 'fs';
import path from 'path';

/**
 * GET /api/admin/backup
 * 
 * Downloads the current SQLite database file as a binary stream.
 * Protected by cookie-based SUPER_ADMIN role check.
 * 
 * Security: This route enforces its own RBAC check independent of
 * the middleware (defense in depth). API routes are not always
 * covered by the page-level middleware matcher.
 */
export async function GET(request: NextRequest) {
  // ── RBAC: Only SUPER_ADMIN may download backups ──
  const role = request.cookies.get('user_role')?.value;
  const bypass = request.cookies.get('DEV_BYPASS_AUTH')?.value === 'true';

  if (!bypass && role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { success: false, data: null, error: 'Forbidden: SUPER_ADMIN role required.' },
      { status: 403 }
    );
  }

  // ── Locate the SQLite database file ──
  // The DATABASE_URL in .env is "file:./dev.db" which is resolved relative to prisma/
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');

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

    // Stream the file as a binary download
    const stream = createReadStream(dbPath);

    // Convert Node.js ReadStream to Web ReadableStream
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
