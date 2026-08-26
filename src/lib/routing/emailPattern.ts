/**
 * Glob-style matcher for email routing (*@domain.com, user@*, exact).
 * Shared by ticketParser and routingActions so both stay in lockstep.
 */
export function matchEmailPattern(pattern: string, email: string): boolean {
  const lowerPattern = pattern.toLowerCase().trim();
  const lowerEmail = email.toLowerCase().trim();

  if (lowerPattern === lowerEmail) return true;

  const regexStr = lowerPattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');

  try {
    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(lowerEmail);
  } catch {
    // Invalid pattern — skip silently, don't crash the routing engine
    return false;
  }
}
