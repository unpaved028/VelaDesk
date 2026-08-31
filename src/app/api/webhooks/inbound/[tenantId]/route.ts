import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { decryptSecret } from '@/lib/services/encryption';
import { applyRmmAlert } from '@/lib/services/rmmTicketMapper';
import { extractInboundToken } from '@/lib/webhooks/inboundAuth';
import { parseRmmPayload } from '@/lib/webhooks/rmmPayload';
import { timingSafeEqualString } from '@/lib/webhooks/timingSafe';
import { getErrorMessage } from '@/lib/errors';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    if (!tenantId) {
      return NextResponse.json({ success: false, data: null, error: 'tenantId required.' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, domain: true, inboundWebhookSecret: true },
    });
    if (!tenant?.inboundWebhookSecret) {
      return NextResponse.json({ success: false, data: null, error: 'Unauthorized.' }, { status: 401 });
    }

    const presented = extractInboundToken(request);
    if (!presented) {
      return NextResponse.json({ success: false, data: null, error: 'Unauthorized.' }, { status: 401 });
    }

    const expected = decryptSecret(tenant.inboundWebhookSecret, tenant.id);
    if (!timingSafeEqualString(presented, expected)) {
      return NextResponse.json({ success: false, data: null, error: 'Unauthorized.' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, data: null, error: 'Invalid JSON.' }, { status: 400 });
    }

    const parsed = parseRmmPayload(body);
    if ('error' in parsed) {
      return NextResponse.json({ success: false, data: null, error: parsed.error }, { status: 400 });
    }

    const result = await applyRmmAlert(tenant.id, tenant.domain, parsed);
    return NextResponse.json({ success: true, data: result, error: null }, { status: result.action === 'created' ? 201 : 200 });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    const status = message.includes('No open ticket') ? 404 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}
