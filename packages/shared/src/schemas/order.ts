import { z } from 'zod';
import { FulfillmentStatus } from '../types/order';

export const createWalkinOrderSchema = z.object({
  nurseryId:  z.string(),
  items:      z.array(z.object({ seedlingId: z.string(), quantity: z.number().int().positive() })),
  guestName:  z.string().optional(),
  customerId: z.string().optional(),
  notes:      z.string().optional(),
});

export const updateFulfillmentSchema = z.object({
  fulfillmentStatus: z.nativeEnum(FulfillmentStatus),
});

export type CreateWalkinOrderInput = z.infer<typeof createWalkinOrderSchema>;
export type UpdateFulfillmentInput = z.infer<typeof updateFulfillmentSchema>;
