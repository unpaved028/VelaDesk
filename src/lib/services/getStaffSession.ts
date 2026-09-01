import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { isStaffRole, type StaffRole } from '@/lib/auth/roles';
import { readStaffBootstrapEnabled } from '@/lib/auth/entraConfig';
import {
  STAFF_SESSION_COOKIE_NAME,
  verifyStaffSessionToken,
} from '@/lib/services/staffSession';

export interface StaffBootstrapContext {
  userId: string;
  tenantId: string;
  role: StaffRole;
  email: string;
}

/**
 * HMAC staff cookie is accepted only while Entra is not configured.
 * Role and tenant always come from the User row, not from the JWT claims.
 */
export async function getStaffBootstrapContext(): Promise<StaffBootstrapContext | null> {
  if (!(await readStaffBootstrapEnabled())) return null;

  const cookieStore = await cookies();
  const raw = cookieStore.get(STAFF_SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;

  const verified = verifyStaffSessionToken(raw);
  if (!verified.authenticated || !verified.session) return null;

  const user = await prisma.user.findFirst({
    where: {
      id: verified.session.userId,
      email: verified.session.email,
      tenantId: verified.session.tenantId,
    },
    select: { id: true, tenantId: true, role: true, email: true },
  });

  if (!user || !isStaffRole(user.role)) return null;

  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
  };
}
