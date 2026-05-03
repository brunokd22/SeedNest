import { z } from 'zod';
import { IssueType } from '../types/issue';

export const createIssueSchema = z.object({
  title:       z.string(),
  description: z.string(),
  type:        z.nativeEnum(IssueType),
  orderId:     z.string().optional(),
  seedlingId:  z.string().optional(),
  nurseryId:   z.string(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1),
});

export type CreateIssueInput   = z.infer<typeof createIssueSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
