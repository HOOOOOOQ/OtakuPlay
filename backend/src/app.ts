import path from 'path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { isDatabaseConnected } from './config/database';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { globalLimiter } from './middlewares/rateLimit.middleware';
import apiRouter from './routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.corsOriginList.length === 0 || env.corsOriginList.includes(origin)) {
          callback(null, true);
          return;
        }
        if (env.NODE_ENV !== 'production') {
          callback(null, true);
          return;
        }
        callback(new Error('Origin tidak diizinkan oleh CORS'));
      },
      credentials: true,
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
      })
    );
  }

  app.use('/api', globalLimiter);

  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  app.use('/uploads', express.static(uploadDir));

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      service: 'otakuplay-backend',
      database: isDatabaseConnected() ? 'connected' : 'disconnected',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
