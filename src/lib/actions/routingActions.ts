'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// --- READ ---
export async function getRoutingRules(tenantId: string) {
  try {
    const rules = await prisma.routingRule.findMany({
      where: { tenantId }, // SOP-02: Tenant isolation
      include: {
        workspace: {
          select: { id: true, name: true },
        },
      },
      orderBy: { priority: 'asc' }, // Lower number = higher priority
    });

    return { success: true, data: rules, error: null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve routing rules';
    return { success: false, data: null, error: msg };
  }
}

// --- CREATE ---
export async function createRoutingRule(data: {
  tenantId: string;
  workspaceId: string;
  emailPattern: string;
  priority?: number;
  description?: string;
}) {
  try {
    // Validate workspace belongs to the same tenant (defense-in-depth)
    const workspace = await prisma.workspace.findFirst({
      where: { id: data.workspaceId, tenantId: data.tenantId },
    });
    if (!workspace) {
      return { success: false, data: null, error: 'Workspace not found or tenant mismatch.' };
    }

    const rule = await prisma.routingRule.create({
      data: {
        tenantId: data.tenantId,
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

// --- UPDATE ---
export async function updateRoutingRule(data: {
  id: string;
  tenantId: string;
  workspaceId?: string;
  emailPattern?: string;
  priority?: number;
  isActive?: boolean;
  description?: string | null;
}) {
  try {
    // SOP-02: Verify rule belongs to tenant before update
    const existing = await prisma.routingRule.findFirst({
      where: { id: data.id, tenantId: data.tenantId },
    });
    if (!existing) {
      return { success: false, data: null, error: 'Routing rule not found or tenant mismatch.' };
    }

    // If workspace is being changed, validate it belongs to same tenant
    if (data.workspaceId && data.workspaceId !== existing.workspaceId) {
      const workspace = await prisma.workspace.findFirst({
        where: { id: data.workspaceId, tenantId: data.tenantId },
      });
      if (!workspace) {
        return { success: false, data: null, error: 'Target workspace not found or tenant mismatch.' };
      }
    }

    const { id, tenantId, ...updateData } = data;
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

// --- DELETE ---
export async function deleteRoutingRule(id: string, tenantId: string) {
  try {
    // SOP-02: Verify rule belongs to tenant before deletion
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

// --- ROUTING ENGINE (Core Logic) ---
// Evaluates routing rules for an incoming email sender address.
// Returns the workspaceId if a match is found, otherwise null.
export async function resolveWorkspaceForEmail(
  tenantId: string,
  senderEmail: string
): Promise<string | null> {
  // Fetch active rules for this tenant, ordered by priority (ascending)
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

  // No rule matched — check global catch-all
  const config = await prisma.systemConfig.findUnique({
    where: { id: 'global' },
    select: { defaultWorkspaceId: true },
  });

  return config?.defaultWorkspaceId ?? null;
}

// Simple glob-style pattern matcher for email routing
// Supports: *@domain.com, user@*, exact matches
function matchEmailPattern(pattern: string, email: string): boolean {
  const lowerPattern = pattern.toLowerCase().trim();
  const lowerEmail = email.toLowerCase().trim();

  // Exact match
  if (lowerPattern === lowerEmail) return true;

  // Convert glob pattern to regex:
  // - Escape regex special chars (except *)
  // - Replace * with .*
  const regexStr = lowerPattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/\*/g, '.*');                    // Convert glob * to regex .*

  try {
    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(lowerEmail);
  } catch {
    // Invalid pattern — skip silently, don't crash the routing engine
    return false;
  }
}
