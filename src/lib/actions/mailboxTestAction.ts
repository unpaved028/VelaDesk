'use server';

import { M365TestCredentials, M365TestResult } from '@/types/mailbox';

/**
 * Server Action: testM365Connection (Task 0.13.4)
 *
 * Pre-save connection tester for the M365 Shared Mailbox Wizard.
 * Takes raw (unencrypted) credentials from the Wizard form,
 * authenticates against Microsoft Entra ID, and attempts to read
 * the Inbox folder of the specified Shared Mailbox.
 *
 * Security Note: These credentials are received in plaintext from the
 * client form and are ONLY used transiently for this test. They are
 * never persisted — encryption happens later in saveMailboxConfig().
 */
export async function testM365Connection(
  credentials: M365TestCredentials
): Promise<M365TestResult> {
  const { mailboxAddress, msTenantId, clientId, clientSecret } = credentials;

  // 1. Input validation
  if (!mailboxAddress || !msTenantId || !clientId || !clientSecret) {
    return {
      success: false,
      errorCode: 'UNKNOWN',
      errorMessage: 'Alle Felder (Mailbox-Adresse, Tenant ID, Client ID, Client Secret) müssen ausgefüllt sein.',
    };
  }

  // 2. Acquire Bearer Token via OAuth2 Client Credentials Flow
  let accessToken: string;
  try {
    const tokenUrl = `https://login.microsoftonline.com/${msTenantId}/oauth2/v2.0/token`;

    const tokenBody = new URLSearchParams({
      client_id: clientId,
      scope: 'https://graph.microsoft.com/.default',
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('[testM365Connection] Token acquisition failed:', errorBody);

      // Parse Microsoft error response for better diagnostics
      let detail = 'Unbekannter Authentifizierungsfehler.';
      try {
        const parsed = JSON.parse(errorBody);
        detail = parsed.error_description || parsed.error || detail;
      } catch {
        // errorBody wasn't JSON, use raw text
        detail = errorBody.substring(0, 200);
      }

      return {
        success: false,
        errorCode: 'AUTH_FAILED',
        errorMessage: `Authentifizierung fehlgeschlagen (${tokenResponse.status}): ${detail}`,
      };
    }

    const tokenData = await tokenResponse.json();
    accessToken = tokenData.access_token;

    if (!accessToken) {
      return {
        success: false,
        errorCode: 'AUTH_FAILED',
        errorMessage: 'Token-Response enthielt kein access_token.',
      };
    }
  } catch (error: unknown) {
    console.error('[testM365Connection] Network error during token request:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: `Netzwerkfehler beim Token-Abruf: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  // 3. Attempt to read the Inbox folder of the Shared Mailbox
  try {
    const inboxUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxAddress)}/mailFolders/Inbox`;

    const inboxResponse = await fetch(inboxUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!inboxResponse.ok) {
      const errorBody = await inboxResponse.text();
      console.error('[testM365Connection] Inbox read failed:', errorBody);

      // Classify error based on HTTP status
      if (inboxResponse.status === 404) {
        return {
          success: false,
          errorCode: 'MAILBOX_NOT_FOUND',
          errorMessage: `Postfach "${mailboxAddress}" wurde nicht gefunden. Prüfen Sie die E-Mail-Adresse und ob es sich um ein Shared Mailbox handelt.`,
        };
      }

      if (inboxResponse.status === 403 || inboxResponse.status === 401) {
        return {
          success: false,
          errorCode: 'PERMISSION_DENIED',
          errorMessage: `Zugriff verweigert (${inboxResponse.status}). Stellen Sie sicher, dass die App-Registrierung die Berechtigung "Mail.ReadWrite.Shared" besitzt und ein Admin-Consent erteilt wurde.`,
        };
      }

      return {
        success: false,
        errorCode: 'UNKNOWN',
        errorMessage: `Graph API Fehler (${inboxResponse.status}): ${errorBody.substring(0, 200)}`,
      };
    }

    // Parse the Inbox folder metadata
    const inboxData = await inboxResponse.json();

    console.info(`[testM365Connection] ✅ Successfully validated connection for ${mailboxAddress}`);

    return {
      success: true,
      inboxDisplayName: inboxData.displayName || 'Inbox',
      totalItemCount: inboxData.totalItemCount ?? 0,
      unreadItemCount: inboxData.unreadItemCount ?? 0,
    };
  } catch (error: unknown) {
    console.error('[testM365Connection] Network error during Inbox read:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: `Netzwerkfehler beim Inbox-Zugriff: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
