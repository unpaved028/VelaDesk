import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { resolveMagicLinkAudience } from '@/lib/auth/bootstrapAuth';
import { readStaffBootstrapEnabled } from '@/lib/auth/entraConfig';
import { generateMagicLink } from '@/lib/services/magicLink';
import { ApiResponse } from '@/types/api';

/**
 * POST /api/auth/portal/request-link
 * Body: { email: string }
 *
 * Looks up Customer and User rows. Portal customers always get a Magic Link.
 * Staff (SUPER_ADMIN/ADMIN/AGENT) get one only while Entra SSO is not configured.
 *
 * SECURITY: Always return success to the client to prevent email enumeration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body?.email?.toLowerCase()?.trim();

    if (!email) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Email address is required.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const [customer, user, staffBootstrapEnabled] = await Promise.all([
      prisma.customer.findFirst({
        where: { email },
        select: { tenantId: true },
      }),
      prisma.user.findFirst({
        where: { email },
        select: { tenantId: true, role: true },
      }),
      readStaffBootstrapEnabled(),
    ]);

    const audience = resolveMagicLinkAudience({
      staffBootstrapEnabled,
      userRole: user?.role ?? null,
      hasCustomerRecord: Boolean(customer),
    });
    const tenantId = user?.tenantId ?? customer?.tenantId;

    if (audience !== 'none' && tenantId) {
      const result = await generateMagicLink({
        email,
        tenantId,
      });

      // TODO: Send actual email via Graph API or SMTP.
      // First-run has no mail yet — the URL is in the application log.
      console.log(`\n🔗 [MAGIC LINK] Generated for ${email} (${audience}):`);
      console.log(`   ${result.magicLinkUrl}`);
      console.log(`   Expires: ${result.expiresAt.toISOString()}\n`);
    } else {
      console.log(`⚠️ [MAGIC LINK] Request for unknown or SSO-only email: ${email}`);
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'If an account exists for this email, a magic link has been sent.' },
      error: null,
    };
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error in request-link:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: 'An unexpected error occurred. Please try again.',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
