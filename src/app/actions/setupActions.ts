'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Server Action: Complete the VelaDesk First-Run Setup.
 * 
 * Creates the initial Tenant, Admin User, and SystemConfig in a single
 * atomic transaction. This ensures either everything is created or
 * nothing is — preventing half-initialized states.
 * 
 * Security: This action checks that no admin exists before proceeding.
 * If an admin already exists, the action is rejected (prevents re-initialization).
 */

interface SetupPayload {
  firstName: string;
  lastName: string;
  email: string;
  baseUrl: string;
  systemEmail: string;
}

interface SetupResult {
  success: boolean;
  error: string | null;
}

export async function completeFirstRunSetup(payload: SetupPayload): Promise<SetupResult> {
  try {
    // Guard: Prevent re-initialization if an admin already exists
    // If the database has never been initialized, this might throw a "table not found" error.
    try {
      const existingAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      if (existingAdmin) {
        return {
          success: false,
          error: 'System is already initialized. Setup cannot be run again.',
        };
      }
      } catch (dbError: any) {
      console.log('[completeFirstRunSetup] Database check failed. Attempting to initialize schema...', dbError.message);
      try {
        // Automatically push the schema to the database
        await execAsync('npx prisma db push --accept-data-loss');
        console.log('[completeFirstRunSetup] Schema initialized successfully.');
        
        // Force Prisma to disconnect so the next query reconnects with the fresh schema
        // This clears any cached error states (like 'Table does not exist') from the previous failed query.
        await prisma.$disconnect();
      } catch (pushError: any) {
        console.error('[completeFirstRunSetup] Failed to initialize database schema:', pushError);
        return {
          success: false,
          error: 'Failed to initialize database schema. Please check the server logs.',
        };
      }
    }

    // Validate required fields
    if (!payload.firstName?.trim() || !payload.lastName?.trim() || !payload.email?.trim()) {
      return {
        success: false,
        error: 'First name, last name, and email are required.',
      };
    }

    // Atomic transaction: Create Tenant → Admin User → SystemConfig
    await prisma.$transaction(async (tx) => {
      // 1. Create the default Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: 'Default Organization',
          domain: payload.email.split('@')[1] || 'veladesk.local',
        },
      });

      // 2. Create the Admin User linked to the tenant
      await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: payload.email.trim().toLowerCase(),
          name: `${payload.firstName.trim()} ${payload.lastName.trim()}`,
          role: 'ADMIN',
        },
      });

      // 3. Upsert SystemConfig (sets isInitialized state implicitly)
      await tx.systemConfig.upsert({
        where: { id: 'global' },
        update: {
          baseUrl: payload.baseUrl?.trim() || 'http://localhost:3000',
          systemEmailSender: payload.systemEmail?.trim() || 'noreply@veladesk.local',
        },
        create: {
          id: 'global',
          baseUrl: payload.baseUrl?.trim() || 'http://localhost:3000',
          systemEmailSender: payload.systemEmail?.trim() || 'noreply@veladesk.local',
        },
      });
    });

    // Revalidate all routes to pick up the new initialized state
    revalidatePath('/', 'layout');

    return {
      success: true,
      error: null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error during setup';
    console.error('[completeFirstRunSetup] Failed:', message);
    return {
      success: false,
      error: `Setup failed: ${message}`,
    };
  }
}
