'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getErrorMessage } from '@/lib/errors';
import { requireAdminContext } from '@/lib/auth/session';
import { getTenantFacing } from '@/lib/services/tenantFacing';
import {
  MAIL_TEMPLATE_KEYS,
  assertTicketToken,
  defaultMailTemplate,
  type MailTemplateKey,
} from '@/lib/services/mailTemplates';

export async function listMailTemplates() {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false as const, data: null, error: admin.error };

  try {
    const facing = await getTenantFacing(admin.ctx.tenantId);
    const rows = await prisma.emailTemplate.findMany({
      where: { tenantId: admin.ctx.tenantId },
      select: { key: true, subject: true, body: true },
    });
    const byKey = new Map(rows.map((row) => [row.key, row]));
    const data = MAIL_TEMPLATE_KEYS.map((key) => {
      const custom = byKey.get(key);
      const fallback = defaultMailTemplate(key, facing);
      return {
        key,
        subject: custom?.subject ?? fallback.subject,
        body: custom?.body ?? fallback.body,
        isCustom: Boolean(custom),
      };
    });
    return { success: true as const, data, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}

export async function saveMailTemplate(data: {
  key: MailTemplateKey;
  subject: string;
  body: string;
}) {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false as const, data: null, error: admin.error };
  if (!MAIL_TEMPLATE_KEYS.includes(data.key)) {
    return { success: false as const, data: null, error: 'Unknown template.' };
  }

  const subject = data.subject.trim();
  const body = data.key === 'public_reply' ? '' : data.body.trim();
  if (!subject || (data.key !== 'public_reply' && !body)) {
    return { success: false as const, data: null, error: 'Subject and body are required.' };
  }
  const tokenError = assertTicketToken(data.key, subject);
  if (tokenError) return { success: false as const, data: null, error: tokenError };

  try {
    await prisma.emailTemplate.upsert({
      where: { tenantId_key: { tenantId: admin.ctx.tenantId, key: data.key } },
      create: { tenantId: admin.ctx.tenantId, key: data.key, subject, body },
      update: { subject, body },
    });
    revalidatePath('/admin/appearance');
    return { success: true as const, data: true, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}

export async function resetMailTemplate(key: MailTemplateKey) {
  const admin = await requireAdminContext();
  if (!admin.ok) return { success: false as const, data: null, error: admin.error };

  try {
    await prisma.emailTemplate.deleteMany({
      where: { tenantId: admin.ctx.tenantId, key },
    });
    revalidatePath('/admin/appearance');
    return { success: true as const, data: true, error: null };
  } catch (error: unknown) {
    return { success: false as const, data: null, error: getErrorMessage(error) };
  }
}
