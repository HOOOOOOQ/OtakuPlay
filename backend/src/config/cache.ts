import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

interface CacheEntry {
  value: string;
  expiresAt: number;
}

class HybridCache {
  private redis: Redis | null = null;
  private memory = new Map<string, CacheEntry>();

  constructor() {
    if (env.REDIS_URL && env.REDIS_URL.trim().length > 0) {
      try {
        this.redis = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 2,
          lazyConnect: true,
        });
        this.redis.on('error', (err) => {
          logger.warn({ err }, 'Redis error, falling back to in-memory cache');
        });
        this.redis.connect().catch((err) => {
          logger.warn({ err }, 'Redis connect failed, using in-memory cache');
          this.redis = null;
        });
      } catch {
        this.redis = null;
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis && this.redis.status === 'ready') {
      try {
        const raw = await this.redis.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        // fallback to memory
      }
    }

    const entry = this.memory.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    const serialized = JSON.stringify(value);
    if (this.redis && this.redis.status === 'ready') {
      try {
        await this.redis.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch {
        // fallback
      }
    }
    if (this.memory.size > 2000) {
      const oldestKey = this.memory.keys().next().value;
      if (oldestKey) this.memory.delete(oldestKey);
    }
    this.memory.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.redis && this.redis.status === 'ready') {
      try {
        await this.redis.del(key);
      } catch {
        // ignore
      }
    }
    this.memory.delete(key);
  }

  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
    }
    this.memory.clear();
  }
}

export const cache = new HybridCache();
