'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export async function seedBestPractices(tenantId: string): Promise<ApiResponse<any>> {
  if (!tenantId) {
    return { success: false, data: null, error: "tenantId is strictly required for seeding." };
  }

  try {
    // 1. Create Default Workspace
    const defaultWorkspace = await prisma.workspace.create({
      data: {
        tenantId,
        name: "Default ITSM Workspace",
        type: "ITSM",
      }
    });

    // 2. Create 4 Standard Categories
    const categories = [
      { name: "Hardware", description: "Probleme und Anfragen bezüglich physischer Geräte" },
      { name: "Software", description: "Probleme und Anfragen bezüglich Anwendungen und Programmen" },
      { name: "Netzwerk", description: "Verbindungsprobleme, VPN und WLAN" },
      { name: "Account", description: "Passwort-Resets, Zugriffsrechte und Onboarding" }
    ];

    await Promise.all(
      categories.map(cat => 
        prisma.ticketCategory.create({
          data: {
            tenantId,
            workspaceId: defaultWorkspace.id,
            name: cat.name,
            description: cat.description
          }
        })
      )
    );

    // 3. Create 3 SLAs
    const slas = [
      { name: "P1 (Urgent)", responseHours: 1, resolutionHours: 2 },
      { name: "P2 (High)", responseHours: 2, resolutionHours: 8 },
      { name: "Standard", responseHours: 8, resolutionHours: 24 }
    ];

    await Promise.all(
      slas.map(sla => 
        prisma.sLA_Policy.create({
          data: {
            tenantId,
            workspaceId: defaultWorkspace.id,
            name: sla.name,
            responseHours: sla.responseHours,
            resolutionHours: sla.resolutionHours
          }
        })
      )
    );

    // 4. Update the System Config to use this as the default workspace if none is set
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { id: "global" }
      });
      if (config && !config.defaultWorkspaceId) {
        await prisma.systemConfig.update({
          where: { id: "global" },
          data: { defaultWorkspaceId: defaultWorkspace.id }
        });
      }
    } catch (e) {
      console.error("Could not set defaultWorkspaceId in global config:", e);
    }

    revalidatePath('/admin');
    
    return { success: true, data: { workspace: defaultWorkspace }, error: null };
  } catch (error: any) {
    console.error("Error in seedBestPractices:", error);
    return { success: false, data: null, error: error.message };
  }
}
