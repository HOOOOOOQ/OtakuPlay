import { Router } from 'express';
import {
  getAnimeDetails,
  getAnimeRatings,
  getAnimeSchedule,
  getAnimeStream,
  getCompletedAnime,
  getMyAnimeBookmarks,
  getOngoingAnime,
  getPopularAnime,
  getWatchHistory,
  rateAnime,
  recordWatchHistory,
  searchAnime,
  upsertAnimeBookmark,
} from '../controllers/anime.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
  animeBookmarkSchema,
  animeRatingSchema,
  watchHistorySchema,
} from '../validators/anime.validator';

const router = Router();

router.get('/search', searchAnime);
router.get('/details', getAnimeDetails);
router.get('/ongoing', getOngoingAnime);
router.get('/completed', getCompletedAnime);
router.get('/popular', getPopularAnime);
router.get('/schedule', getAnimeSchedule);
router.get('/stream', getAnimeStream);

router.get('/bookmarks', authenticate, getMyAnimeBookmarks);
router.post('/bookmarks', authenticate, validateBody(animeBookmarkSchema), upsertAnimeBookmark);

router.get('/history', authenticate, getWatchHistory);
router.post('/history', authenticate, validateBody(watchHistorySchema), recordWatchHistory);

router.get('/ratings', getAnimeRatings);
router.post('/ratings', authenticate, validateBody(animeRatingSchema), rateAnime);

export default router;
