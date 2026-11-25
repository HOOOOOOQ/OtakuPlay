import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken, Session, User } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
  generateRandomToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyGoogleIdToken,
  verifyRefreshToken,
} from '../services/token.service';
import { grantDailyLoginXp } from '../services/gamification.service';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { logger } from '../config/logger';

async function generateUniqueUsername(base: string): Promise<string> {
  const sanitized =
    base
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 22) || 'otaku';

  const candidate = sanitized.length >= 3 ? sanitized : `otaku_${sanitized}`;
  const exists = await User.findOne({ username: candidate }).select('_id');
  if (!exists) return candidate;

  for (let i = 0; i < 10; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const nextCandidate = `${candidate.slice(0, 24)}_${suffix}`;
    const taken = await User.findOne({ username: nextCandidate }).select('_id');
    if (!taken) return nextCandidate;
  }
  return `otaku_${crypto.randomBytes(4).toString('hex')}`;
}

async function issueSessionAndTokens(params: {
  userId: string;
  role: string;
  deviceName?: string;
  platform?: string;
  ipAddress: string;
  userAgent: string;
}) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const session = await Session.create({
    userId: params.userId,
    deviceName: params.deviceName || 'Android Device',
    platform: params.platform || 'android',
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    isActive: true,
    lastActiveAt: new Date(),
    expiresAt,
  });

  const familyId = uuidv4();
  const jti = uuidv4();

  const accessToken = signAccessToken({
    sub: params.userId,
    role: params.role,
    sessionId: String(session._id),
  });

  const refreshToken = signRefreshToken({
    sub: params.userId,
    sessionId: String(session._id),
    familyId,
    jti,
  });

  await RefreshToken.create({
    userId: params.userId,
    sessionId: session._id,
    tokenHash: hashToken(refreshToken),
    familyId,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    sessionId: String(session._id),
  };
}

function sanitizeUser(user: InstanceType<typeof User>) {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    bio: user.bio,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    verifiedAt: user.verifiedAt,
    xp: user.xp,
    level: user.level,
    levelTitle: user.levelTitle,
    hasPassword: Boolean(user.passwordHash),
    isGoogleLinked: Boolean(user.googleId),
    privacySettings: user.privacySettings,
    createdAt: user.createdAt,
  };
}

export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { idToken, deviceName, platform } = req.body;
    const googleProfile = await verifyGoogleIdToken(idToken);

    let user = await User.findOne({
      $or: [{ googleId: googleProfile.googleId }, { email: googleProfile.email }],
    }).select('+passwordHash');

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const username = await generateUniqueUsername(
        googleProfile.email.split('@')[0] || googleProfile.displayName
      );
      user = await User.create({
        username,
        email: googleProfile.email,
        googleId: googleProfile.googleId,
        displayName: googleProfile.displayName,
        avatarUrl: googleProfile.avatarUrl,
      });
    } else {
      if (user.deletedAt) {
        throw new ForbiddenError('Akun ini telah dihapus');
      }
      if (user.status === 'banned') {
        throw new ForbiddenError('Akun Anda telah diblokir');
      }
      if (!user.googleId) {
        user.googleId = googleProfile.googleId;
      }
      if (!user.avatarUrl && googleProfile.avatarUrl) {
        user.avatarUrl = googleProfile.avatarUrl;
      }
      await user.save();
    }

    const tokens = await issueSessionAndTokens({
      userId: String(user._id),
      role: user.role,
      deviceName,
      platform,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    await grantDailyLoginXp(user._id);
    const refreshedUser = await User.findById(user._id).select('+passwordHash');

    return sendSuccess(
      res,
      {
        ...tokens,
        isNewUser,
        user: sanitizeUser(refreshedUser || user),
      },
      200,
      'Berhasil masuk dengan Google'
    );
  } catch (err) {
    return next(err);
  }
}

