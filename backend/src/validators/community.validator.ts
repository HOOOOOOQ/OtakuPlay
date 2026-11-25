import { z } from 'zod';

export const createPostSchema = z.object({
  caption: z.string().min(1, 'Caption tidak boleh kosong').max(2000),
  mediaUrl: z.string().max(1000).optional(),
  mediaType: z.enum(['none', 'image', 'video']).default('none'),
  thumbnailUrl: z.string().max(1000).optional(),
  hashtags: z.array(z.string().max(40)).max(15).optional(),
  animeReference: z
    .object({
      title: z.string().max(200),
      url: z.string().max(500),
    })
    .optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Komentar tidak boleh kosong').max(1000),
  parentId: z.string().optional(),
});

export const createReportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user', 'message']),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(200),
  details: z.string().max(1000).optional(),
});
