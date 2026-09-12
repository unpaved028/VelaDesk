import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getPortalSession } from '@/lib/services/getPortalSession';
import { requireAgentContext } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

async function sessionTenantId(): Promise<string | null> {
  const portal = await getPortalSession();
  if (portal.authenticated && portal.session) return portal.session.tenantId;
  const staff = await requireAgentContext();
  if (staff.ok) return staff.ctx.tenantId;
  return null;
}

export async function GET() {
  const tenantId = await sessionTenantId();
  if (!tenantId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId },
    select: { logoMime: true, logoData: true },
  });
  if (!tenant?.logoMime || !tenant.logoData) {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(new Uint8Array(tenant.logoData), {
    status: 200,
    headers: {
      'Content-Type': tenant.logoMime,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
