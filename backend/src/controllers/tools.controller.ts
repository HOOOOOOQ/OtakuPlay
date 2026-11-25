import { NextFunction, Request, Response } from 'express';
import { Announcement } from '../models';
import { externalService } from '../services/external.service';
import { BadRequestError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export async function chatWithOtakuAi(req: Request, res: Response, next: NextFunction) {
  try {
    const q = String(req.query.q || req.body?.q || '').trim();
    if (!q) throw new BadRequestError('Parameter q diperlukan');
    const result = await externalService.askOtakuAi(q);
    return sendSuccess(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function getLatestNews(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await externalService.getKompasNews();
    return sendSuccess(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function resolveTikTokDownload(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await externalService.resolveTikTok(req.body.url);
    return sendSuccess(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function getPublicContentHighlights(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const now = new Date();
    const items = await Announcement.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ priority: -1, createdAt: -1 })
      .limit(30)
      .lean();

    return sendSuccess(res, {
      banners: items.filter((i) => i.kind === 'banner'),
      announcements: items.filter((i) => i.kind === 'announcement'),
      featuredAnime: items.filter((i) => i.kind === 'featured_anime'),
      newsHighlights: items.filter((i) => i.kind === 'news_highlight'),
    });
  } catch (err) {
    return next(err);
  }
}
