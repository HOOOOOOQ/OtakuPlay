import { z } from 'zod';

export const createConversationSchema = z.object({
  type: z.enum(['private', 'group']),
  recipientId: z.string().optional(),
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(300).optional(),
  avatarUrl: z.string().max(500).optional(),
  participantIds: z.array(z.string()).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().max(4000).default(''),
  attachmentUrl: z.string().max(1000).optional(),
  attachmentType: z.enum(['none', 'image']).default('none'),
  replyToId: z.string().optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(300).optional(),
  avatarUrl: z.string().max(500).optional(),
});
