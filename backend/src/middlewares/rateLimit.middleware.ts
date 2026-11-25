import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Terlalu banyak permintaan dari IP Anda, silakan coba lagi nanti.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'AUTH_RATE_LIMITED',
    message: 'Terlalu banyak percobaan autentikasi, coba lagi dalam 15 menit.',
  },
});

export const aiAndToolsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'TOOL_RATE_LIMITED',
    message: 'Batas penggunaan fitur AI & Downloader tercapai, tunggu sebentar.',
  },
});
