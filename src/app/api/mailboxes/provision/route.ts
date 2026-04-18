import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';
import { provisioningCache } from '@/lib/services/provisioningCache';
import { encryptSecret } from '@/lib/services/encryption';

// Schema validation for the incoming payload
const ProvisionPayloadSchema = z.object({
  setupToken: z.string().min(1, 'Setup token is required'),
  mailboxAddress: z.string().email('Invalid email address'),
  msTenantId: z.string().min(1, 'Microsoft Tenant ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate payload structure
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

    // 2. Validate token against the memory cache
    const provisioningData = provisioningCache.consumeToken(setupToken);
    
    if (!provisioningData) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: 'Setup token is invalid or has expired',
        },
        { status: 403 }
      );
    }

    const { tenantId, workspaceId } = provisioningData;

    // 3. Encrypt the secret according to SOP-05! (VERY IMPORTANT)
    const encryptedSecret = encryptSecret(clientSecret, tenantId);

    // 4. Create or Update the MailboxConfig
    // Enforcing tenant isolation by querying workspace ownership first
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        tenantId: tenantId
      }
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

    // Upsert the Mailbox Config
    const config = await prisma.mailboxConfig.upsert({
      where: {
        workspaceId: workspaceId,
      },
      update: {
        mailboxAddress,
        clientId,
        clientSecret: encryptedSecret, // Using the encrypted one
        msTenantId,
        isActive: true, // Auto-activate
      },
      create: {
        tenantId,
        workspaceId,
        mailboxAddress,
        clientId,
        clientSecret: encryptedSecret,
        msTenantId,
        isActive: true,
      }
    });

    return NextResponse.json<ApiResponse<any>>(
      {
        success: true,
        data: {
          id: config.id,
          mailboxAddress: config.mailboxAddress,
          message: 'Mailbox configuration successfully provisioned.'
        },
        error: null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Provisioning error:', error);
    let errorMessage = 'Internal Server Error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }

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
