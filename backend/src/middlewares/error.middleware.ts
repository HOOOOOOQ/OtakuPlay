import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { AppError } from '../utils/errors';

export function notFoundHandler(req: Request, res: Response): Response {
  return res.status(404).json({
    success: false,
    code: 'ROUTE_NOT_FOUND',
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validasi input gagal',
      details: err.flatten().fieldErrors,
    });
  }

  const mongooseErr = err as { code?: number; name?: string; message?: string };
  if (mongooseErr?.code === 11000) {
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE_KEY',
      message: 'Data yang dimasukkan sudah terdaftar',
    });
  }

  if (mongooseErr?.name === 'CastError') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: 'Format ID tidak valid',
    });
  }

  logger.error({ err, path: req.originalUrl, method: req.method }, 'Unhandled server error');

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Terjadi kesalahan internal pada server',
  });
}
