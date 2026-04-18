import { GraphTokenResponse, GraphApiConfig, GraphEmail, GraphEmailResponse } from '@/types/graph';

export class GraphApiHelper {
  private config: GraphApiConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: GraphApiConfig) {
    this.config = config;
  }

  public async getAccessToken(): Promise<string> {
    // Check if token is still valid (add 5 minutes buffer)
    if (this.accessToken && this.tokenExpiresAt > Date.now() + 5 * 60 * 1000) {
      return this.accessToken;
    }

    return this.fetchNewToken();
  }

  private async fetchNewToken(): Promise<string> {
    const { tenantId, clientId, clientSecret } = this.config;
    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    // We use the Client Credentials Grant format
    const body = new URLSearchParams({
      client_id: clientId,
      scope: 'https://graph.microsoft.com/.default',
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch Graph API token: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = (await response.json()) as GraphTokenResponse;
      
      this.accessToken = data.access_token;
      // Expires in is in seconds, convert to MS and add to current time
      this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error fetching MS Graph token:', error);
      throw error;
    }
  }

  public async fetchUnreadEmails(mailbox: string): Promise<GraphEmail[]> {
    const token = await this.getAccessToken();
        // toRecipients needed for multi-stage routing (0.7.4): To: → From: → Catch-All
    const url = `https://graph.microsoft.com/v1.0/users/${mailbox}/messages?$filter=isRead eq false&$select=subject,bodyPreview,from,toRecipients,id`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch unread emails: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = (await response.json()) as GraphEmailResponse;
      return data.value;
    } catch (error) {
      console.error('Error fetching unread emails from Graph API:', error);
      throw error;
    }
  }

  public async markAsRead(mailbox: string, messageId: string): Promise<void> {
    const token = await this.getAccessToken();
    const url = `https://graph.microsoft.com/v1.0/users/${mailbox}/messages/${messageId}`;

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isRead: true })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to mark email as read: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error(`Error marking email ${messageId} as read:`, error);
      throw error;
    }
  }
}
