import { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { AuthUser, UserRole } from '@seednest/shared';
import { auth } from '../config/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const u = session.user as Record<string, unknown>;
  req.user = {
    id:            u.id as string,
    name:          u.name as string,
    email:         u.email as string,
    role:          ((u.role as string) ?? UserRole.CUSTOMER) as UserRole,
    image:         (u.image as string | null) ?? null,
    createdAt:     new Date(u.createdAt as string | Date),
    emailVerified: u.emailVerified as boolean,
  };

  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
