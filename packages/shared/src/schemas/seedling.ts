import { z } from 'zod';
import { SeedlingSize, AvailabilityStatus } from '../types/nursery';

export const createSeedlingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  description: z.string().max(5000).trim().optional(),
  categoryId: z.string().optional(),
  size: z.nativeEnum(SeedlingSize),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().nonnegative('Quantity cannot be negative'),
  availabilityStatus: z.nativeEnum(AvailabilityStatus).default(AvailabilityStatus.AVAILABLE),
  photos: z.array(z.string().url()).max(5, 'Maximum 5 photos').default([]),
});

export const updateSeedlingSchema = createSeedlingSchema.partial();

export type CreateSeedlingInput = z.infer<typeof createSeedlingSchema>;
export type UpdateSeedlingInput = z.infer<typeof updateSeedlingSchema>;
