/**
 * CSAT (Customer Satisfaction) types.
 * Used by csatService.ts, the /api/csat/[token] route, and the /csat/thanks page.
 */

/** Result of generating a new CSAT survey token */
export interface CsatTokenGenerationResult {
  token: string;
  csatUrl: string;
  expiresAt: Date;
}

/** Result of validating and submitting a CSAT rating */
export interface CsatSubmissionResult {
  valid: boolean;
  ticketId: number | null;
  /** Human-readable reason if submission failed */
  reason?: string;
}

/** The three possible satisfaction levels shown to the customer */
export type CsatScoreValue = 'GOOD' | 'NEUTRAL' | 'BAD';

/** Payload sent by the customer when submitting a CSAT rating */
export interface CsatSubmissionPayload {
  score: CsatScoreValue;
  comment?: string;
}
