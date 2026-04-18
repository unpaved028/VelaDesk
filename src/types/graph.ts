export interface GraphTokenResponse {
  token_type: string;
  expires_in: number;
  ext_expires_in: number;
  access_token: string;
}

export interface GraphApiConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export interface GraphEmailAddress {
  emailAddress: {
    name: string;
    address: string;
  };
}

export interface GraphEmail {
  id: string;
  subject: string; // Will map to Ticket title
  bodyPreview: string; // Will map to Ticket description
  from: GraphEmailAddress; // Will map to customer info
  toRecipients?: GraphEmailAddress[]; // Used for routing: which mailbox received this
}

export interface GraphEmailResponse {
  value: GraphEmail[];
}
