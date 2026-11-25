import { NextFunction, Response } from 'express';
import {
  AnimeBookmark,
  Follow,
  Post,
  RefreshToken,
  Session,
  User,
  UserAchievement,
  VerificationRequest,
  WatchHistory,
} from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
  awardXp,
  calculateLevelFromXp,
  checkAndUnlockAchievement,
  XP_REWARDS,
} from '../services/gamification.service';
import { createNotification } from '../services/notification.service';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { getPagination, sendSuccess } from '../utils/response';

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.id).select('+passwordHash');
    if (!user || user.deletedAt) throw new NotFoundError('Pengguna tidak ditemukan');

    const [followersCount, followingCount, postsCount, watchCount, favorites, badges] =
      await Promise.all([
        Follow.countDocuments({ followingId: user._id }),
        Follow.countDocuments({ followerId: user._id }),
        Post.countDocuments({ authorId: user._id, isDeleted: false }),
        WatchHistory.countDocuments({ userId: user._id }),
        AnimeBookmark.find({ userId: user._id, isFavorite: true }).limit(20).lean(),
        UserAchievement.find({ userId: user._id }).populate('achievementId').lean(),
      ]);

    const levelProgress = calculateLevelFromXp(user.xp);

    return sendSuccess(res, {
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
      levelProgress,
      hasPassword: Boolean(user.passwordHash),
      isGoogleLinked: Boolean(user.googleId),
      privacySettings: user.privacySettings,
      stats: {
        followersCount,
        followingCount,
        postsCount,
        watchCount,
      },
      favoriteAnime: favorites,
      achievements: badges.map((b) => ({
        unlockedAt: b.unlockedAt,
        achievement: b.achievementId,
      })),
      createdAt: user.createdAt,
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.id);
    if (!user || user.deletedAt) throw new NotFoundError('Pengguna tidak ditemukan');

    const { username, displayName, bio, avatarUrl, coverUrl, privacySettings } = req.body;

    if (username && username.toLowerCase() !== user.username) {
      const taken = await User.findOne({ username: username.toLowerCase() });
      if (taken) throw new ConflictError('Username sudah digunakan');
      user.username = username.toLowerCase();
    }

    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (coverUrl !== undefined) user.coverUrl = coverUrl;
    if (privacySettings) {
      user.privacySettings = {
        ...user.privacySettings,
        ...privacySettings,
      };
    }

    const isProfileComplete = Boolean(user.displayName && user.bio && user.avatarUrl);
    let rewardedProfileXp = false;
    if (isProfileComplete && !user.profileCompletedRewarded) {
      user.profileCompletedRewarded = true;
      rewardedProfileXp = true;
    }

    await user.save();

    if (rewardedProfileXp) {
      await awardXp(user._id, XP_REWARDS.COMPLETE_PROFILE, 'Melengkapi Profil');
      await checkAndUnlockAchievement(user._id, 'PROFILE_COMPLETE');
    }

    const updated = await User.findById(user._id).lean();
    return sendSuccess(res, updated, 200, 'Profil berhasil diperbarui');
  } catch (err) {
    return next(err);
  }
}

export async function deleteMyAccount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('Pengguna tidak ditemukan');

    user.deletedAt = new Date();
    user.status = 'banned';
    user.email = `deleted_${user._id}@deleted.otakuplay.local`;
    user.username = `deleted_${String(user._id).slice(-10)}`;
    user.googleId = undefined;
    user.passwordHash = undefined;
    await user.save();

    await Promise.all([
      Session.updateMany({ userId }, { $set: { isActive: false } }),
      RefreshToken.updateMany({ userId }, { $set: { isRevoked: true, revokedAt: new Date() } }),
    ]);

    return sendSuccess(res, { deleted: true }, 200, 'Akun Anda telah dihapus secara permanen');
  } catch (err) {
    return next(err);
  }
}

export async function getUserByUsername(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const username = String(req.params.username).toLowerCase();
    const user = await User.findOne({ username, deletedAt: null }).lean();
    if (!user) throw new NotFoundError('Pengguna tidak ditemukan');

    const [followersCount, followingCount, postsCount, watchCount, favorites, badges, isFollowing] =
      await Promise.all([
        Follow.countDocuments({ followingId: user._id }),
        Follow.countDocuments({ followerId: user._id }),
        Post.countDocuments({ authorId: user._id, isDeleted: false }),
        user.privacySettings?.showWatchHistory
          ? WatchHistory.countDocuments({ userId: user._id })
          : Promise.resolve(0),
        AnimeBookmark.find({ userId: user._id, isFavorite: true }).limit(12).lean(),
        UserAchievement.find({ userId: user._id }).populate('achievementId').lean(),
        req.user
          ? Follow.exists({ followerId: req.user.id, followingId: user._id })
          : Promise.resolve(null),
      ]);

    return sendSuccess(res, {
      id: String(user._id),
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      bio: user.bio,
      isVerified: user.isVerified,
      verifiedAt: user.verifiedAt,
      xp: user.xp,
      level: user.level,
      levelTitle: user.levelTitle,
      isOnline: user.privacySettings?.showOnlineStatus ? user.isOnline : false,
      lastSeen: user.privacySettings?.showOnlineStatus ? user.lastSeen : null,
      isFollowing: Boolean(isFollowing),
      stats: {
        followersCount,
        followingCount,
        postsCount,
        watchCount,
      },
      favoriteAnime: favorites,
      achievements: badges.map((b) => b.achievementId),
      createdAt: user.createdAt,
    });
  } catch (err) {
    return next(err);
  }
}

