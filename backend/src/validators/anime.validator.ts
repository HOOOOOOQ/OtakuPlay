import { z } from 'zod';

export const animeBookmarkSchema = z.object({
  animeUrl: z.string().url('URL anime tidak valid'),
  title: z.string().min(1).max(300),
  image: z.string().optional(),
  type: z.string().optional(),
  watchStatus: z
    .enum(['plan_to_watch', 'watching', 'completed', 'dropped'])
    .optional(),
  isFavorite: z.boolean().optional(),
});

export const watchHistorySchema = z.object({
  animeUrl: z.string().min(1),
  animeTitle: z.string().min(1).max(300),
  animeImage: z.string().optional(),
  episodeNumber: z.string().min(1),
  episodeTitle: z.string().min(1),
  episodeUrl: z.string().min(1),
  positionSeconds: z.number().min(0).default(0),
  durationSeconds: z.number().min(0).default(0),
  completed: z.boolean().optional().default(false),
});

export const animeRatingSchema = z.object({
  animeUrl: z.string().min(1),
  animeTitle: z.string().min(1).max(300),
  score: z.number().min(1).max(10),
  review: z.string().max(2000).optional(),
});

export const tiktokResolveSchema = z.object({
  url: z
    .string()
    .url('URL TikTok tidak valid')
    .refine(
      (val) =>
        val.includes('tiktok.com') || val.includes('vt.tiktok.com') || val.includes('vm.tiktok.com'),
      'URL harus berasal dari domain TikTok yang sah'
    ),
});
