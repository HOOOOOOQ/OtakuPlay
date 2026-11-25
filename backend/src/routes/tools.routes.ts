import { Router } from 'express';
import {
  chatWithOtakuAi,
  getLatestNews,
  getPublicContentHighlights,
  resolveTikTokDownload,
} from '../controllers/tools.controller';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';
import { aiAndToolsLimiter } from '../middlewares/rateLimit.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { tiktokResolveSchema } from '../validators/anime.validator';

export const aiRouter = Router();
aiRouter.get('/chat', optionalAuth, aiAndToolsLimiter, chatWithOtakuAi);
aiRouter.post('/chat', authenticate, aiAndToolsLimiter, chatWithOtakuAi);

export const newsRouter = Router();
newsRouter.get('/', getLatestNews);

export const toolsRouter = Router();
toolsRouter.post(
  '/tiktok/resolve',
  optionalAuth,
  aiAndToolsLimiter,
  validateBody(tiktokResolveSchema),
  resolveTikTokDownload
);

export const contentRouter = Router();
contentRouter.get('/highlights', getPublicContentHighlights);
