import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'idToken',
      'refreshToken',
      'accessToken',
    ],
    censor: '[REDACTED]',
  },
  base: {
    service: 'otakuplay-backend',
    env: env.NODE_ENV,
  },
});
