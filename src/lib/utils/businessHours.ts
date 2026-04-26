/**
 * Utility to calculate deadlines based on business hours.
 */

export interface BusinessHours {
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  days: number[];    // [1, 2, 3, 4, 5] (1=Monday)
  timezone: string;
}

/**
 * Calculates a deadline after X hours, only counting business hours.
 * 
 * Simple logic:
 * 1. If start is outside business hours, move to next business start.
 * 2. Add time. If it goes beyond business end, wrap to next business day start.
 */
export function calculateSlaDeadline(
  start: Date,
  hours: number,
  business: BusinessHours
): Date {
  let remainingMs = hours * 60 * 60 * 1000;
  let current = new Date(start);

  const [startH, startM] = business.startTime.split(':').map(Number);
  const [endH, endM] = business.endTime.split(':').map(Number);

  while (remainingMs > 0) {
    // 1. Ensure we are in a business day
    while (!business.days.includes(current.getDay() === 0 ? 7 : current.getDay())) {
      current.setDate(current.getDate() + 1);
      current.setHours(startH, startM, 0, 0);
    }

    // 2. Check if we are before business start
    const busStart = new Date(current);
    busStart.setHours(startH, startM, 0, 0);
    if (current < busStart) {
      current = busStart;
    }

    // 3. Check if we are after business end
    const busEnd = new Date(current);
    busEnd.setHours(endH, endM, 0, 0);
    if (current >= busEnd) {
      current.setDate(current.getDate() + 1);
      current.setHours(startH, startM, 0, 0);
      continue;
    }

    // 4. Calculate remaining time in current business day
    const timeToBusEnd = busEnd.getTime() - current.getTime();
    
    if (remainingMs <= timeToBusEnd) {
      current = new Date(current.getTime() + remainingMs);
      remainingMs = 0;
    } else {
      remainingMs -= timeToBusEnd;
      current.setDate(current.getDate() + 1);
      current.setHours(startH, startM, 0, 0);
    }
  }

  return current;
}
