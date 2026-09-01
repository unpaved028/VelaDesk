export interface PortalScopeSession {
  email: string;
  tenantId: string;
  userId?: string;
  isCustomerAdmin?: boolean;
}

/** DLP: customer admin sees the tenant; everyone else only their own tickets. */
export function portalTicketWhere(session: PortalScopeSession): {
  tenantId: string;
  requesterId?: string;
  OR?: { requesterId: string }[];
} {
  if (session.isCustomerAdmin) {
    return { tenantId: session.tenantId };
  }
  // Graph/RMM store the email; seed/manual tickets often store the User id.
  if (session.userId) {
    return {
      tenantId: session.tenantId,
      OR: [{ requesterId: session.email }, { requesterId: session.userId }],
    };
  }
  return { tenantId: session.tenantId, requesterId: session.email };
}
