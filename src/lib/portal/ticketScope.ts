export interface PortalScopeSession {
  email: string;
  tenantId: string;
  isCustomerAdmin?: boolean;
}

/** DLP: customer admin sees the tenant; everyone else only their requester email. */
export function portalTicketWhere(session: PortalScopeSession): {
  tenantId: string;
  requesterId?: string;
} {
  if (session.isCustomerAdmin) {
    return { tenantId: session.tenantId };
  }
  return { tenantId: session.tenantId, requesterId: session.email };
}
