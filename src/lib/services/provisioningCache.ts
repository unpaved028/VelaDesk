/**
 * In-Memory Cache for Setup Tokens
 * 
 * Stores temporary, short-lived tokens generated in the admin UI
 * so that the automated PowerShell script can securely post credentials
 * back to the VelaDesk API without requiring the admin to log in from the script.
 * 
 * Security: Tokens are typically valid for 15 minutes.
 */

interface ProvisioningData {
  tenantId: string;
  workspaceId: string;
  expiresAt: number;
}

// Global variable to persist across Next.js hot-reloads in development
const globalForProvisioning = globalThis as unknown as {
  setupTokenMap: Map<string, ProvisioningData>;
};

const setupTokenMap = globalForProvisioning.setupTokenMap ?? new Map<string, ProvisioningData>();

if (process.env.NODE_ENV !== 'production') {
  globalForProvisioning.setupTokenMap = setupTokenMap;
}

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const provisioningCache = {
  /**
   * Creates a new setup token for a specific tenant and workspace.
   */
  createToken: (tenantId: string, workspaceId: string): string => {
    // Basic random string generator for the setup token
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
                  
    setupTokenMap.set(token, {
      tenantId,
      workspaceId,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    });
    
    return token;
  },

  /**
   * Retrieves and immediately INVALIDATES the token (one-time use).
   */
  consumeToken: (token: string): ProvisioningData | null => {
    const data = setupTokenMap.get(token);
    
    if (!data) return null;
    
    setupTokenMap.delete(token); // Single-use only!
    
    if (Date.now() > data.expiresAt) {
      return null;
    }
    
    return data;
  },
  
  /**
   * Peek at a token without consuming it.
   */
  peekToken: (token: string): ProvisioningData | null => {
    const data = setupTokenMap.get(token);
    
    if (!data) return null;
    if (Date.now() > data.expiresAt) return null;
    
    return data;
  }
};
