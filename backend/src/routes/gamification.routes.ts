import { Router } from 'express';
import {
  getLeaderboard,
  getMyAchievements,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/gamification.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const leaderboardRouter = Router();
leaderboardRouter.get('/', getLeaderboard);

export const achievementsRouter = Router();
achievementsRouter.get('/me/achievements', authenticate, getMyAchievements);

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);
notificationsRouter.get('/', getNotifications);
notificationsRouter.patch('/:id/read', markNotificationRead);
notificationsRouter.post('/read-all', markAllNotificationsRead);
