/**
 * Types for M365 Mailbox Connection Testing (Task 0.13.4)
 */

/**
 * Input payload for pre-save connection testing.
 * These are raw (unencrypted) credentials from the Wizard form,
 * used only transiently during the test — never persisted in this form.
 */
export interface M365TestCredentials {
  mailboxAddress: string; // e.g. support@systemhaus.de
  msTenantId: string;     // Azure AD / Entra ID Tenant (Directory) ID
  clientId: string;       // App Registration Application (Client) ID
  clientSecret: string;   // App Registration Client Secret Value (plaintext, pre-encryption)
}

/**
 * Result of the M365 connection test.
 * success: true  → Token + Inbox access validated
 * success: false → errorCode + errorMessage describe what failed
 */
export interface M365TestResult {
  success: boolean;
  /** Diagnostic info on success */
  inboxDisplayName?: string;
  totalItemCount?: number;
  unreadItemCount?: number;
  /** Error info on failure */
  errorCode?: 'AUTH_FAILED' | 'MAILBOX_NOT_FOUND' | 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'UNKNOWN';
  errorMessage?: string;
}
