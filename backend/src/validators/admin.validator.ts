import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  role: z.enum(['user', 'moderator', 'admin', 'super_admin']).optional(),
  suspendedDays: z.number().int().min(1).max(365).optional(),
  banReason: z.string().max(300).optional(),
  isVerified: z.boolean().optional(),
});

export const reviewVerificationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().max(500).optional(),
});

export const resolveReportSchema = z.object({
  status: z.enum(['reviewing', 'resolved', 'dismissed']),
  resolutionNote: z.string().max(500).optional(),
  deleteTargetContent: z.boolean().optional().default(false),
});

export const createContentSchema = z.object({
  kind: z.enum(['announcement', 'banner', 'featured_anime', 'news_highlight']),
  title: z.string().min(2).max(160),
  body: z.string().min(2).max(1500),
  imageUrl: z.string().max(500).optional(),
  targetUrl: z.string().max(500).optional(),
  priority: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
});
