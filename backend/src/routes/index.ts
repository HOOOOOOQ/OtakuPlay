import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes, { verificationRouter } from './user.routes';
import animeRoutes from './anime.routes';
import communityRoutes, { reportsRouter, uploadsRouter } from './community.routes';
import chatRoutes from './chat.routes';
import adminRoutes from './admin.routes';
import {
  achievementsRouter,
  leaderboardRouter,
  notificationsRouter,
} from './gamification.routes';
import { aiRouter, contentRouter, newsRouter, toolsRouter } from './tools.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/users', achievementsRouter);
apiRouter.use('/verification', verificationRouter);
apiRouter.use('/anime', animeRoutes);
apiRouter.use('/posts', communityRoutes);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/uploads', uploadsRouter);
apiRouter.use('/conversations', chatRoutes);
apiRouter.use('/leaderboard', leaderboardRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/news', newsRouter);
apiRouter.use('/tools', toolsRouter);
apiRouter.use('/content', contentRouter);
apiRouter.use('/admin', adminRoutes);

export default apiRouter;
