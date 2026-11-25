import { NextFunction, Request, Response } from 'express';
import {
  Achievement,
  Leaderboard,
  Notification,
  User,
  UserAchievement,
} from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getPeriodKeys } from '../services/gamification.service';
import { getPagination, sendSuccess } from '../utils/response';

export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const periodParam = String(req.query.period || 'all_time');
    const period =
      periodParam === 'weekly' || periodParam === 'monthly' ? periodParam : 'all_time';
    const keys = getPeriodKeys();
    const periodKey = keys[period];

    if (period === 'all_time') {
      const topUsers = await User.find({ deletedAt: null, status: 'active' })
        .select('username displayName avatarUrl isVerified level levelTitle xp')
        .sort({ xp: -1 })
        .limit(50)
        .lean();

      const ranked = topUsers.map((u, idx) => ({
        rank: idx + 1,
        userId: String(u._id),
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        isVerified: u.isVerified,
        level: u.level,
        levelTitle: u.levelTitle,
        xp: u.xp,
      }));

      return sendSuccess(res, { period, periodKey, entries: ranked });
    }

    const entries = await Leaderboard.find({ period, periodKey })
      .populate('userId', 'username displayName avatarUrl isVerified level levelTitle xp status deletedAt')
      .sort({ xpEarned: -1 })
      .limit(50)
      .lean();

    const ranked = entries
      .filter((e) => {
        const u = e.userId as unknown as Record<string, unknown> | null;
        return u && !u.deletedAt && u.status === 'active';
      })
      .map((e, idx) => {
        const u = e.userId as unknown as Record<string, unknown>;
        return {
          rank: idx + 1,
          userId: String(u._id),
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          isVerified: u.isVerified,
          level: u.level,
          levelTitle: u.levelTitle,
          xp: e.xpEarned,
          totalXp: u.xp,
        };
      });

    return sendSuccess(res, { period, periodKey, entries: ranked });
  } catch (err) {
    return next(err);
  }
}

export async function getMyAchievements(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const [allAchievements, unlocked] = await Promise.all([
      Achievement.find({ isActive: true }).sort({ category: 1, threshold: 1 }).lean(),
      UserAchievement.find({ userId: req.user!.id }).lean(),
    ]);

    const unlockedMap = new Map(
      unlocked.map((u) => [String(u.achievementId), u.unlockedAt])
    );

    const items = allAchievements.map((ach) => ({
      ...ach,
      unlocked: unlockedMap.has(String(ach._id)),
      unlockedAt: unlockedMap.get(String(ach._id)) || null,
    }));

    return sendSuccess(res, items);
  } catch (err) {
    return next(err);
  }
}

export async function getNotifications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, 50);
    const [items, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user!.id })
        .populate('actorId', 'username displayName avatarUrl isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: req.user!.id }),
      Notification.countDocuments({ userId: req.user!.id, isRead: false }),
    ]);

    return sendSuccess(res, { items, unreadCount }, 200, undefined, { page, limit, total });
  } catch (err) {
    return next(err);
  }
}

export async function markNotificationRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return sendSuccess(res, { read: true });
  } catch (err) {
    return next(err);
  }
}

export async function markAllNotificationsRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await Notification.updateMany(
      { userId: req.user!.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return sendSuccess(res, { readAll: true });
  } catch (err) {
    return next(err);
  }
}
