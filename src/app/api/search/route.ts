import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ApiResponse } from '@/types/api';
import { createErrorResponse } from '@/lib/validation/schemas';

export interface GlobalSearchResult {
  type: 'TICKET' | 'USER' | 'ASSET';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const tenantIdParam = searchParams.get('tenantId');

    if (!query || query.trim().length < 2) {
      return NextResponse.json<ApiResponse<GlobalSearchResult[]>>(
        { success: true, data: [], error: null },
        { status: 200 }
      );
    }

    const searchTerm = query.trim();

    // Replicate authentication context logic (simulated for MVP)
    let currentTenantId = tenantIdParam;
    if (!currentTenantId) {
      const firstTenant = await prisma.tenant.findFirst();
      if (!firstTenant) {
        return NextResponse.json<ApiResponse<null>>(
          createErrorResponse('No active tenant found'),
          { status: 400 }
        );
      }
      currentTenantId = firstTenant.id;
    }

    // Check if the query is numeric (to search by Ticket ID)
    const isNumeric = /^\d+$/.test(searchTerm);
    const numericQuery = isNumeric ? parseInt(searchTerm, 10) : undefined;

    // Build the query promises for parallel execution (Performance requirement)
    // IMPORTANT: SOP-02 enforces tenantId limitation on EVERY query!
    
    const ticketPromise = prisma.ticket.findMany({
      where: {
        tenantId: currentTenantId,
        OR: [
          ...(numericQuery ? [{ id: numericQuery }] : []),
          { subject: { contains: searchTerm } }
        ]
      },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    const userPromise = prisma.user.findMany({
      where: {
        tenantId: currentTenantId,
        OR: [
          { name: { contains: searchTerm } },
          { email: { contains: searchTerm } }
        ]
      },
      take: 5,
      orderBy: { name: 'asc' }
    });

    const assetPromise = prisma.asset.findMany({
      where: {
        tenantId: currentTenantId,
        OR: [
          { name: { contains: searchTerm } },
          { type: { contains: searchTerm } }
        ]
      },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    // Run searches concurrently
    const [tickets, users, assets] = await Promise.all([
      ticketPromise,
      userPromise,
      assetPromise
    ]);

    // Format results to a unified interface
    const results: GlobalSearchResult[] = [];

    tickets.forEach(ticket => {
      results.push({
        type: 'TICKET',
        id: ticket.id.toString(),
        title: ticket.subject,
        subtitle: `Ticket #${ticket.id} • ${ticket.status}`,
        url: `/admin/tickets/${ticket.id}`
      });
    });

    users.forEach(user => {
      results.push({
        type: 'USER',
        id: user.id,
        title: user.name,
        subtitle: user.email,
        url: `/admin/users/${user.id}`
      });
    });

    assets.forEach(asset => {
      results.push({
        type: 'ASSET',
        id: asset.id,
        title: asset.name,
        subtitle: `${asset.type} • ${asset.status}`,
        url: `/admin/assets/${asset.id}`
      });
    });

    return NextResponse.json<ApiResponse<GlobalSearchResult[]>>(
        { success: true, data: results, error: null },
        { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json<ApiResponse<null>>(
      createErrorResponse(message),
      { status: 500 }
    );
  }
}
