import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  APP_URL: z.string().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/otakuplay'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default('dev-only-otakuplay-access-secret-change-me'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default('dev-only-otakuplay-refresh-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_WEB_CLIENT_ID: z.string().default(''),
  REDIS_URL: z.string().optional().default(''),
  ANIMASU_BASE_URL: z.string().default('https://api.nexadev.my.id/animasu'),
  SNAPTIK_BASE_URL: z.string().default('https://api.nexadev.my.id/api/snaptik/'),
  OTAKU_AI_BASE_URL: z.string().default('https://api.nexadev.my.id/ai/chatgptpro'),
  KOMPAS_NEWS_URL: z.string().default('https://api.nexadev.my.id/api/kompasnews'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(25),
  UPLOAD_DIR: z.string().default('uploads'),
  SUPER_ADMIN_EMAIL: z.string().email().default('admin@otakuplay.app'),
  SUPER_ADMIN_USERNAME: z.string().default('otaku_admin'),
  SUPER_ADMIN_PASSWORD: z.string().default('ChangeMeStrongPassword123!'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOriginList: parsed.data.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
