import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../utils/errors';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        new BadRequestError('Validasi data gagal', result.error.flatten().fieldErrors)
      );
    }
    req.body = result.data;
    return next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        new BadRequestError('Parameter query tidak valid', result.error.flatten().fieldErrors)
      );
    }
    req.query = result.data as Request['query'];
    return next();
  };
}
