import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireSuperAdminContext } from '@/lib/auth/session';
import { getErrorMessage } from '@/lib/errors';
import { applySqliteRestore } from '@/lib/services/sqliteBackup';
import { isSystemInitialized } from '@/lib/services/systemInit';
import type { ApiResponse } from '@/types/api';

const MAX_BACKUP_BYTES = 80 * 1024 * 1024;

/**
 * First-run: no session required (same trust boundary as the setup wizard).
 * After init: SUPER_ADMIN only.
 */
export async function POST(req: NextRequest) {
  try {
    const initialized = await isSystemInitialized();
    if (initialized) {
      const authResult = await requireSuperAdminContext();
      if (!authResult.ok) {
        const status = authResult.error === 'Not authenticated.' ? 401 : 403;
        return NextResponse.json(
          { success: false, data: null, error: authResult.error } as ApiResponse<null>,
          { status }
        );
      }
    }

    const formData = await req.formData();
    const backupFile = formData.get('file') ?? formData.get('backup');
    if (!(backupFile instanceof File)) {
      return NextResponse.json(
        { success: false, data: null, error: 'No backup file provided.' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    if (backupFile.size > MAX_BACKUP_BYTES) {
      return NextResponse.json(
        { success: false, data: null, error: 'Backup file is larger than 80 MB.' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const payload = Buffer.from(await backupFile.arrayBuffer());
    const result = await applySqliteRestore(payload);
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      data: { message: 'Database restored successfully.', userCount: result.userCount },
      error: null,
    } satisfies ApiResponse<{ message: string; userCount: number }>);
  } catch (error: unknown) {
    console.error('[RestoreEngine] Restore failed:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: getErrorMessage(error, 'Failed to restore database from backup'),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
