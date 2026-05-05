import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import {
  generatePresignedUploadUrl,
  deleteFile,
} from '../services/upload.service';

const router = Router();

const CONTENT_TYPE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const presignSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  folder: z.enum(['seedlings', 'nurseries']),
});

const deleteSchema = z.object({
  key: z.string().min(1),
});

router.post(
  '/presign',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = presignSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
    }

    const { contentType, folder } = parsed.data;
    const ext = CONTENT_TYPE_EXT[contentType];
    const key = `${folder}/${req.user!.id}/${Date.now()}-${uuidv4()}.${ext}`;

    const { uploadUrl, publicUrl } = await generatePresignedUploadUrl({ key, contentType });

    res.json({ success: true, data: { uploadUrl, publicUrl, key } });
  }),
);

router.delete(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = deleteSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
    }

    const { key } = parsed.data;

    const validFolders = ['seedlings/', 'nurseries/'];
    if (!validFolders.some((prefix) => key.startsWith(prefix))) {
      throw new AppError('Invalid file key', 400);
    }

    const keyParts = key.split('/');
    if (keyParts.length < 2 || keyParts[1] !== req.user!.id) {
      throw new AppError('Not authorised to delete this file', 403);
    }

    await deleteFile(key);

    res.json({ success: true, data: { message: 'File deleted' } });
  }),
);

export default router;
