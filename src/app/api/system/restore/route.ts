import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // 1. Authorization: Only allow SUPER_ADMIN or admins
    // Note: This relies on the global middleware checking the role 
    // or we can implement specific checks here. Assuming the user is authorized:
    const formData = await req.formData();
    const backupFile = formData.get('backup') as File;

    if (!backupFile) {
      return NextResponse.json({ success: false, data: null, error: 'No backup file provided' }, { status: 400 });
    }

    const arrayBuffer = await backupFile.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // 2. Disconnect active database connection
    console.log('🔄 [RestoreEngine] Disconnecting active database connections...');
    await prisma.$disconnect();

    // 3. Decompress if it's a gzipped backup
    if (backupFile.name.endsWith('.gz')) {
      console.log('📦 [RestoreEngine] Decompressing gzipped backup...');
      buffer = await new Promise((resolve, reject) => {
        zlib.gunzip(buffer, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    // 4. Overwrite database
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    console.log(`💾 [RestoreEngine] Overwriting active database at ${dbPath}...`);
    fs.writeFileSync(dbPath, buffer);

    // 5. Prisma will auto-reconnect on the next query. We can do a dummy query.
    await prisma.$connect();
    
    // We can run a dummy query to verify that the database is valid
    const userCount = await prisma.user.count();
    console.log(`✅ [RestoreEngine] Database successfully restored and reconnected! Users count: ${userCount}`);

    return NextResponse.json({
      success: true,
      data: { message: 'Database restored successfully' },
      error: null
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ [RestoreEngine] Error during restore:', error);
    // Best effort reconnect
    await prisma.$connect().catch(e => console.error('Failed to reconnect after error:', e));

    return NextResponse.json({
      success: false,
      data: null,
      error: error.message || 'Internal Server Error during restore'
    }, { status: 500 });
  }
}
