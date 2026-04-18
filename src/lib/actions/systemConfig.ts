'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export async function getSystemConfig() {
  try {
    let config = await prisma.systemConfig.findUnique({
      where: { id: 'global' },
    });

    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          id: 'global',
        },
      });
    }

    return {
      success: true,
      data: config,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to retrieve system config',
    };
  }
}

export async function updateSystemConfig(data: {
  baseUrl: string;
  defaultTimezone: string;
  systemEmailSender: string;
  defaultWorkspaceId?: string | null;
}) {
  try {
    const config = await prisma.systemConfig.upsert({
      where: { id: 'global' },
      update: data,
      create: {
        id: 'global',
        ...data,
      },
    });

    revalidatePath('/admin/system');

    return {
      success: true,
      data: config,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to update system config',
    };
  }
}

export async function saveBackupConfig(data: {
  backupSchedule: string;
  backupTargetMailbox: string | null;
  backupTargetFolder: string;
}) {
  try {
    const config = await prisma.systemConfig.upsert({
      where: { id: 'global' },
      update: data,
      create: {
        id: 'global',
        ...data,
      },
    });

    revalidatePath('/admin/system');

    return {
      success: true,
      data: config,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to update backup config',
    };
  }
}
