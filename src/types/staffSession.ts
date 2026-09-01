import type { StaffRole } from '@/lib/auth/roles';

/** Payload encoded inside the staff bootstrap session JWT */
export interface StaffSessionPayload {
  email: string;
  tenantId: string;
  userId: string;
  role: StaffRole;
  iat: number;
  exp: number;
}

export interface StaffSessionResult {
  authenticated: boolean;
  session: StaffSessionPayload | null;
  reason?: string;
}
