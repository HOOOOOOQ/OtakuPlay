import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 20,
  });
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
