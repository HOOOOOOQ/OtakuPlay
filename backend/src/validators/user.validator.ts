import { z } from 'zod';

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore')
    .toLowerCase()
    .optional(),
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().max(500).optional(),
  coverUrl: z.string().max(500).optional(),
  privacySettings: z
    .object({
      showOnlineStatus: z.boolean().optional(),
      allowPrivateMessages: z.enum(['everyone', 'followers', 'nobody']).optional(),
      showWatchHistory: z.boolean().optional(),
    })
    .optional(),
});

export const verificationRequestSchema = z.object({
  fullName: z.string().min(2).max(100),
  category: z
    .enum(['creator', 'community_leader', 'cosplayer', 'reviewer', 'other'])
    .default('creator'),
  reason: z.string().min(20, 'Jelaskan alasan minimal 20 karakter').max(1000),
  portfolioLinks: z.array(z.string().url()).max(5).optional().default([]),
});
