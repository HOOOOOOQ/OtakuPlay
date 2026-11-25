import http from 'http';
import { createApp } from './app';
import { cache } from './config/cache';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './config/logger';
import { runMigrations } from './config/migration';
import { initSocketServer } from './sockets/chat.socket';

async function bootstrap() {
  try {
    await connectDatabase();
    await runMigrations();
  } catch (err) {
    logger.warn(
      { err },
      'MongoDB connection/migration skipped or failed at startup; running in degraded mode until MongoDB is reachable'
    );
  }

  const app = createApp();
  const server = http.createServer(app);
  const io = initSocketServer(server);

  server.listen(env.PORT, env.HOST, () => {
    logger.info({ port: env.PORT, host: env.HOST }, 'OtakuPlay Backend API & Socket.IO listening');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully...');
    io.close();
    server.close(async () => {
      await cache.close();
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
