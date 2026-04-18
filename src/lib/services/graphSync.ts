import { prisma } from '@/lib/db/prisma';
import { GraphApiHelper } from '@/lib/api/graph';
import { decryptSecret } from '@/lib/services/encryption';
import { parseAndSaveTickets } from '@/lib/services/ticketParser';
import { GraphApiConfig } from '@/types/graph';

/**
 * Result object for a single mailbox sync run.
 * Provides granular success/failure tracking per mailbox.
 */
export interface MailboxSyncResult {
  mailboxConfigId: string;
  mailboxAddress: string;
  workspaceId: string;
  ticketsCreated: number;
  emailsProcessed: number;
  success: boolean;
  error?: string;
}

/**
 * Overall sync run result aggregating all mailbox results.
 */
export interface SyncRunResult {
  startedAt: Date;
  finishedAt: Date;
  totalMailboxes: number;
  successCount: number;
  failureCount: number;
  totalTicketsCreated: number;
  results: MailboxSyncResult[];
}

// Name of the subfolder where processed emails are moved to in M365.
// Created automatically on first use if it doesn't exist.
const PROCESSED_FOLDER_NAME = 'VELADESK_Processed';

/**
 * Background Sync Worker (Task 0.13.6)
 *
 * Iterates over all active MailboxConfigs, fetches unread emails via
 * Microsoft Graph API, routes them to workspaces via the multi-stage
 * ticket parser (v0.7.4), marks them as read, and moves them to
 * the "VELADESK_Processed" subfolder.
 *
 * Security: Client Secrets are decrypted per-tenant using the
 * VELADESK_MASTER_KEY + tenantId derivation (SOP-05).
 *
 * Multi-Tenancy: Each mailbox config belongs to exactly one tenant.
 * The tenantId is always passed through to the ticket parser and
 * included in every database query (SOP-02).
 */
export const runGraphSync = async (): Promise<SyncRunResult> => {
  const startedAt = new Date();
  const results: MailboxSyncResult[] = [];

  // 1. Fetch all active mailbox configurations across all tenants
  const mailboxConfigs = await prisma.mailboxConfig.findMany({
    where: { isActive: true },
    select: {
      id: true,
      tenantId: true,
      workspaceId: true,
      mailboxAddress: true,
      msTenantId: true,
      clientId: true,
      clientSecret: true, // Encrypted — must be decrypted per tenant
    },
  });

  if (mailboxConfigs.length === 0) {
    console.info('[graphSync] No active mailbox configurations found. Skipping sync.');
    return {
      startedAt,
      finishedAt: new Date(),
      totalMailboxes: 0,
      successCount: 0,
      failureCount: 0,
      totalTicketsCreated: 0,
      results: [],
    };
  }

  console.info(`[graphSync] Starting sync for ${mailboxConfigs.length} active mailbox(es)...`);

  // 2. Process each mailbox independently — one failure must NOT block others
  for (const config of mailboxConfigs) {
    const result = await syncSingleMailbox(config);
    results.push(result);
  }

  const finishedAt = new Date();
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  const totalTicketsCreated = results.reduce((sum, r) => sum + r.ticketsCreated, 0);

  console.info(
    `[graphSync] Sync complete. ` +
    `${successCount}/${results.length} mailboxes OK, ` +
    `${totalTicketsCreated} ticket(s) created, ` +
    `${failureCount} failure(s). ` +
    `Duration: ${finishedAt.getTime() - startedAt.getTime()}ms`
  );

  return {
    startedAt,
    finishedAt,
    totalMailboxes: results.length,
    successCount,
    failureCount,
    totalTicketsCreated,
    results,
  };
};

/**
 * Syncs a single mailbox: decrypt → fetch → parse → mark read → move.
 * Wrapped in try/catch so one failing mailbox doesn't crash the entire run.
 */
