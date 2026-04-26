import cron from 'node-cron';
import { SlaWorker } from './slaWorker';

export const initCronJobs = () => {
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

  // You can add more cron jobs here (e.g. email sync, backups)
};
