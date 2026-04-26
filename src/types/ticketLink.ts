/**
 * Types for the Related Tickets / Parent-Child linking feature (Phase 74).
 * Used by ticketLinkActions.ts and RelatedTicketsModal.tsx.
 */

/** A lightweight ticket reference for search results and relationship display */
export interface TicketReference {
  id: number;
  subject: string;
  status: string;
  priority: string;
  itilType: string;
  createdAt: string;
}

/** The relationship direction from the current ticket's perspective */
export type RelationshipType = 'PARENT' | 'CHILD';

/** A linked ticket with its relationship type */
export interface LinkedTicket {
  ticket: TicketReference;
  relationship: RelationshipType;
}

/** Result of a ticket search for linking purposes */
export interface TicketSearchResult {
  tickets: TicketReference[];
  total: number;
}

/** Payload for the linkTickets server action */
export interface LinkTicketsPayload {
  parentTicketId: number;
  childTicketId: number;
}
