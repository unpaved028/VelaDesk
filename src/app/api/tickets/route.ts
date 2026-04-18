import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ApiResponse } from '@/types/api';
import { Ticket } from '@prisma/client';
import { TenantIdSchema, createErrorResponse } from '@/lib/validation/schemas';
import { ZodError } from 'zod';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantIdParam = searchParams.get('tenantId');

    // 11.1: Standardized Validation using Zod
    const validation = TenantIdSchema.safeParse(tenantIdParam);
    
    if (!validation.success) {
      return NextResponse.json<ApiResponse<null>>(
        createErrorResponse(validation.error.issues[0]?.message || 'Invalid parameters'),
        { status: 400 }
      );
    }

    const tenantId = validation.data;

    // Reason for this query: Multi-Tenancy isolation.
    // Every query MUST be filtered by tenantId according to 02-data-and-tenancy.md SOP.
    const tickets = await prisma.ticket.findMany({
      where: {
        tenantId: tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        assignedAgent: true,
        workspace: true,
      },
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
    let statusCode = 500;

    if (error instanceof ZodError) {
      errorMessage = error.issues[0]?.message || 'Validation Error';
      statusCode = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json<ApiResponse<null>>(
      createErrorResponse(errorMessage),
      { status: statusCode }
    );
  }
}