export async function registerWithPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, username, displayName, password } = req.body;

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (existing) {
      throw new ConflictError('Email atau username sudah digunakan');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName,
      passwordHash,
    });

    const tokens = await issueSessionAndTokens({
      userId: String(user._id),
      role: user.role,
      deviceName: req.body.deviceName || 'OtakuPlay Client',
      platform: req.body.platform || 'android',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    await grantDailyLoginXp(user._id);
    const freshUser = await User.findById(user._id).select('+passwordHash');

    return sendSuccess(
      res,
      {
        ...tokens,
        user: sanitizeUser(freshUser || user),
      },
      201,
      'Registrasi akun berhasil'
    );
  } catch (err) {
    return next(err);
  }
}

export async function loginWithPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, password, deviceName, platform } = req.body;
    const normalized = identifier.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: normalized }, { username: normalized }],
    }).select('+passwordHash');

    if (!user || user.deletedAt) {
      throw new UnauthorizedError('Kredensial tidak valid');
    }
    if (!user.passwordHash) {
      throw new BadRequestError(
        'Akun ini terdaftar menggunakan Google. Silakan masuk dengan tombol Continue with Google.'
      );
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedError('Kredensial tidak valid');
    }

    if (user.status === 'banned') {
      throw new ForbiddenError('Akun Anda diblokir');
    }
    if (user.status === 'suspended' && user.suspendedUntil && user.suspendedUntil > new Date()) {
      throw new ForbiddenError('Akun Anda sedang ditangguhkan');
    }

    const tokens = await issueSessionAndTokens({
      userId: String(user._id),
      role: user.role,
      deviceName,
      platform,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    await grantDailyLoginXp(user._id);
    const freshUser = await User.findById(user._id).select('+passwordHash');

    return sendSuccess(
      res,
      {
        ...tokens,
        user: sanitizeUser(freshUser || user),
      },
      200,
      'Login berhasil'
    );
  } catch (err) {
    return next(err);
  }
}

export async function refreshAuthToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);
    const incomingHash = hashToken(refreshToken);

    const tokenDoc = await RefreshToken.findOne({ tokenHash: incomingHash });
    if (!tokenDoc) {
      throw new UnauthorizedError('Refresh token tidak ditemukan');
    }

    if (tokenDoc.isRevoked) {
      // Token reuse detected -> revoke entire family for security
      await RefreshToken.updateMany(
        { familyId: tokenDoc.familyId },
        { $set: { isRevoked: true, revokedAt: new Date() } }
      );
      await Session.findByIdAndUpdate(tokenDoc.sessionId, { $set: { isActive: false } });
      logger.warn({ userId: tokenDoc.userId, familyId: tokenDoc.familyId }, 'Refresh token reuse detected');
      throw new UnauthorizedError('Sesi dicabut karena aktivitas token mencurigakan');
    }

    const [user, session] = await Promise.all([
      User.findById(decoded.sub),
      Session.findById(decoded.sessionId),
    ]);

    if (!user || user.deletedAt || user.status === 'banned' || !session || !session.isActive) {
      throw new UnauthorizedError('Sesi pengguna tidak aktif');
    }

    const newJti = uuidv4();
    const newAccessToken = signAccessToken({
      sub: String(user._id),
      role: user.role,
      sessionId: String(session._id),
    });
    const newRefreshToken = signRefreshToken({
      sub: String(user._id),
      sessionId: String(session._id),
      familyId: tokenDoc.familyId,
      jti: newJti,
    });
    const newHash = hashToken(newRefreshToken);

    tokenDoc.isRevoked = true;
    tokenDoc.revokedAt = new Date();
    tokenDoc.replacedByHash = newHash;
    await tokenDoc.save();

    await RefreshToken.create({
      userId: user._id,
      sessionId: session._id,
      tokenHash: newHash,
      familyId: tokenDoc.familyId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    session.lastActiveAt = new Date();
    await session.save();

    return sendSuccess(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return next(err);
  }
}

export async function logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body || {};
    if (req.user?.sessionId) {
      await Session.findByIdAndUpdate(req.user.sessionId, { $set: { isActive: false } });
      await RefreshToken.updateMany(
        { sessionId: req.user.sessionId, isRevoked: false },
        { $set: { isRevoked: true, revokedAt: new Date() } }
      );
    }
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await RefreshToken.findOneAndUpdate(
        { tokenHash },
        { $set: { isRevoked: true, revokedAt: new Date() } }
      );
    }
    return sendSuccess(res, { loggedOut: true }, 200, 'Berhasil keluar');
  } catch (err) {
    return next(err);
  }
}

