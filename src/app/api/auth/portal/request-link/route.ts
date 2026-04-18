import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateMagicLink } from '@/lib/services/magicLink';
import { ApiResponse } from '@/types/api';

/**
 * POST /api/auth/portal/request-link
 * Body: { email: string }
 *
 * Looks up the customer's email in the database, generates a Magic Link,
 * and (in production) would send it via email. For now, we log the link
 * to the server console for testing purposes.
 *
 * SECURITY: We always return success to the client, even if the email
 * is not found in the DB. This prevents email enumeration attacks.
 * The Magic Link is only generated if the email matches a known customer.
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

    // Look up the customer by email to get their tenantId
    // Check both Customer and User models (agents can also have portal access)
    const customer = await prisma.customer.findFirst({
      where: { email },
      select: { tenantId: true },
    });

    if (customer) {
      // Customer found — generate and "send" the magic link
      const result = await generateMagicLink({
        email,
        tenantId: customer.tenantId,
      });

      // TODO (v0.8.7+): Send actual email via Graph API or SMTP
      // For now, log the URL to server console for testing
      console.log(`\n🔗 [MAGIC LINK] Generated for ${email}:`);
      console.log(`   ${result.magicLinkUrl}`);
      console.log(`   Expires: ${result.expiresAt.toISOString()}\n`);
    } else {
      // Email not found — do NOT reveal this to the client (anti-enumeration).
      // Log for debugging and monitoring potential abuse attempts.
      console.log(`⚠️ [MAGIC LINK] Request for unknown email: ${email}`);
    }

    // Always return success to prevent email enumeration attacks.
    // The user sees "Check your email" regardless of whether the email exists.
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
