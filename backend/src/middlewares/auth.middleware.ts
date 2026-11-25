import { NextFunction, Request, Response } from 'express';
import { Session, User, UserRole } from '../models';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { verifyAccessToken } from '../services/token.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    sessionId: string;
    username: string;
    isVerified: boolean;
  };
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim() || null;
}

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new UnauthorizedError('Header Authorization Bearer diperlukan');
    }

    const decoded = verifyAccessToken(token);
    const [user, session] = await Promise.all([
      User.findById(decoded.sub).select('role status suspendedUntil username isVerified deletedAt'),
      Session.findById(decoded.sessionId).select('isActive expiresAt'),
    ]);

    if (!user || user.deletedAt) {
      throw new UnauthorizedError('Akun tidak ditemukan');
    }
    if (user.status === 'banned') {
      throw new ForbiddenError('Akun Anda telah diblokir permanen');
    }
    if (user.status === 'suspended' && user.suspendedUntil && user.suspendedUntil > new Date()) {
      throw new ForbiddenError('Akun Anda sedang ditangguhkan sementara');
    }
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Sesi telah berakhir, silakan masuk kembali');
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      sessionId: String(session._id),
      username: user.username,
      isVerified: user.isVerified,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).select('role status username isVerified deletedAt');
    if (user && !user.deletedAt && user.status === 'active') {
      req.user = {
        id: String(user._id),
        role: user.role,
        sessionId: decoded.sessionId,
        username: user.username,
        isVerified: user.isVerified,
      };
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Autentikasi diperlukan'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Akses ditolak untuk peran Anda'));
    }
    return next();
  };
}
