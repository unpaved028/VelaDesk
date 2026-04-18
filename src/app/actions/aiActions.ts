'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { TicketIdSchema, createErrorResponse } from '@/lib/validation/schemas';

export async function generateAutoSummary(ticketId: number) {
  try {
    const validation = TicketIdSchema.safeParse(ticketId);
    
    if (!validation.success) {
      return createErrorResponse('Invalid ticket ID');
    }

    const firstTenant = await prisma.tenant.findFirst();
    const currentTenantId = firstTenant?.id || '';
    if (!currentTenantId) return createErrorResponse('No active tenant found');

    const ticket = await prisma.ticket.findFirst({
      where: { 
        id: validation.data,
        tenantId: currentTenantId
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return createErrorResponse('Ticket not found');
    }

    if (ticket.messages.length <= 5) {
      return createErrorResponse('Not enough messages to generate a summary. At least 6 messages are required.');
    }

    if (!process.env.OPENAI_API_KEY) {
      return createErrorResponse('OPENAI_API_KEY is not configured');
    }

    // Prepare conversation text
    const conversationStr = ticket.messages.map(m => `[${m.createdAt.toISOString()}] ${m.isInternal ? 'Internal Note' : 'Reply'}:\n${m.body}`).join('\n\n');
    const prompt = `Bitte fasse den folgenden IT-Support-Ticket-Verlauf in einer kurzen, prägnanten Management-Summary auf Deutsch zusammen. Fokussiere dich auf:
1. Kernproblem (sachlich)
2. Bisherige Lösungsversuche
3. Aktueller Status / Blocker
    
Ticket-Verlauf:
${conversationStr}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // oder 'gpt-4o-mini', 'gpt-4o' – wir nutzen ein kleines, schnelles Modell
        messages: [
          { role: 'system', content: 'Du bist ein erfahrener IT Service Manager, der präzise interne Notizen für Support-Tickets verfasst.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      return createErrorResponse(`LLM API Error: ${errorData}`);
    }

    const aiData = await response.json();
    const summaryText = aiData.choices?.[0]?.message?.content;

    if (!summaryText) {
      return createErrorResponse('No summary generated from API');
    }

    // Save summary as internal note
    let agent = await prisma.user.findFirst({ where: { tenantId: currentTenantId, role: 'AGENT' }});
    if (!agent) return createErrorResponse('No valid agent found to author the summary');

    const message = await prisma.message.create({
      data: {
        ticketId: ticket.id,
        body: `✨ **AI Auto-Summary**\n\n${summaryText}`,
        isInternal: true,
        authorId: agent.id
      }
    });

    revalidatePath('/');
    revalidatePath(`/tickets/${ticket.id}`);
    
    return { success: true, data: message, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createErrorResponse(message);
  }
}
