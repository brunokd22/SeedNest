import { z } from 'zod';

export const createNurserySchema = z.object({
  name:              z.string(),
  description:       z.string().optional(),
  address:           z.string(),
  latitude:          z.number().optional(),
  longitude:         z.number().optional(),
  coverImageUrl:     z.string().optional(),
  operatingHours:    z.string().optional(),
  lowStockThreshold: z.number().int().optional(),
  careReminderDays:  z.number().int().optional(),
});

export const updateNurserySchema = createNurserySchema.partial();

export type CreateNurseryInput = z.infer<typeof createNurserySchema>;
export type UpdateNurseryInput = z.infer<typeof updateNurserySchema>;
