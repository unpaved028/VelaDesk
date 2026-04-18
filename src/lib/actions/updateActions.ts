'use server';

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { BackupWorker } from '../services/backupWorker';
import { getUpdateStatus } from '../services/updateService';
import { ApiResponse } from './systemConfig';

const execAsync = promisify(exec);

export async function checkUpdatesAction(): Promise<ApiResponse<any>> {
  try {
    const status = await getUpdateStatus();
    return { success: true, data: status, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}

export async function triggerAppUpdate(): Promise<ApiResponse<string>> {
  try {
    // 1. Create a local backup of the database
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    if (fs.existsSync(dbPath)) {
      const backupPath = path.join(process.cwd(), 'prisma', `dev.backup-${Date.now()}.db`);
      fs.copyFileSync(dbPath, backupPath);
      console.log(`[Update Engine] Local database backup created at ${backupPath}`);
    }

    // Attempt to trigger offsite backup as well if configured
    try {
      await BackupWorker.executeBackup();
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
  } catch (error: any) {
    console.error('[Update Engine] Update failed:', error);
    return { success: false, data: null, error: error.message };
  }
}
