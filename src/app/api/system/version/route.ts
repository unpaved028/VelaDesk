import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Force Node.js runtime
export const runtime = 'nodejs';
// Revalidate every 60 seconds (or 0 to always fetch)
export const revalidate = 60;

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { id: 'global' },
      select: { appVersion: true },
    });
    return NextResponse.json({
      success: true,
      data: { appVersion: config?.appVersion || '0.1.0' },
      error: null
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching DB version:', error);
    return NextResponse.json({
      success: false,
      data: null,
      error: 'Failed to fetch DB version'
    }, { status: 500 });
  }
}
