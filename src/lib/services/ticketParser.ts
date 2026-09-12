import { prisma } from '@/lib/db/prisma';
import { matchEmailPattern } from '@/lib/routing/emailPattern';
import { GraphEmail } from '@/types/graph';
import {
  extractTicketIdFromSubject,
  extractTicketIdFromText,
  normalizeSubject,
} from './ticketRef';
import { ensureCustomer } from './customers';
import { sendTicketAckMail } from './emailSender';

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
    const inboundBody = inboundText(email);
    const existing = await findExistingTicket(email, {
      tenantId,
      senderAddress,
    });

    if (existing) {
      await appendInboundReply(existing, {
        body: inboundBody,
        senderAddress,
        conversationId: email.conversationId,
      });
      continue;
    }

    // --- Multi-Stage Routing ---
    const routing = resolveRouting(email, rules, {
      fallbackWorkspaceId,
      catchAllWorkspaceId: systemConfig?.defaultWorkspaceId ?? null,
    });

    const tags = buildTags(routing);

    const now = new Date();
    const slaResponseDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000); // Default: 4h
    const slaResolutionDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default: 24h

    const ticketData = {
      tenantId,
      workspaceId: routing.workspaceId,
      subject: email.subject || 'No Subject',
      description: inboundBody,
      requesterId: senderAddress,
      tags,
      graphConversationId: email.conversationId || null,
      slaResponseDeadline,
      slaResolutionDeadline
    };

    const newTicket = await prisma.ticket.create({
      data: ticketData,
    });

    const senderName = email.from?.emailAddress?.name || senderAddress;
    await ensureCustomer({
      tenantId,
      email: senderAddress,
      name: senderName,
    });
    await sendTicketAckMail({
      ticketId: newTicket.id,
      tenantId,
      workspaceId: routing.workspaceId,
      requesterId: senderAddress,
      subject: newTicket.subject,
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

function inboundText(email: GraphEmail): string {
  const content = email.body?.content?.trim();
  if (content) {
    const type = email.body?.contentType?.toLowerCase() ?? '';
    if (type === 'text' || type === 'text/plain') return content;
    const stripped = content
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .trim();
    if (stripped) return stripped;
  }
  return email.bodyPreview || 'No Content';
}

async function findExistingTicket(
  email: GraphEmail,
  ctx: { tenantId: string; senderAddress: string }
) {
  const tokenId =
    extractTicketIdFromSubject(email.subject) ?? extractTicketIdFromText(inboundText(email));

  if (tokenId) {
    const byToken = await prisma.ticket.findFirst({
      where: { id: tokenId, tenantId: ctx.tenantId },
      select: { id: true, status: true, graphConversationId: true },
    });
    if (byToken) return byToken;
  }

  if (email.conversationId) {
    const byThread = await prisma.ticket.findFirst({
      where: { tenantId: ctx.tenantId, graphConversationId: email.conversationId },
      select: { id: true, status: true, graphConversationId: true },
    });
    if (byThread) return byThread;
  }

  const normalized = normalizeSubject(email.subject);
  if (normalized.length < 3) return null;

  const senderTickets = await prisma.ticket.findMany({
    where: {
      tenantId: ctx.tenantId,
      OR: [
        { requesterId: ctx.senderAddress },
        { requesterId: ctx.senderAddress.toLowerCase() },
      ],
    },
    select: { id: true, status: true, subject: true, graphConversationId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return senderTickets.find((ticket) => normalizeSubject(ticket.subject) === normalized) ?? null;
}

async function appendInboundReply(
  existing: { id: number; status: string; graphConversationId?: string | null },
  input: { body: string; senderAddress: string; conversationId?: string }
) {
  await prisma.message.create({
    data: {
      ticketId: existing.id,
      body: input.body,
      isInternal: false,
      authorId: input.senderAddress,
    },
  });
  console.info(
    `[ticketParser] Appended inbound reply to ticket ${existing.id} from ${input.senderAddress}`
  );

  const data: { status?: 'OPEN'; graphConversationId?: string } = {};
  if (existing.status === 'RESOLVED' || existing.status === 'CLOSED') {
    data.status = 'OPEN';
  }
  if (input.conversationId && !existing.graphConversationId) {
    data.graphConversationId = input.conversationId;
  }
  if (Object.keys(data).length > 0) {
    await prisma.ticket.update({
      where: { id: existing.id },
      data,
    });
  }
}

