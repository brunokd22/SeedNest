import { z } from 'zod';
import { UserRole } from '../types/user';

export const signUpSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
  role:     z.nativeEnum(UserRole),
});

export const signInSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
