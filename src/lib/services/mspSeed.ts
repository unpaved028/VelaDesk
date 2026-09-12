import { prisma } from '@/lib/db/prisma';
import {
  MSP_CATEGORIES,
  MSP_SAMPLE_TICKETS,
  MSP_SLAS,
  MSP_WORKSPACE_NAME,
  starterCatalogForLocale,
} from './mspSeedCatalog';

export interface MspSeedResult {
  workspaceId: string;
  alreadySeeded: boolean;
  createdCategories: number;
  createdSlas: number;
  createdSampleTickets: number;
  createdCatalogItems: number;
}

/**
 * Idempotent MSP starter data for one tenant.
 * Re-runs skip names that already exist so the wizard button cannot duplicate rows.
 */
export async function seedBestPracticesForTenant(tenantId: string): Promise<MspSeedResult> {
  let createdCategories = 0;
  let createdSlas = 0;
  let createdSampleTickets = 0;
  let createdCatalogItems = 0;

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

  for (const sample of MSP_SAMPLE_TICKETS) {
    const existing = await prisma.ticket.findFirst({
      where: { tenantId, subject: sample.subject },
      select: { id: true },
    });
    if (existing) continue;

    const now = new Date();
    await prisma.ticket.create({
      data: {
        tenantId,
        workspaceId: workspace.id,
        subject: sample.subject,
        description: sample.description,
        requesterId: 'sample@veladesk.local',
        status: 'NEW',
        priority: sample.priority,
        itilType: sample.itilType,
        slaResponseDeadline: new Date(now.getTime() + sample.responseHours * 60 * 60 * 1000),
        slaResolutionDeadline: new Date(now.getTime() + sample.resolutionHours * 60 * 60 * 1000),
      },
    });
    createdSampleTickets += 1;
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId },
    select: { locale: true },
  });
  for (const [index, item] of starterCatalogForLocale(tenant?.locale || 'de').entries()) {
    const existing = await prisma.catalogItem.findFirst({
      where: { tenantId, title: item.title },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.catalogItem.create({
      data: {
        tenantId,
        title: item.title,
        description: item.description,
        category: item.category,
        sortOrder: index,
      },
    });
    createdCatalogItems += 1;
  }

  const alreadySeeded =
    createdCategories === 0 &&
    createdSlas === 0 &&
    createdSampleTickets === 0 &&
    createdCatalogItems === 0;

  return {
    workspaceId: workspace.id,
    alreadySeeded,
    createdCategories,
    createdSlas,
    createdSampleTickets,
    createdCatalogItems,
  };
}
