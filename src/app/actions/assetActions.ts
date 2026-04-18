'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { AssetIdSchema, CreateAssetSchema, UpdateAssetSchema, createErrorResponse } from '@/lib/validation/schemas';

// Mock function for simulating auth for MVP. 
// ALWAYS filter by tenantId!
async function getCurrentTenantId() {
  const firstTenant = await prisma.tenant.findFirst();
  return firstTenant?.id || null;
}

export async function createAsset(data: unknown) {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return createErrorResponse('No active tenant found');

    const validation = CreateAssetSchema.safeParse(data);
    if (!validation.success) {
      return createErrorResponse(validation.error.issues[0]?.message || 'Invalid input parameter');
    }

    const assetData = validation.data;
    
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
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return createErrorResponse('No active tenant found');

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
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return createErrorResponse('No active tenant found');

    const validation = UpdateAssetSchema.safeParse(data);
    if (!validation.success) {
      return createErrorResponse(validation.error.issues[0]?.message || 'Invalid input parameter');
    }

    const { id, ...updateData } = validation.data;

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
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return createErrorResponse('No active tenant found');

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
