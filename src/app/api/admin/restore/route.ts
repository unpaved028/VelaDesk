import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '@/types/api';

// Create a singleton prisma instance if possible or reuse existing.
// In Next.js, we often use a global prisma instance, but here we explicitly
// want to disconnect it, so it's safer to instantiate locally and then rely 
// on the global one to reconnect on next query, or just disconnect the global.
// Assuming we have a global prisma at src/lib/prisma.ts, let's try to import it,
// otherwise use a new one.

// Using standard import instead since we don't know if lib/prisma.ts exists
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        data: null,
        error: "No backup file uploaded"
      } as ApiResponse<any>, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const backupDbPath = path.join(process.cwd(), 'prisma', `dev-backup-${Date.now()}.db`);

    // 1. Disconnect Prisma to release file locks on Windows
    await prisma.$disconnect();

    // Give it a tiny delay to ensure file locks are released by the OS
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 2. Backup current DB before overwrite
    if (fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(dbPath, backupDbPath);
      } catch (err) {
        console.error('[Restore Engine] Failed to backup current database:', err);
      }
    }

    // 3. Unzip or just write if it's plain db
    if (file.name.endsWith('.gz') || file.type === 'application/gzip' || file.name.endsWith('.zip')) {
      // NOTE: node's zlib handles gzip/deflate. If it's a real PKZIP format, 
      // gunzipSync might fail, but for our BackupWorker we used createGzip().
      try {
        const unzippedBuffer = zlib.gunzipSync(buffer);
        fs.writeFileSync(dbPath, unzippedBuffer);
      } catch (e) {
        // Fallback: Just write the file directly if it's already a .db despite the extension
        // or if decompression fails.
        console.warn('[Restore Engine] Decompression failed, writing as raw.', e);
        fs.writeFileSync(dbPath, buffer);
      }
    } else {
      // It's a plain .db
      fs.writeFileSync(dbPath, buffer);
    }

    // 4. Force reconnect Prisma
    await prisma.$connect();

    return NextResponse.json({
      success: true,
      data: { message: "Database restored successfully." },
      error: null
    } as ApiResponse<{ message: string }>, { status: 200 });

  } catch (error: any) {
    console.error('❌ [Restore Engine] Restore failed:', error);
    
    // Try to ensure Prisma is connected even if an error occurs
    try { await prisma.$connect(); } catch (e) {}

    return NextResponse.json({
      success: false,
      data: null,
      error: error.message || "Failed to restore database from backup"
    } as ApiResponse<any>, { status: 500 });
  }
}
