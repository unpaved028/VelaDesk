import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { resolveMagicLinkAudience } from '@/lib/auth/bootstrapAuth';
import { readStaffBootstrapEnabled } from '@/lib/auth/entraConfig';
import { generateMagicLink } from '@/lib/services/magicLink';
import { sendMagicLinkMail } from '@/lib/services/emailSender';
import { ApiResponse } from '@/types/api';

export type MagicLinkDelivery = 'email' | 'copy' | 'none';

export interface RequestLinkResult {
  message: string;
  delivery: MagicLinkDelivery;
  magicLinkUrl: string | null;
}

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

    let delivery: MagicLinkDelivery = 'none';
    let magicLinkUrl: string | null = null;

    if (audience !== 'none' && tenantId) {
      const result = await generateMagicLink({
        email,
        tenantId,
      });

      const mailed = await sendMagicLinkMail(tenantId, email, result.magicLinkUrl);
      if (mailed === 'sent') {
        delivery = 'email';
      } else {
        // First-run has no mailbox. Returning the URL is required so staff can sign in.
        // Unknown emails still get delivery=none (anti-enumeration).
        delivery = 'copy';
        magicLinkUrl = result.magicLinkUrl;
      }

      console.log(`\n[MAGIC LINK] Generated for ${email} (${audience}, ${delivery}):`);
      console.log(`   ${result.magicLinkUrl}`);
      console.log(`   Expires: ${result.expiresAt.toISOString()}\n`);
    } else {
      console.log(`[MAGIC LINK] Request for unknown or SSO-only email: ${email}`);
    }

    const message =
      delivery === 'email'
        ? 'A sign-in link was sent to this address.'
        : delivery === 'copy'
          ? 'No mailbox is configured. Copy the sign-in link below — nothing was emailed.'
          : 'If an account exists for this address, a sign-in link can be issued. Nothing was emailed.';

    const response: ApiResponse<RequestLinkResult> = {
      success: true,
      data: { message, delivery, magicLinkUrl },
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
