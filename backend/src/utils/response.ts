import { Response } from 'express';

export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
  meta?: Record<string, unknown>
): Response {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function getPagination(query: Record<string, unknown>, maxLimit = 50) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
