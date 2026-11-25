import { z } from 'zod';

export const googleLoginSchema = z.object({
  idToken: z.string().min(20, 'Google ID Token tidak valid'),
  deviceName: z.string().max(80).optional(),
  platform: z.enum(['android', 'ios', 'web']).optional().default('android'),
});

export const registerSchema = z.object({
  email: z.string().email('Format email tidak valid').toLowerCase(),
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore')
    .toLowerCase(),
  displayName: z.string().min(2).max(50),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(128, 'Password maksimal 128 karakter'),
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Email atau username diperlukan'),
  password: z.string().min(1, 'Password diperlukan'),
  deviceName: z.string().max(80).optional(),
  platform: z.enum(['android', 'ios', 'web']).optional().default('android'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20, 'Refresh token diperlukan'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Token reset password tidak valid'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter').max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini diperlukan'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter').max(128),
});

export const changeEmailRequestSchema = z.object({
  newEmail: z.string().email('Format email baru tidak valid').toLowerCase(),
});

export const changeEmailVerifySchema = z.object({
  token: z.string().min(10, 'Token verifikasi email tidak valid'),
});
