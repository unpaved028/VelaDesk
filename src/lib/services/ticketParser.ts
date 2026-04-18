import { prisma } from '@/lib/db/prisma';
import { GraphEmail } from '@/types/graph';

// --- Routing Result ---
// Tracks which stage resolved the workspace so we can tag the ticket accordingly.
interface RoutingResult {
  workspaceId: string;
  matchStage: 'TO_MATCH' | 'FROM_MATCH' | 'CATCH_ALL';
}

export interface ParseTicketsOptions {
  emails: GraphEmail[];
  tenantId: string;
  workspaceId: string; // Fallback workspace (from the mailbox config)
}

/**
 * Multi-Stage Ticket Parser (v0.7.4)
 * 
 * For each incoming email, the routing logic runs through 3 stages:
 *   Stage 1: Check To: address against routing rules (which mailbox received the mail?)
 *   Stage 2: Check From: address against routing rules (who sent the mail?)
 *   Stage 3: Fall back to the mailbox's configured workspace or global catch-all.
 * 
 * The first match wins. The ticket is tagged with "AUTO_ROUTED" + the match stage.
 */
export const parseAndSaveTickets = async (options: ParseTicketsOptions) => {
  const { emails, tenantId, workspaceId: fallbackWorkspaceId } = options;

  if (!emails || emails.length === 0) {
    return [];
  }

  // Pre-fetch all active routing rules for this tenant once (avoids N+1 queries)
  const rules = await prisma.routingRule.findMany({
    where: { tenantId, isActive: true },
    orderBy: { priority: 'asc' },
    select: { emailPattern: true, workspaceId: true },
  });

  // Pre-fetch global catch-all workspace
  const systemConfig = await prisma.systemConfig.findUnique({
    where: { id: 'global' },
    select: { defaultWorkspaceId: true },
  });

  const createdTickets = [];

  for (const email of emails) {
    const senderAddress = email.from?.emailAddress?.address || 'unknown@example.com';
    
    // --- Multi-Stage Routing ---
    const routing = resolveRouting(email, rules, {
      fallbackWorkspaceId,
      catchAllWorkspaceId: systemConfig?.defaultWorkspaceId ?? null,
    });

    const tags = buildTags(routing);

    const ticketData = {
      tenantId,
      workspaceId: routing.workspaceId,
      subject: email.subject || 'No Subject',
      description: email.bodyPreview || 'No Content',
      requesterId: senderAddress,
      tags,
    };

    const newTicket = await prisma.ticket.create({
      data: ticketData,
    });

    createdTickets.push(newTicket);
  }

  return createdTickets;
};

// --- Multi-Stage Routing Engine (local, no DB calls) ---
// Evaluates pre-fetched rules against the email in 3 stages.
function resolveRouting(
  email: GraphEmail,
  rules: { emailPattern: string; workspaceId: string }[],
  fallbacks: { fallbackWorkspaceId: string; catchAllWorkspaceId: string | null }
): RoutingResult {
  // Stage 1: Check To: recipients against rules
  // "Which mailbox received this mail?" — useful for shared-mailbox setups
  const toAddresses = (email.toRecipients || [])
    .map(r => r.emailAddress?.address)
    .filter((addr): addr is string => Boolean(addr));

  for (const toAddr of toAddresses) {
    for (const rule of rules) {
      if (matchEmailPattern(rule.emailPattern, toAddr)) {
        return { workspaceId: rule.workspaceId, matchStage: 'TO_MATCH' };
      }
    }
  }

  // Stage 2: Check From: sender against rules
  // "Who sent the mail?" — route by customer domain
  const senderAddress = email.from?.emailAddress?.address;
  if (senderAddress) {
    for (const rule of rules) {
      if (matchEmailPattern(rule.emailPattern, senderAddress)) {
        return { workspaceId: rule.workspaceId, matchStage: 'FROM_MATCH' };
      }
    }
  }

  // Stage 3: Catch-All — use global default or mailbox-level fallback
  const catchAllId = fallbacks.catchAllWorkspaceId ?? fallbacks.fallbackWorkspaceId;
  return { workspaceId: catchAllId, matchStage: 'CATCH_ALL' };
}

// --- Tag Builder ---
// Creates a comma-separated tag string for the ticket.
function buildTags(routing: RoutingResult): string {
  const tags: string[] = [];
  
  if (routing.matchStage !== 'CATCH_ALL') {
    // Only tag as AUTO_ROUTED when a rule actually matched
    tags.push('AUTO_ROUTED');
  }
  tags.push(routing.matchStage);

  return tags.join(',');
}

// --- Glob-style Pattern Matcher ---
// Supports: *@domain.com, user@*, exact matches
// Duplicated from routingActions.ts to keep this module independent of 'use server'
function matchEmailPattern(pattern: string, email: string): boolean {
  const lowerPattern = pattern.toLowerCase().trim();
  const lowerEmail = email.toLowerCase().trim();

  if (lowerPattern === lowerEmail) return true;

  // Convert glob * to regex .*  (escape all other special chars first)
  const regexStr = lowerPattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');

  try {
    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(lowerEmail);
  } catch {
    return false;
  }
}
