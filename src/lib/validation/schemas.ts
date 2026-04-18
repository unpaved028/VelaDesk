import { z } from 'zod';

// Ticket Status Enums matching Prisma
export const TicketStatusSchema = z.enum(['OPEN', 'PENDING', 'RESOLVED', 'CLOSED']);

// Priority Enums
export const TicketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// Message Type Enums
export const MessageTypeSchema = z.enum(['PUBLIC', 'INTERNAL']);

// Tenant ID Schema (UUID or numeric? Looking at lib/db/prisma we use number/int for IDs but tenant might be UUID)
// Let's use a generic string for now as it's passed via query params.
export const TenantIdSchema = z.string().min(1, "Tenant ID is required");

export const TicketIdSchema = z.coerce.number().int().positive();

// Schema for submitting a ticket reply
export const SubmitReplySchema = z.object({
  ticketId: TicketIdSchema,
  body: z.string().min(1, "Message cannot be empty").max(5000, "Message is too long"),
  type: MessageTypeSchema,
});

// Schema for updating ticket status
export const UpdateStatusSchema = z.object({
  ticketId: TicketIdSchema,
  status: TicketStatusSchema,
});

// Response helper
export function createErrorResponse(message: string): { success: false; data: null; error: string } {
  return {
    success: false,
    data: null,
    error: message,
  };
}

// Asset Validation Schemas
export const AssetIdSchema = z.string().cuid();

export const CreateAssetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  status: z.string().min(1, "Status is required"),
  serialNumber: z.string().optional().nullable(),
  warrantyExpires: z.coerce.date().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});

export const UpdateAssetSchema = CreateAssetSchema.partial().extend({
  id: AssetIdSchema,
});
