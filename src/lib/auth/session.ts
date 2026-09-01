import { auth } from '@/auth';
import {
  isAdminPortalRole,
  isStaffRole,
  isSuperAdminRole,
  type StaffRole,
} from '@/lib/auth/roles';
import { getStaffBootstrapContext } from '@/lib/services/getStaffSession';

export {
  isAdminPortalRole,
  isDevAuthBypassEnabled,
  isStaffRole,
  isSuperAdminRole,
} from '@/lib/auth/roles';

/**
 * Session helpers for agent/admin Server Actions and API routes.
 *
 * tenantId and userId MUST come from Auth.js or the staff Magic Link session (SOP-02).
 * Never fall back to prisma.tenant.findFirst() or a synthetic demo agent.
 */

export interface AgentContext {
  userId: string;
  tenantId: string;
  role: StaffRole;
  email: string;
}

export async function requireAgentContext(): Promise<
  { ok: true; ctx: AgentContext } | { ok: false; error: string }
> {
  let session: Awaited<ReturnType<typeof auth>> | null = null;
  try {
    session = await auth();
  } catch (error) {
    // Auth.js can throw when Entra env is missing; first-run uses Magic Link instead.
    console.error('[auth] Session read failed:', error);
  }
  const user = session?.user;

  if (user?.id && user.tenantId && isStaffRole(user.role)) {
    return {
      ok: true,
      ctx: {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email ?? '',
      },
    };
  }

  // First-run: Entra is not configured yet — accept the staff Magic Link cookie.
  const bootstrap = await getStaffBootstrapContext();
  if (bootstrap) {
    return { ok: true, ctx: bootstrap };
  }

  if (!user?.id || !user.tenantId) {
    return { ok: false, error: 'Not authenticated.' };
  }

  return { ok: false, error: 'Forbidden.' };
}

export async function requireAdminContext(): Promise<
  { ok: true; ctx: AgentContext } | { ok: false; error: string }
> {
  const result = await requireAgentContext();
  if (!result.ok) return result;
  if (!isAdminPortalRole(result.ctx.role)) {
    return { ok: false, error: 'Forbidden: admin role required.' };
  }
  return result;
}

export async function requireSuperAdminContext(): Promise<
  { ok: true; ctx: AgentContext } | { ok: false; error: string }
> {
  const result = await requireAgentContext();
  if (!result.ok) return result;
  if (!isSuperAdminRole(result.ctx.role)) {
    return { ok: false, error: 'Forbidden: SUPER_ADMIN role required.' };
  }
  return result;
}