export async function logoutAllDevices(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    await Promise.all([
      Session.updateMany({ userId }, { $set: { isActive: false } }),
      RefreshToken.updateMany(
        { userId, isRevoked: false },
        { $set: { isRevoked: true, revokedAt: new Date() } }
      ),
    ]);
    return sendSuccess(res, { loggedOutAll: true }, 200, 'Berhasil keluar dari semua perangkat');
  } catch (err) {
    return next(err);
  }
}

export async function getSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sessions = await Session.find({
      userId: req.user!.id,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastActiveAt: -1 })
      .lean();
    return sendSuccess(res, sessions);
  } catch (err) {
    return next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (user && user.passwordHash && !user.deletedAt) {
      const rawToken = generateRandomToken(24);
      user.passwordResetToken = hashToken(rawToken);
      user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      // In production, integrate with transactional email provider (SMTP/Resend/SES).
      logger.info({ userId: user._id }, 'Password reset token generated');
    }

    return sendSuccess(
      res,
      { requested: true },
      200,
      'Jika email terdaftar dengan kata sandi, tautan reset telah dikirim.'
    );
  } catch (err) {
    return next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body;
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +passwordHash');

    if (!user) {
      throw new BadRequestError('Token reset password tidak valid atau telah kedaluwarsa');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await Promise.all([
      Session.updateMany({ userId: user._id }, { $set: { isActive: false } }),
      RefreshToken.updateMany(
        { userId: user._id },
        { $set: { isRevoked: true, revokedAt: new Date() } }
      ),
    ]);

    return sendSuccess(res, { reset: true }, 200, 'Kata sandi berhasil diperbarui');
  } catch (err) {
    return next(err);
  }
}

export async function changePassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user!.id).select('+passwordHash');
    if (!user) throw new NotFoundError('Pengguna tidak ditemukan');

    if (!user.passwordHash) {
      throw new BadRequestError(
        'Akun Google tidak menggunakan kata sandi lokal.'
      );
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Kata sandi saat ini salah');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return sendSuccess(res, { changed: true }, 200, 'Kata sandi berhasil diubah');
  } catch (err) {
    return next(err);
  }
}

export async function requestEmailChange(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { newEmail } = req.body;
    const normalized = newEmail.toLowerCase();

    const exists = await User.findOne({ email: normalized });
    if (exists) {
      throw new ConflictError('Email tersebut sudah digunakan akun lain');
    }

    const rawToken = generateRandomToken(24);
    await User.findByIdAndUpdate(req.user!.id, {
      $set: {
        pendingEmail: normalized,
        emailVerificationToken: hashToken(rawToken),
        emailVerificationExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    logger.info({ userId: req.user!.id }, 'Email verification token generated');

    return sendSuccess(
      res,
      { pendingEmail: normalized },
      200,
      'Kode verifikasi telah dikirim ke email baru Anda'
    );
  } catch (err) {
    return next(err);
  }
}

export async function verifyEmailChange(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { token } = req.body;
    const user = await User.findOne({
      _id: req.user!.id,
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user || !user.pendingEmail) {
      throw new BadRequestError('Token verifikasi email tidak valid atau kedaluwarsa');
    }

    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return sendSuccess(res, { email: user.email }, 200, 'Email berhasil diperbarui');
  } catch (err) {
    return next(err);
  }
}
