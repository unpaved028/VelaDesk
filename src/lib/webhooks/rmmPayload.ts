export type RmmStatus = 'DOWN' | 'UP';

export interface ParsedRmmPayload {
  status: RmmStatus;
  alertId: string;
  subject: string;
  description: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

export function normalizeRmmStatus(raw: string | null): RmmStatus | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (['down', 'critical', 'problem', 'alert', 'firing', 'failed', 'offline'].includes(value)) {
    return 'DOWN';
  }
  if (['up', 'ok', 'resolved', 'recovered', 'clear', 'online', 'normal'].includes(value)) {
    return 'UP';
  }
  return null;
}

/**
 * Maps generic monitoring JSON (PRTG, NinjaOne-style) onto a DOWN/UP alert.
 */
export function parseRmmPayload(body: unknown): ParsedRmmPayload | { error: string } {
  const record = asRecord(body);
  if (!record) return { error: 'JSON object payload required.' };

  const status = normalizeRmmStatus(readString(record, ['status', 'state', 'event']));
  if (!status) return { error: 'status must be DOWN or UP (or a known synonym).' };

  const alertId = readString(record, ['alertId', 'alert_id', 'id', 'incidentId', 'uid']);
  if (!alertId) return { error: 'alertId is required.' };

  const host = readString(record, ['host', 'device', 'asset']);
  const title = readString(record, ['title', 'subject', 'message', 'summary']);
  const subject = title ?? (host ? `${host} is ${status}` : `RMM alert ${alertId}`);
  const extra = readString(record, ['description', 'message', 'details']);
  const description = [host ? `Host: ${host}` : null, extra, `Alert ID: ${alertId}`]
    .filter(Boolean)
    .join('\n');

  return { status, alertId, subject, description };
}
