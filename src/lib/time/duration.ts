/**
 * Parses time-tracker input ("15m", "1h", "1h 30m", or plain minutes).
 * Returns duration in minutes, or null if the string is empty/invalid.
 */
export function parseDurationMinutes(input: string): number | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    return n > 0 ? n : null;
  }

  const hourMatch = raw.match(/(\d+)\s*h/);
  const minMatch = raw.match(/(\d+)\s*m/);
  let minutes = 0;
  if (hourMatch) minutes += Number(hourMatch[1]) * 60;
  if (minMatch) minutes += Number(minMatch[1]);
  if (minutes <= 0) return null;

  const leftover = raw
    .replace(/(\d+)\s*h/g, '')
    .replace(/(\d+)\s*m/g, '')
    .trim();
  if (leftover) return null;

  return minutes;
}
