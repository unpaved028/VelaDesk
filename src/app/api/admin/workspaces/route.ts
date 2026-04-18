import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ success: false, data: null, error: "Tenant ID required" }, { status: 400 });
  }

  try {
    const workspaces = await prisma.workspace.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, data: workspaces, error: null });
  } catch (error) {
    return NextResponse.json({ success: false, data: null, error: "Database error" }, { status: 500 });
  }
}
