import { NextFunction, Request, Response } from 'express';
import { AnimeBookmark, AnimeRating, WatchHistory } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { animeService } from '../services/anime.service';
import {
  awardXp,
  checkAndUnlockAchievement,
  XP_REWARDS,
} from '../services/gamification.service';
import { BadRequestError } from '../utils/errors';
import { getPagination, sendSuccess } from '../utils/response';

export async function searchAnime(req: Request, res: Response, next: NextFunction) {
  try {
    const q = String(req.query.q || req.query.search || '').trim();
    if (!q) throw new BadRequestError('Query pencarian anime (q) diperlukan');
    const data = await animeService.search(q);
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getAnimeDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const url = String(req.query.url || req.query.details || '').trim();
    if (!url) throw new BadRequestError('Parameter url anime diperlukan');
    const data = await animeService.getDetails(url);
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getOngoingAnime(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const data = await animeService.getCategoryList('ongoing', page);
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getCompletedAnime(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const data = await animeService.getCategoryList('completed', page);
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getPopularAnime(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const data = await animeService.getCategoryList('popular', page);
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getAnimeSchedule(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await animeService.getSchedule();
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getAnimeStream(req: Request, res: Response, next: NextFunction) {
  try {
    const episodeUrl = String(req.query.url || req.query.stream || '').trim();
    if (!episodeUrl) throw new BadRequestError('Parameter url episode diperlukan');
    const data = await animeService.getStream(episodeUrl);
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function upsertAnimeBookmark(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { animeUrl, title, image, type, watchStatus, isFavorite } = req.body;
    const doc = await AnimeBookmark.findOneAndUpdate(
      { userId: req.user!.id, animeUrl },
      {
        $set: {
          title,
          ...(image !== undefined ? { image } : {}),
          ...(type !== undefined ? { type } : {}),
          ...(watchStatus !== undefined ? { watchStatus } : {}),
          ...(isFavorite !== undefined ? { isFavorite } : {}),
        },
      },
      { upsert: true, new: true }
    );
    return sendSuccess(res, doc, 200, 'Bookmark anime diperbarui');
  } catch (err) {
    return next(err);
  }
}

export async function getMyAnimeBookmarks(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = { userId: req.user!.id };
    if (req.query.favorite === 'true') filter.isFavorite = true;
    if (req.query.status) filter.watchStatus = req.query.status;

    const [items, total] = await Promise.all([
      AnimeBookmark.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      AnimeBookmark.countDocuments(filter),
    ]);
    return sendSuccess(res, items, 200, undefined, { page, limit, total });
  } catch (err) {
    return next(err);
  }
}

export async function recordWatchHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const {
      animeUrl,
      animeTitle,
      animeImage,
      episodeNumber,
      episodeTitle,
      episodeUrl,
      positionSeconds,
      durationSeconds,
      completed,
    } = req.body;

    const doc = await WatchHistory.findOneAndUpdate(
      { userId: req.user!.id, animeUrl, episodeUrl },
      {
        $set: {
          animeTitle,
          animeImage,
          episodeNumber,
          episodeTitle,
          positionSeconds,
          durationSeconds,
          completed,
          watchedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
    return sendSuccess(res, doc);
  } catch (err) {
    return next(err);
  }
}

export async function getWatchHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
    const [items, total] = await Promise.all([
      WatchHistory.find({ userId: req.user!.id })
        .sort({ watchedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WatchHistory.countDocuments({ userId: req.user!.id }),
    ]);
    return sendSuccess(res, items, 200, undefined, { page, limit, total });
  } catch (err) {
    return next(err);
  }
}

export async function rateAnime(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { animeUrl, animeTitle, score, review } = req.body;

    let ratingDoc = await AnimeRating.findOne({ userId: req.user!.id, animeUrl });
    let shouldRewardXp = false;

    if (!ratingDoc) {
      shouldRewardXp = Boolean(review && review.trim().length >= 15);
      ratingDoc = await AnimeRating.create({
        userId: req.user!.id,
        animeUrl,
        animeTitle,
        score,
        review,
        xpRewarded: shouldRewardXp,
      });
    } else {
      ratingDoc.score = score;
      if (review !== undefined) ratingDoc.review = review;
      if (!ratingDoc.xpRewarded && review && review.trim().length >= 15) {
        ratingDoc.xpRewarded = true;
        shouldRewardXp = true;
      }
      await ratingDoc.save();
    }

    if (shouldRewardXp) {
      await awardXp(req.user!.id, XP_REWARDS.ANIME_REVIEW, 'Ulasan Anime');
      await checkAndUnlockAchievement(req.user!.id, 'ANIME_CRITIC');
    }

    return sendSuccess(res, ratingDoc, 200, 'Rating anime disimpan');
  } catch (err) {
    return next(err);
  }
}

export async function getAnimeRatings(req: Request, res: Response, next: NextFunction) {
  try {
    const animeUrl = String(req.query.animeUrl || '').trim();
    if (!animeUrl) throw new BadRequestError('Parameter animeUrl diperlukan');
    const items = await AnimeRating.find({ animeUrl })
      .populate('userId', 'username displayName avatarUrl isVerified level')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const avg =
      items.length > 0
        ? Number((items.reduce((acc, item) => acc + item.score, 0) / items.length).toFixed(1))
        : null;

    return sendSuccess(res, { averageScore: avg, totalReviews: items.length, reviews: items });
  } catch (err) {
    return next(err);
  }
}
