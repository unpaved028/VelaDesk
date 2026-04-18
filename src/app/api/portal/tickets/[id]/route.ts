import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getPortalSession } from '@/lib/services/getPortalSession';
import { ApiResponse } from '@/types/api';
import { Ticket } from '@prisma/client';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { authenticated, session } = await getPortalSession();
    
    // Strict multi-tenancy layer
    if (!authenticated || !session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const params = await context.params;
    const ticketId = parseInt(params.id, 10);

    if (isNaN(ticketId)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: 'Invalid ID' }, 
        { status: 400 }
      );
    }

    // DLP: Hard filter by tenantId, requesterId (email), and only public messages
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        tenantId: session.tenantId,
        requesterId: session.email,
      },
      include: {
        workspace: {
          select: {
            name: true,
          }
        },
        messages: {
          where: {
            isInternal: false, // DLP: Only PUBLIC messages
          },
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            body: true,
            createdAt: true,
            authorId: true,
            isInternal: true,
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: 'Ticket not found or unauthorized' }, 
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Ticket>>(
      {
        success: true,
        data: ticket,
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
