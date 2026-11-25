import { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AuthenticatedRequest, requireRoles } from '../src/middlewares/auth.middleware';
import { hashToken, signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../src/services/token.service';

describe('JWT Token Rotation & RBAC Middleware', () => {
  it('signs and verifies access and refresh tokens', () => {
    const access = signAccessToken({ sub: 'user123', role: 'user', sessionId: 'sess1' });
    const decodedAccess = verifyAccessToken(access);
    expect(decodedAccess.sub).toBe('user123');
    expect(decodedAccess.role).toBe('user');
    expect(decodedAccess.type).toBe('access');

    const refresh = signRefreshToken({
      sub: 'user123',
      sessionId: 'sess1',
      familyId: 'fam1',
      jti: 'jti1',
    });
    const decodedRefresh = verifyRefreshToken(refresh);
    expect(decodedRefresh.familyId).toBe('fam1');
    expect(decodedRefresh.type).toBe('refresh');

    expect(hashToken(refresh)).not.toBe(refresh);
    expect(hashToken(refresh)).toHaveLength(64);
  });

  it('rejects refresh token when used as access token', () => {
    const refresh = signRefreshToken({
      sub: 'user123',
      sessionId: 'sess1',
      familyId: 'fam1',
      jti: 'jti1',
    });
    expect(() => verifyAccessToken(refresh)).toThrow();
  });

  it('enforces RBAC roles strictly via requireRoles', () => {
    const mw = requireRoles('admin', 'super_admin');
    const nextDenied = vi.fn() as unknown as NextFunction;
    mw(
      { user: { id: '1', role: 'user', sessionId: 's', username: 'u', isVerified: false } } as AuthenticatedRequest,
      {} as Response,
      nextDenied
    );
    expect(nextDenied).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));

    const nextAllowed = vi.fn() as unknown as NextFunction;
    mw(
      { user: { id: '2', role: 'super_admin', sessionId: 's', username: 'sa', isVerified: true } } as AuthenticatedRequest,
      {} as Response,
      nextAllowed
    );
    expect(nextAllowed).toHaveBeenCalledWith();
  });
});
