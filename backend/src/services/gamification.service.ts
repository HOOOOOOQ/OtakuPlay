import { Types } from 'mongoose';
import { cache } from '../config/cache';
import { Achievement, Leaderboard, User, UserAchievement } from '../models';
import { createNotification } from './notification.service';

export const XP_REWARDS = {
  DAILY_LOGIN: 5,
  COMPLETE_PROFILE: 20,
  QUALITY_POST: 10,
  APPROVED_CONTRIBUTION: 5,
  ANIME_REVIEW: 15,
} as const;

export const MAX_DAILY_POST_XP_COUNT = 5;

export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  // Smooth quadratic progression: Lv5=300, Lv10=1200, Lv20=4800, Lv30=10800, Lv50=30000
  return Math.floor(12 * Math.pow(level - 1, 2) + 20 * (level - 1));
}

export function getLevelTitle(level: number): string {
  if (level >= 50) return 'Legendary Otaku';
  if (level >= 30) return 'Anime Master';
  if (level >= 20) return 'Anime Expert';
  if (level >= 10) return 'Anime Fan';
  if (level >= 5) return 'Otaku Beginner';
  return 'Newbie';
}

export function calculateLevelFromXp(xp: number): {
  level: number;
  levelTitle: string;
  currentLevelXp: number;
  nextLevelXp: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;
  while (level < 100 && safeXp >= xpRequiredForLevel(level + 1)) {
    level++;
  }
  return {
    level,
    levelTitle: getLevelTitle(level),
    currentLevelXp: xpRequiredForLevel(level),
    nextLevelXp: xpRequiredForLevel(level + 1),
  };
}

export function getPeriodKeys(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  const week = String(Math.ceil((days + startOfYear.getUTCDay() + 1) / 7)).padStart(2, '0');

  return {
    weekly: `${year}-W${week}`,
    monthly: `${year}-${month}`,
    all_time: 'ALL',
  };
}

export async function awardXp(
  userId: Types.ObjectId | string,
  amount: number,
  reason: string
): Promise<{ xp: number; level: number; levelTitle: string; leveledUp: boolean } | null> {
  if (amount <= 0) return null;

  const user = await User.findById(userId);
  if (!user || user.status === 'banned') return null;

  const previousLevel = user.level;
  const newXp = user.xp + amount;
  const { level, levelTitle } = calculateLevelFromXp(newXp);

  user.xp = newXp;
  user.level = level;
  user.levelTitle = levelTitle;
  await user.save();

  const keys = getPeriodKeys();
  await Promise.all([
    Leaderboard.findOneAndUpdate(
      { period: 'weekly', periodKey: keys.weekly, userId: user._id },
      { $inc: { xpEarned: amount } },
      { upsert: true, new: true }
    ),
    Leaderboard.findOneAndUpdate(
      { period: 'monthly', periodKey: keys.monthly, userId: user._id },
      { $inc: { xpEarned: amount } },
      { upsert: true, new: true }
    ),
    Leaderboard.findOneAndUpdate(
      { period: 'all_time', periodKey: keys.all_time, userId: user._id },
      { $inc: { xpEarned: amount } },
      { upsert: true, new: true }
    ),
  ]);

  const leveledUp = level > previousLevel;
  if (leveledUp) {
    await createNotification({
      userId: user._id,
      type: 'level_up',
      title: `Naik ke Level ${level}!`,
      body: `Selamat! Kamu mencapai Level ${level} (${levelTitle}) dari ${reason}.`,
      data: { level, levelTitle, xp: newXp },
    });
  }

  await checkAndUnlockAchievement(user._id, 'FIRST_XP');
  if (level >= 5) await checkAndUnlockAchievement(user._id, 'LEVEL_5');
  if (level >= 10) await checkAndUnlockAchievement(user._id, 'LEVEL_10');

  return { xp: newXp, level, levelTitle, leveledUp };
}

export async function checkAndUnlockAchievement(
  userId: Types.ObjectId | string,
  code: string
): Promise<void> {
  const achievement = await Achievement.findOne({ code: code.toUpperCase(), isActive: true });
  if (!achievement) return;

  const existing = await UserAchievement.findOne({
    userId,
    achievementId: achievement._id,
  });
  if (existing) return;

  await UserAchievement.create({
    userId,
    achievementId: achievement._id,
  });

  await createNotification({
    userId,
    type: 'badge_unlocked',
    title: `Badge Terbuka: ${achievement.name}`,
    body: achievement.description,
    data: { achievementCode: achievement.code, icon: achievement.icon },
  });
}

export async function grantDailyLoginXp(userId: Types.ObjectId | string): Promise<boolean> {
  const todayKey = new Date().toISOString().slice(0, 10);
  const updated = await User.findOneAndUpdate(
    { _id: userId, dailyLoginDate: { $ne: todayKey } },
    { $set: { dailyLoginDate: todayKey } },
    { new: true }
  );
  if (!updated) return false;
  await awardXp(userId, XP_REWARDS.DAILY_LOGIN, 'Login Harian');
  return true;
}

export async function canAwardPostXpToday(userId: string): Promise<boolean> {
  const todayKey = new Date().toISOString().slice(0, 10);
  const cacheKey = `xp:post_count:${userId}:${todayKey}`;
  const current = (await cache.get<number>(cacheKey)) ?? 0;
  if (current >= MAX_DAILY_POST_XP_COUNT) return false;
  await cache.set(cacheKey, current + 1, 86400);
  return true;
}
