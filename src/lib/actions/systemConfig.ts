'use server';

import cron from 'node-cron';
import { getErrorMessage } from '@/lib/errors';
import { revalidatePath } from 'next/cache';
import { requireAdminContext } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { parseSharePointSiteUrl, sanitizeFolder } from '@/lib/services/backupTarget';
import { rescheduleBackupJob } from '@/lib/services/cron';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

function normalizeBackupTargetFolder(value: string): string {
  const trimmed = value.trim() || 'VelaDeskBackups';
  const parsed = parseSharePointSiteUrl(trimmed);
  if (parsed) {
    return `https://${parsed.hostname}${parsed.serverRelativePath}/${parsed.folder}`;
  }
  return sanitizeFolder(trimmed);
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
  } catch (error: unknown) {
    return {
      success: false,
      data: null,
      error: getErrorMessage(error, 'Failed to retrieve system config'),
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
  } catch (error: unknown) {
    return {
      success: false,
      data: null,
      error: getErrorMessage(error, 'Failed to update system config'),
    };
  }
}

export async function saveBackupConfig(data: {
  backupSchedule: string;
  backupTargetMailbox: string | null;
  backupTargetFolder: string;
}) {
  const auth = await requireAdminContext();
  if (!auth.ok) {
    return { success: false, data: null, error: auth.error };
  }

  if (!cron.validate(data.backupSchedule.trim())) {
    return {
      success: false,
      data: null,
      error: 'Invalid cron expression. Example: 0 3 * * *',
    };
  }

  try {
    const folder = normalizeBackupTargetFolder(data.backupTargetFolder);
    const config = await prisma.systemConfig.upsert({
      where: { id: 'global' },
      update: {
        backupSchedule: data.backupSchedule.trim(),
        backupTargetMailbox: data.backupTargetMailbox,
        backupTargetFolder: folder,
      },
      create: {
        id: 'global',
        backupSchedule: data.backupSchedule.trim(),
        backupTargetMailbox: data.backupTargetMailbox,
        backupTargetFolder: folder,
      },
    });

    const scheduled = rescheduleBackupJob(data.backupSchedule.trim());
    if (!scheduled.ok) {
      return { success: false, data: null, error: scheduled.error };
    }

    revalidatePath('/admin/system');

    return {
      success: true,
      data: config,
      error: null,
    };
  } catch (error: unknown) {
    return {
      success: false,
      data: null,
      error: getErrorMessage(error, 'Failed to update backup config'),
    };
  }
}
