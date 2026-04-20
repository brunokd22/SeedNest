import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

type Target = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      res.status(400).json({ error: result.error.flatten() });
      return;
    }
    req[target] = result.data;
    next();
  };
}
