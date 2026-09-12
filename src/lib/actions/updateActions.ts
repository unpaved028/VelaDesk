'use server';

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { APP_VERSION } from '@/lib/appVersion';
import { requireAdminContext } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getSqliteDatabasePath } from '@/lib/db/sqlitePath';
import { getErrorMessage } from '@/lib/errors';
import { BackupWorker } from '../services/backupWorker';
import { getUpdateStatus, type UpdateStatus } from '../services/updateService';
import { ApiResponse } from './systemConfig';

const execAsync = promisify(exec);

export async function checkUpdatesAction(): Promise<ApiResponse<UpdateStatus>> {
  try {
    const status = await getUpdateStatus();
    return { success: true, data: status, error: null };
  } catch (error: unknown) {
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}

/**
 * Persist package.json version onto SystemConfig so middleware stops
 * sending admins to /admin/update-wizard after a code bump.
 */
export async function acknowledgeAppVersion(): Promise<ApiResponse<{ appVersion: string }>> {
  try {
    const auth = await requireAdminContext();
    if (!auth.ok) {
      return { success: false, data: null, error: auth.error };
    }

    const config = await prisma.systemConfig.upsert({
      where: { id: 'global' },
      update: { appVersion: APP_VERSION },
      create: { id: 'global', appVersion: APP_VERSION },
    });

    return { success: true, data: { appVersion: config.appVersion }, error: null };
  } catch (error: unknown) {
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}

export async function triggerAppUpdate(): Promise<ApiResponse<string>> {
  try {
    // 1. Create a local backup of the database
    const dbPath = getSqliteDatabasePath();
    if (fs.existsSync(dbPath)) {
      const backupPath = `${dbPath}.backup-${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`[Update Engine] Local database backup created at ${backupPath}`);
    }

    // Attempt to trigger offsite backup as well if configured
    try {
      const offsite = await BackupWorker.executeBackup();
      if (!offsite.ok) {
        console.warn('[Update Engine] Offsite backup failed, continuing with local copy:', offsite.error);
      } else if (offsite.skipped) {
        console.log('[Update Engine] Offsite backup skipped:', offsite.reason);
      } else {
        console.log(`[Update Engine] Offsite backup uploaded: ${offsite.fileName}`);
      }
    } catch (e) {
      console.warn('Offsite backup failed during update, but continuing with local backup.', e);
    }
    
    // 2. Execute docker compose commands
    // Note: If taking place from inside the container, this requires docker.sock mounted and docker CLI installed,
    // OR we trigger it if running on host. 
    // Usually a container cannot run `docker compose` unless it's configured for docker-in-docker or mounts the sock.
    // For a generic update engine, we can attempt the typical command.
    console.log('[Update Engine] Pulling new images...');
    await execAsync('docker compose pull', { cwd: process.cwd() });
    
    console.log('[Update Engine] Restarting container...');
    // We send this to background and return immediately so the server response doesn't hang forever
    // because restarting the container stops the running node process.
    setTimeout(() => {
       exec('docker compose up -d', { cwd: process.cwd() });
    }, 2000);

    return { 
      success: true, 
      data: 'Update initiated successfully. System will restart in a few seconds.', 
      error: null 
    };
  } catch (error: unknown) {
    console.error('[Update Engine] Update failed:', error);
    return { success: false, data: null, error: getErrorMessage(error) };
  }
}
