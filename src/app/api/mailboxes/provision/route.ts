import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';
import { provisioningCache } from '@/lib/services/provisioningCache';
import { encryptSecret } from '@/lib/services/encryption';

const ProvisionPayloadSchema = z.object({
  setupToken: z.string().min(1).optional(),
  mailboxAddress: z.string().email('Invalid email address'),
  msTenantId: z.string().min(1, 'Microsoft Tenant ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
});

interface ProvisionTarget {
  tenantId: string;
  workspaceId: string;
}

interface ProvisionedMailbox {
  id: string;
  mailboxAddress: string;
  message: string;
}

/**
 * Token path: admin UI minted a short-lived one-time token.
 * Bootstrap path: first mailbox on a single-workspace instance.
 * Why bootstrap exists: staff login is Magic Link, and Magic Link mail
 * needs this mailbox — requiring an admin session here is a deadlock.
 */
async function resolveProvisionTarget(
  setupToken: string | undefined
): Promise<{ target: ProvisionTarget } | { error: string; status: number }> {
  if (setupToken) {
    const provisioningData = provisioningCache.consumeToken(setupToken);
    if (!provisioningData) {
      return { error: 'Setup token is invalid or has expired', status: 403 };
    }
    return {
      target: {
        tenantId: provisioningData.tenantId,
        workspaceId: provisioningData.workspaceId,
      },
    };
  }

  const workspaces = await prisma.workspace.findMany({
    select: { id: true, tenantId: true },
    take: 2,
  });

  // Single-workspace instances may create or refresh the mailbox without a token.
  // The script posts here after Entra setup; a dead token UI must not block that.
  if (workspaces.length !== 1) {
    return {
      error: 'Bootstrap provision requires exactly one workspace. Sign in and save the mailbox under Admin, or pass a setup token.',
      status: 403,
    };
  }

  return {
    target: {
      tenantId: workspaces[0].tenantId,
      workspaceId: workspaces[0].id,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = ProvisionPayloadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: validation.error.issues[0]?.message || 'Invalid parameters',
        },
        { status: 400 }
      );
    }

    const { setupToken, mailboxAddress, msTenantId, clientId, clientSecret } = validation.data;
    const resolved = await resolveProvisionTarget(setupToken);
    if ('error' in resolved) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: resolved.error,
        },
        { status: resolved.status }
      );
    }

    const { tenantId, workspaceId } = resolved.target;
    const encryptedSecret = encryptSecret(clientSecret, tenantId);

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        tenantId,
      },
    });

    if (!workspace) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: 'Workspace is invalid or does not belong to the tenant',
        },
        { status: 403 }
      );
    }

    const config = await prisma.mailboxConfig.upsert({
      where: {
        workspaceId,
      },
      update: {
        mailboxAddress,
        clientId,
        clientSecret: encryptedSecret,
        msTenantId,
        isActive: true,
      },
      create: {
        tenantId,
        workspaceId,
        mailboxAddress,
        clientId,
        clientSecret: encryptedSecret,
        msTenantId,
        isActive: true,
      },
    });

    console.info(
      `[mailboxProvision] Bound ${config.mailboxAddress} to workspace ${workspaceId} (${setupToken ? 'token' : 'bootstrap'})`
    );

    return NextResponse.json<ApiResponse<ProvisionedMailbox>>(
      {
        success: true,
        data: {
          id: config.id,
          mailboxAddress: config.mailboxAddress,
          message: 'Mailbox configuration successfully provisioned.',
        },
        error: null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Provisioning error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        data: null,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
