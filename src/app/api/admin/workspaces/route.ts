import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdminContext } from '@/lib/auth/session';

export async function GET() {
  const admin = await requireAdminContext();
  if (!admin.ok) {
    return NextResponse.json({ success: false, data: null, error: admin.error }, { status: 401 });
  }

  try {
    const workspaces = await prisma.workspace.findMany({
      where: { tenantId: admin.ctx.tenantId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: workspaces, error: null });
  } catch {
    return NextResponse.json({ success: false, data: null, error: 'Database error' }, { status: 500 });
  }
}
