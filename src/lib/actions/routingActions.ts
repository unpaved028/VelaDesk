'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requireAdminContext } from '@/lib/auth/session';
import { matchEmailPattern } from '@/lib/routing/emailPattern';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

async function adminTenantId(): Promise<{ ok: true; tenantId: string } | { ok: false; error: string }> {
  const admin = await requireAdminContext();
  if (!admin.ok) return { ok: false, error: admin.error };
  // tenantId from the session only — never from the client payload.
  return { ok: true, tenantId: admin.ctx.tenantId };
}

export async function getRoutingRules() {
  const auth = await adminTenantId();
  if (!auth.ok) return { success: false, data: null, error: auth.error };

  try {
    const rules = await prisma.routingRule.findMany({
      where: { tenantId: auth.tenantId },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
      },
      orderBy: { priority: 'asc' },
    });

    return { success: true, data: rules, error: null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve routing rules';
    return { success: false, data: null, error: msg };
  }
}

export async function createRoutingRule(data: {
  tenantId?: string;
  workspaceId: string;
  emailPattern: string;
  priority?: number;
  description?: string;
}) {
  const auth = await adminTenantId();
  if (!auth.ok) return { success: false, data: null, error: auth.error };
  const tenantId = auth.tenantId;

  try {
    const workspace = await prisma.workspace.findFirst({
      where: { id: data.workspaceId, tenantId },
    });
    if (!workspace) {
      return { success: false, data: null, error: 'Workspace not found or tenant mismatch.' };
    }

    const rule = await prisma.routingRule.create({
      data: {
        tenantId,
        workspaceId: data.workspaceId,
        emailPattern: data.emailPattern,
        priority: data.priority ?? 100,
        description: data.description ?? null,
      },
    });

    revalidatePath('/admin/routing');
    return { success: true, data: rule, error: null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create routing rule';
    return { success: false, data: null, error: msg };
  }
}

export async function updateRoutingRule(data: {
  id: string;
  tenantId?: string;
  workspaceId?: string;
  emailPattern?: string;
  priority?: number;
  isActive?: boolean;
  description?: string | null;
}) {
  const auth = await adminTenantId();
  if (!auth.ok) return { success: false, data: null, error: auth.error };
  const tenantId = auth.tenantId;

  try {
    const existing = await prisma.routingRule.findFirst({
      where: { id: data.id, tenantId },
    });
    if (!existing) {
      return { success: false, data: null, error: 'Routing rule not found or tenant mismatch.' };
    }

    if (data.workspaceId && data.workspaceId !== existing.workspaceId) {
      const workspace = await prisma.workspace.findFirst({
        where: { id: data.workspaceId, tenantId },
      });
      if (!workspace) {
        return { success: false, data: null, error: 'Target workspace not found or tenant mismatch.' };
      }
    }

    const { id, tenantId: _ignored, ...updateData } = data;
    const rule = await prisma.routingRule.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/admin/routing');
    return { success: true, data: rule, error: null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update routing rule';
    return { success: false, data: null, error: msg };
  }
}

export async function deleteRoutingRule(id: string, _tenantId?: string) {
  const auth = await adminTenantId();
  if (!auth.ok) return { success: false, data: null, error: auth.error };
  const tenantId = auth.tenantId;

  try {
    const existing = await prisma.routingRule.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return { success: false, data: null, error: 'Routing rule not found or tenant mismatch.' };
    }

    await prisma.routingRule.delete({ where: { id } });

    revalidatePath('/admin/routing');
    return { success: true, data: null, error: null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete routing rule';
    return { success: false, data: null, error: msg };
  }
}

export async function resolveWorkspaceForEmail(
  tenantId: string,
  senderEmail: string
): Promise<string | null> {
  const rules = await prisma.routingRule.findMany({
    where: {
      tenantId,
      isActive: true,
    },
    orderBy: { priority: 'asc' },
    select: { emailPattern: true, workspaceId: true },
  });

  for (const rule of rules) {
    if (matchEmailPattern(rule.emailPattern, senderEmail)) {
      return rule.workspaceId;
    }
  }

  const config = await prisma.systemConfig.findUnique({
    where: { id: 'global' },
    select: { defaultWorkspaceId: true },
  });

  return config?.defaultWorkspaceId ?? null;
}
