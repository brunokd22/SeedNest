import { z } from 'zod';
import { SeedlingSize, AvailabilityStatus } from '../types/nursery';

export const createSeedlingSchema = z.object({
  name:               z.string(),
  description:        z.string().optional(),
  categoryId:         z.string().optional(),
  size:               z.nativeEnum(SeedlingSize),
  price:              z.number().positive(),
  quantity:           z.number().int().nonnegative(),
  availabilityStatus: z.nativeEnum(AvailabilityStatus),
  photos:             z.array(z.string().url()).max(5),
});

export const updateSeedlingSchema = createSeedlingSchema.partial();

export type CreateSeedlingInput = z.infer<typeof createSeedlingSchema>;
export type UpdateSeedlingInput = z.infer<typeof updateSeedlingSchema>;
