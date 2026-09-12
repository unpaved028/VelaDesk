import cron from 'node-cron';
import { prisma } from '@/lib/db/prisma';
import { SlaWorker } from './slaWorker';
import { runGraphSync } from './graphSync';
import { BackupWorker } from './backupWorker';

const globalForCron = globalThis as unknown as { veladeskCronStarted?: boolean };

export const initCronJobs = () => {
  if (globalForCron.veladeskCronStarted) {
    return;
  }
  globalForCron.veladeskCronStarted = true;

  console.log('[Cron] Initializing background jobs...');

  // SLA Check: Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron] Running SLA check...');
    try {
      await SlaWorker.runAll();
    } catch (error) {
      console.error('[Cron] SLA check failed:', error);
    }
  });

  // Graph mailbox ingest: every 2 minutes (no Graph subscription in v1)
  cron.schedule('*/2 * * * *', async () => {
    console.log('[Cron] Running Graph mailbox sync...');
    try {
      await runGraphSync();
    } catch (error) {
      console.error('[Cron] Graph sync failed:', error);
    }
  });

  // Do not wait for the first */2 tick after a deploy/recreate.
  void runGraphSync().catch((error) => {
    console.error('[Cron] Initial Graph sync failed:', error);
  });

  // Offsite backup: schedule from SystemConfig, default 03:00 daily
  void startBackupSchedule();
};

let backupTask: ReturnType<typeof cron.schedule> | null = null;

export function rescheduleBackupJob(expression: string): { ok: true } | { ok: false; error: string } {
  if (!cron.validate(expression)) {
    return { ok: false, error: `Invalid backup schedule "${expression}".` };
  }

  backupTask?.stop();
  backupTask = cron.schedule(expression, runBackupJob);
  console.log(`[Cron] Backup job scheduled: ${expression}`);
  return { ok: true };
}

async function startBackupSchedule() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { id: 'global' },
      select: { backupSchedule: true },
    });
    const expression = config?.backupSchedule || '0 3 * * *';
    const scheduled = rescheduleBackupJob(cron.validate(expression) ? expression : '0 3 * * *');
    if (!scheduled.ok) {
      console.error(`[Cron] ${scheduled.error} Falling back to 0 3 * * *.`);
      rescheduleBackupJob('0 3 * * *');
    }
  } catch (error) {
    console.error('[Cron] Failed to schedule backup job:', error);
  }
}

async function runBackupJob() {
  console.log('[Cron] Running offsite backup...');
  try {
    const result = await BackupWorker.executeBackup();
    if (!result.ok) {
      console.error('[Cron] Backup failed:', result.error);
      return;
    }
    if (result.skipped) {
      console.log('[Cron] Backup skipped:', result.reason);
      return;
    }
    console.log(`[Cron] Backup uploaded: ${result.fileName} → ${result.destination}`);
  } catch (error) {
    console.error('[Cron] Backup job failed:', error);
  }
}
