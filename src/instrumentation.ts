/**
 * Next.js instrumentation hook — runs once when the Node.js server starts.
 * Wires background jobs (SLA, Graph mail sync, offsite backup) that previously
 * existed as dead code (B4).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { assertMasterKeyPresent } = await import('@/lib/services/encryption');
  assertMasterKeyPresent();

  const { initCronJobs } = await import('@/lib/services/cron');
  initCronJobs();
}
