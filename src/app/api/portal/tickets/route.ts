import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getPortalSession } from '@/lib/services/getPortalSession';
import { ApiResponse } from '@/types/api';
import { Ticket } from '@prisma/client';

export async function GET() {
  try {
    const { authenticated, session } = await getPortalSession();
    
    // Strict multi-tenancy layer
    if (!authenticated || !session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // DLP: Hard filter by tenantId and requesterId (email)
    const tickets = await prisma.ticket.findMany({
      where: {
        tenantId: session.tenantId,
        requesterId: session.email,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        workspace: {
          select: {
            name: true,
          }
        }
      }
    });

    return NextResponse.json<ApiResponse<Ticket[]>>(
      {
        success: true,
        data: tickets,
        error: null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: errorMessage },
      { status: 500 }
    );
  }
}
