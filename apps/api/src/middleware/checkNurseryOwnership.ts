import type { Nursery } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ForbiddenError, NotFoundError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      nursery?: Nursery;
    }
  }
}

export async function checkNurseryOwnership(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const nurseryId = req.params.nurseryId as string;
    const nursery = await prisma.nursery.findUnique({ where: { id: nurseryId } });
    if (!nursery) {
      next(new NotFoundError('Nursery not found'));
      return;
    }
    if (nursery.managerId !== req.user!.id) {
      next(new ForbiddenError('Not your nursery'));
      return;
    }
    req.nursery = nursery;
    next();
  } catch (err) {
    next(err);
  }
}
