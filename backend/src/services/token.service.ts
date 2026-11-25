import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';

export interface AccessTokenPayload {
  sub: string;
  role: string;
  sessionId: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  familyId: string;
  jti: string;
  type: 'refresh';
}

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID || undefined);

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: 'otakuplay',
  };
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: 'otakuplay',
  };
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'otakuplay',
    }) as AccessTokenPayload;
    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Token akses tidak valid');
    }
    return decoded;
  } catch {
    throw new UnauthorizedError('Token akses tidak valid atau kedaluwarsa');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'otakuplay',
    }) as RefreshTokenPayload;
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Refresh token tidak valid');
    }
    return decoded;
  } catch {
    throw new UnauthorizedError('Refresh token tidak valid atau kedaluwarsa');
  }
}

export async function verifyGoogleIdToken(idToken: string) {
  const audiences = [env.GOOGLE_CLIENT_ID, env.GOOGLE_WEB_CLIENT_ID].filter(Boolean);
  if (audiences.length === 0) {
    throw new UnauthorizedError('Google Client ID belum dikonfigurasi di server');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: audiences,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email || !payload.email_verified) {
    throw new UnauthorizedError('Token Google tidak valid atau email belum terverifikasi');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    displayName: payload.name || payload.email.split('@')[0],
    avatarUrl: payload.picture || '',
  };
}
