import { NextFunction, Request, Response } from 'express';

// Stubs — full implementation in Spec 1.5
export function requireAuth(_req: Request, _res: Response, next: NextFunction) {
  next();
}

export function requireRole(..._roles: string[]) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
}
