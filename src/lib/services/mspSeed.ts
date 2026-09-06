import { prisma } from '@/lib/db/prisma';
import {
  MSP_CATEGORIES,
  MSP_SAMPLE_TICKET_SUBJECT,
  MSP_SLAS,
  MSP_WORKSPACE_NAME,
} from './mspSeedCatalog';

export interface MspSeedResult {
  workspaceId: string;
  alreadySeeded: boolean;
  createdCategories: number;
  createdSlas: number;
  createdSampleTicket: boolean;
}

/**
 * Idempotent MSP starter data for one tenant.
 * Re-runs skip names that already exist so the wizard button cannot duplicate rows.
 */
export async function seedBestPracticesForTenant(tenantId: string): Promise<MspSeedResult> {
  let createdCategories = 0;
  let createdSlas = 0;
  let createdSampleTicket = false;

  let workspace = await prisma.workspace.findFirst({
    where: { tenantId, name: MSP_WORKSPACE_NAME },
    select: { id: true },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        tenantId,
        name: MSP_WORKSPACE_NAME,
        type: 'ITSM',
      },
      select: { id: true },
    });
  }

  for (const category of MSP_CATEGORIES) {
    const existing = await prisma.ticketCategory.findFirst({
      where: { tenantId, name: category.name },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.ticketCategory.create({
      data: {
        tenantId,
        workspaceId: workspace.id,
        name: category.name,
        description: category.description,
      },
    });
    createdCategories += 1;
  }

  for (const sla of MSP_SLAS) {
    const existing = await prisma.sLA_Policy.findFirst({
      where: { tenantId, name: sla.name },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.sLA_Policy.create({
      data: {
        tenantId,
        workspaceId: workspace.id,
        name: sla.name,
        responseHours: sla.responseHours,
        resolutionHours: sla.resolutionHours,
      },
    });
    createdSlas += 1;
  }

  const config = await prisma.systemConfig.findUnique({
    where: { id: 'global' },
    select: { defaultWorkspaceId: true },
  });
  if (config && !config.defaultWorkspaceId) {
    await prisma.systemConfig.update({
      where: { id: 'global' },
      data: { defaultWorkspaceId: workspace.id },
    });
  }

  const sample = await prisma.ticket.findFirst({
    where: { tenantId, subject: MSP_SAMPLE_TICKET_SUBJECT },
    select: { id: true },
  });
  if (!sample) {
    const now = new Date();
    await prisma.ticket.create({
      data: {
        tenantId,
        workspaceId: workspace.id,
        subject: MSP_SAMPLE_TICKET_SUBJECT,
        description:
          'Sample incident from MSP Best Practices. Reply here to see the agent workspace. No mailbox is required.',
        requesterId: 'sample@veladesk.local',
        status: 'NEW',
        priority: 'MEDIUM',
        itilType: 'INCIDENT',
        slaResponseDeadline: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        slaResolutionDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });
    createdSampleTicket = true;
  }

  const alreadySeeded =
    createdCategories === 0 && createdSlas === 0 && createdSampleTicket === false;

  return {
    workspaceId: workspace.id,
    alreadySeeded,
    createdCategories,
    createdSlas,
    createdSampleTicket,
  };
}