async function syncSingleMailbox(config: {
  id: string;
  tenantId: string;
  workspaceId: string;
  mailboxAddress: string;
  msTenantId: string;
  clientId: string;
  clientSecret: string;
}): Promise<MailboxSyncResult> {
  const { id, tenantId, workspaceId, mailboxAddress, msTenantId, clientId, clientSecret } = config;
  const logPrefix = `[graphSync][${mailboxAddress}]`;

  try {
    // Step 1: Decrypt the client secret (SOP-05, tenant-isolated key derivation)
    const decryptedSecret = decryptSecret(clientSecret, tenantId);

    // Step 2: Build Graph API client with decrypted credentials
    const graphConfig: GraphApiConfig = {
      tenantId: msTenantId,
      clientId,
      clientSecret: decryptedSecret,
    };
    const graph = new GraphApiHelper(graphConfig);

    // Step 3: Fetch unread emails from the Shared Mailbox
    const emails = await graph.fetchUnreadEmails(mailboxAddress);

    if (emails.length === 0) {
      console.info(`${logPrefix} No unread emails found.`);

      // Update lastSync timestamp even when there are no new emails
      await prisma.mailboxConfig.update({
        where: { id, workspaceId }, // tenantId enforced via unique workspaceId
        data: { lastSync: new Date() },
      });

      return {
        mailboxConfigId: id,
        mailboxAddress,
        workspaceId,
        ticketsCreated: 0,
        emailsProcessed: 0,
        success: true,
      };
    }

    console.info(`${logPrefix} Found ${emails.length} unread email(s). Processing...`);

    // Step 4: Parse emails into tickets via multi-stage routing
    const createdTickets = await parseAndSaveTickets({
      emails,
      tenantId,
      workspaceId, // Fallback workspace for catch-all routing
    });

    // Step 5: Post-process each email — mark as read + move to processed folder
    const processedFolderId = await ensureProcessedFolder(graph, mailboxAddress);

    for (const email of emails) {
      try {
        // Mark as read first (less destructive if move fails)
        await graph.markAsRead(mailboxAddress, email.id);

        // Move to "VELADESK_Processed" subfolder to keep Inbox clean
        if (processedFolderId) {
          await moveMessage(graph, mailboxAddress, email.id, processedFolderId);
        }
      } catch (postProcessError: unknown) {
        // Log but don't fail the entire sync — the ticket was already created
        console.warn(
          `${logPrefix} Post-processing failed for message ${email.id}: `,
          postProcessError instanceof Error ? postProcessError.message : String(postProcessError)
        );
      }
    }

    // Step 6: Update lastSync timestamp
    await prisma.mailboxConfig.update({
      where: { id, workspaceId },
      data: { lastSync: new Date() },
    });

    console.info(`${logPrefix} ✅ Sync complete. ${createdTickets.length} ticket(s) created.`);

    return {
      mailboxConfigId: id,
      mailboxAddress,
      workspaceId,
      ticketsCreated: createdTickets.length,
      emailsProcessed: emails.length,
      success: true,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${logPrefix} ❌ Sync failed:`, errorMessage);

    return {
      mailboxConfigId: id,
      mailboxAddress,
      workspaceId,
      ticketsCreated: 0,
      emailsProcessed: 0,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Ensures the "VELADESK_Processed" mail folder exists in the Shared Mailbox.
 * Creates it if it doesn't exist. Returns the folder ID.
 *
 * Returns null if folder creation fails (non-fatal — emails will stay in Inbox).
 */
async function ensureProcessedFolder(
  graph: GraphApiHelper,
  mailboxAddress: string
): Promise<string | null> {
  try {
    const token = await graph.getAccessToken();

    // Try to find existing folder first
    const searchUrl =
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxAddress)}` +
      `/mailFolders/Inbox/childFolders?$filter=displayName eq '${PROCESSED_FOLDER_NAME}'`;

    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (searchResponse.ok) {
      const data = await searchResponse.json();
      if (data.value && data.value.length > 0) {
        return data.value[0].id as string;
      }
    }

    // Folder doesn't exist — create it
    const createUrl =
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxAddress)}` +
      `/mailFolders/Inbox/childFolders`;

    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName: PROCESSED_FOLDER_NAME }),
    });

    if (createResponse.ok) {
      const folderData = await createResponse.json();
      console.info(`[graphSync] Created "${PROCESSED_FOLDER_NAME}" folder for ${mailboxAddress}`);
      return folderData.id as string;
    }

    console.warn(`[graphSync] Could not create "${PROCESSED_FOLDER_NAME}" folder (${createResponse.status})`);
    return null;
  } catch (error: unknown) {
    console.warn(
      `[graphSync] Error ensuring processed folder:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Moves a message to the specified destination folder via Graph API.
 */
async function moveMessage(
  graph: GraphApiHelper,
  mailboxAddress: string,
  messageId: string,
  destinationFolderId: string
): Promise<void> {
  const token = await graph.getAccessToken();
  const url =
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxAddress)}` +
    `/messages/${messageId}/move`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ destinationId: destinationFolderId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Move failed (${response.status}): ${errorText.substring(0, 200)}`);
  }
}
