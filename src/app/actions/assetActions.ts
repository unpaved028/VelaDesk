'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { AssetIdSchema, CreateAssetSchema, UpdateAssetSchema, createErrorResponse } from '@/lib/validation/schemas';
import { requireAgentContext } from '@/lib/auth/session';

export async function createAsset(data: unknown) {
  try {
    const authResult = await requireAgentContext();
    if (!authResult.ok) return createErrorResponse(authResult.error);
    const tenantId = authResult.ctx.tenantId;

    const validation = CreateAssetSchema.safeParse(data);
    if (!validation.success) {
      return createErrorResponse(validation.error.issues[0]?.message || 'Invalid input parameter');
    }

    const assetData = validation.data;
    if (assetData.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: assetData.customerId, tenantId },
        select: { id: true },
      });
      if (!customer) return createErrorResponse('Customer not found.');
    }

    // Golden Rule: ALWAYS enforce tenantId
    const newAsset = await prisma.asset.create({
      data: {
        ...assetData,
        tenantId, // strict multi-tenancy enforcement
      }
    });

    revalidatePath('/admin/assets');
    return { success: true, data: newAsset, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createErrorResponse(message);
  }
}

export async function getAssets() {
  try {
    const authResult = await requireAgentContext();
    if (!authResult.ok) return createErrorResponse(authResult.error);
    const tenantId = authResult.ctx.tenantId;

    // Golden Rule: ALWAYS filter by tenantId
    const assets = await prisma.asset.findMany({
      where: {
        tenantId
      },
      include: {
        assignedTo: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: assets, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createErrorResponse(message);
  }
}

export async function updateAsset(data: unknown) {
  try {
    const authResult = await requireAgentContext();
    if (!authResult.ok) return createErrorResponse(authResult.error);
    const tenantId = authResult.ctx.tenantId;

    const validation = UpdateAssetSchema.safeParse(data);
    if (!validation.success) {
      return createErrorResponse(validation.error.issues[0]?.message || 'Invalid input parameter');
    }

    const { id, ...updateData } = validation.data;
    if (updateData.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: updateData.customerId, tenantId },
        select: { id: true },
      });
      if (!customer) return createErrorResponse('Customer not found.');
    }

    // Golden Rule: UPDATE with strict tenant isolation
    const updatedAsset = await prisma.asset.updateMany({
      where: {
        id,
        tenantId
      },
      data: updateData
    });

    if (updatedAsset.count === 0) {
      return createErrorResponse('Asset not found or access denied');
    }

    revalidatePath('/admin/assets');
    return { success: true, data: true, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createErrorResponse(message);
  }
}

export async function deleteAsset(id: unknown) {
  try {
    const authResult = await requireAgentContext();
    if (!authResult.ok) return createErrorResponse(authResult.error);
    const tenantId = authResult.ctx.tenantId;

    const validation = AssetIdSchema.safeParse(id);
    if (!validation.success) {
      return createErrorResponse('Invalid asset ID');
    }

    const assetId = validation.data;

    // Golden Rule: DELETE with strict tenant isolation
    const deletedAsset = await prisma.asset.deleteMany({
      where: {
        id: assetId,
        tenantId
      }
    });

    if (deletedAsset.count === 0) {
      return createErrorResponse('Asset not found or access denied');
    }

    revalidatePath('/admin/assets');
    return { success: true, data: true, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createErrorResponse(message);
  }
}

export async function linkAssetToTicket(ticketId: number, assetId: string) {
  const authResult = await requireAgentContext();
  if (!authResult.ok) return createErrorResponse(authResult.error);
  const tenantId = authResult.ctx.tenantId;

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, tenantId },
    select: { id: true },
  });
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, tenantId },
    select: { id: true },
  });
  if (!ticket || !asset) return createErrorResponse('Ticket or asset not found.');

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { assets: { connect: { id: asset.id } } },
  });
  revalidatePath('/tickets');
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath('/admin/assets');
  return { success: true, data: true, error: null };
}

export async function unlinkAssetFromTicket(ticketId: number, assetId: string) {
  const authResult = await requireAgentContext();
  if (!authResult.ok) return createErrorResponse(authResult.error);
  const tenantId = authResult.ctx.tenantId;

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, tenantId },
    select: { id: true },
  });
  if (!ticket) return createErrorResponse('Ticket not found.');

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { assets: { disconnect: { id: assetId } } },
  });
  revalidatePath('/tickets');
  revalidatePath(`/tickets/${ticketId}`);
  return { success: true, data: true, error: null };
}