export async function searchUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const q = String(req.query.q || '').trim();
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, 30);

    const filter: Record<string, unknown> = { deletedAt: null, status: 'active' };
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .select('username displayName avatarUrl isVerified level levelTitle xp')
        .sort({ xp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, items, 200, undefined, { page, limit, total });
  } catch (err) {
    return next(err);
  }
}

export async function followUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const targetId = req.params.id;
    const followerId = req.user!.id;

    if (targetId === followerId) {
      throw new BadRequestError('Tidak dapat mengikuti diri sendiri');
    }

    const target = await User.findById(targetId);
    if (!target || target.deletedAt) throw new NotFoundError('Pengguna tidak ditemukan');

    const existing = await Follow.findOne({ followerId, followingId: targetId });
    if (!existing) {
      await Follow.create({ followerId, followingId: targetId });
      await createNotification({
        userId: target._id,
        actorId: followerId,
        type: 'new_follower',
        title: 'Pengikut Baru',
        body: `@${req.user!.username} mulai mengikuti kamu.`,
        data: { username: req.user!.username },
      });
    }

    return sendSuccess(res, { following: true }, 200, 'Berhasil mengikuti pengguna');
  } catch (err) {
    return next(err);
  }
}

export async function unfollowUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await Follow.deleteOne({ followerId: req.user!.id, followingId: req.params.id });
    return sendSuccess(res, { following: false }, 200, 'Berhenti mengikuti pengguna');
  } catch (err) {
    return next(err);
  }
}

export async function blockUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const targetId = req.params.id;
    if (targetId === req.user!.id) {
      throw new BadRequestError('Tidak dapat memblokir diri sendiri');
    }

    await Promise.all([
      User.findByIdAndUpdate(req.user!.id, { $addToSet: { blockedUsers: targetId } }),
      Follow.deleteMany({
        $or: [
          { followerId: req.user!.id, followingId: targetId },
          { followerId: targetId, followingId: req.user!.id },
        ],
      }),
    ]);

    return sendSuccess(res, { blocked: true }, 200, 'Pengguna berhasil diblokir');
  } catch (err) {
    return next(err);
  }
}

export async function unblockUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await User.findByIdAndUpdate(req.user!.id, { $pull: { blockedUsers: req.params.id } });
    return sendSuccess(res, { blocked: false }, 200, 'Blokir pengguna dibuka');
  } catch (err) {
    return next(err);
  }
}

export async function muteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await User.findByIdAndUpdate(req.user!.id, { $addToSet: { mutedUsers: req.params.id } });
    return sendSuccess(res, { muted: true }, 200, 'Pengguna dibisukan');
  } catch (err) {
    return next(err);
  }
}

export async function requestVerification(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) throw new NotFoundError('Pengguna tidak ditemukan');
    if (user.isVerified) {
      throw new ConflictError('Akun Anda sudah terverifikasi');
    }

    const pending = await VerificationRequest.findOne({
      userId: user._id,
      status: 'pending',
    });
    if (pending) {
      throw new ConflictError('Permohonan verifikasi Anda masih menunggu peninjauan admin');
    }

    const doc = await VerificationRequest.create({
      userId: user._id,
      fullName: req.body.fullName,
      category: req.body.category,
      reason: req.body.reason,
      portfolioLinks: req.body.portfolioLinks,
    });

    return sendSuccess(res, doc, 201, 'Permohonan verifikasi berhasil diajukan');
  } catch (err) {
    return next(err);
  }
}

export async function getVerificationStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const [user, latestRequest] = await Promise.all([
      User.findById(req.user!.id).select('isVerified verifiedAt verifiedBy').lean(),
      VerificationRequest.findOne({ userId: req.user!.id }).sort({ createdAt: -1 }).lean(),
    ]);

    return sendSuccess(res, {
      isVerified: Boolean(user?.isVerified),
      verifiedAt: user?.verifiedAt || null,
      latestRequest: latestRequest || null,
    });
  } catch (err) {
    return next(err);
  }
}
