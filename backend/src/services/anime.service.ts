import axios, { AxiosInstance } from 'axios';
import { cache } from '../config/cache';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { BadRequestError, UpstreamServiceError } from '../utils/errors';

export interface AnimeListItem {
  title: string;
  link: string;
  image: string | null;
  latestEpisode: string | null;
  type: string | null;
  rating: string | null;
}

export interface AnimeEpisodeItem {
  episode: string;
  title: string;
  episodeUrl: string;
  date: string | null;
}

export interface AnimeDetailsData {
  title: string;
  image: string | null;
  info: Record<string, unknown>;
  genres: string[];
  sinopsis: string;
  rating: string | null;
  totalEpisodes: string | number | null;
  episodes: AnimeEpisodeItem[];
  url: string;
}

export type StreamFormat = 'mp4' | 'hls' | 'embed' | 'external' | 'unavailable';

export interface StreamResolution {
  streamUrl: string | null;
  alternativeLinks: Array<{ label: string; url: string }>;
  episodeInfo: {
    title: string;
    heading: string;
  };
  format: StreamFormat;
  isDirectPlayable: boolean;
  requiresExternalOrWebFallback: boolean;
  availabilityMessage: string;
}

function normalizeNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'n/a') return null;
  return str;
}

function isValidHttpUrl(raw: unknown): raw is string {
  if (typeof raw !== 'string' || !raw.trim()) return false;
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function detectStreamFormat(url: string | null): {
  format: StreamFormat;
  isDirectPlayable: boolean;
  requiresExternalOrWebFallback: boolean;
} {
  if (!url || !isValidHttpUrl(url)) {
    return {
      format: 'unavailable',
      isDirectPlayable: false,
      requiresExternalOrWebFallback: true,
    };
  }

  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mkv')) {
    return {
      format: 'mp4',
      isDirectPlayable: true,
      requiresExternalOrWebFallback: false,
    };
  }
  if (lower.endsWith('.m3u8')) {
    return {
      format: 'hls',
      isDirectPlayable: true,
      requiresExternalOrWebFallback: false,
    };
  }
  if (lower.includes('embed') || lower.includes('player') || lower.includes('iframe')) {
    return {
      format: 'embed',
      isDirectPlayable: false,
      requiresExternalOrWebFallback: true,
    };
  }
  return {
    format: 'external',
    isDirectPlayable: false,
    requiresExternalOrWebFallback: true,
  };
}

function parseAnimeListItem(raw: Record<string, unknown>): AnimeListItem {
  return {
    title: String(raw.title || 'Tanpa Judul'),
    link: String(raw.link || raw.url || ''),
    image: normalizeNullableString(raw.image),
    latestEpisode: normalizeNullableString(raw.latestEpisode ?? raw.episode),
    type: normalizeNullableString(raw.type),
    rating: normalizeNullableString(raw.rating),
  };
}

function parseAlternativeLinks(raw: unknown): Array<{ label: string; url: string }> {
  if (!Array.isArray(raw)) return [];
  const results: Array<{ label: string; url: string }> = [];
  for (const item of raw) {
    if (typeof item === 'string' && isValidHttpUrl(item)) {
      results.push({ label: 'Alternatif Resmi', url: item });
    } else if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const url = obj.url || obj.link || obj.streamUrl;
      if (isValidHttpUrl(url)) {
        results.push({
          label: String(obj.label || obj.server || obj.quality || obj.name || 'Server Alternatif'),
          url,
        });
      }
    }
  }
  return results;
}

export class AnimeService {
  private client: AxiosInstance;

  constructor(client?: AxiosInstance) {
    this.client =
      client ||
      axios.create({
        baseURL: env.ANIMASU_BASE_URL,
        timeout: 12000,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OtakuPlay-Backend/1.0',
        },
      });
  }

  private async requestWithRetry<T>(
    params: Record<string, string | number>,
    retries = 2
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await this.client.get<Record<string, unknown>>('', { params });
        if (res.status < 200 || res.status >= 300 || !res.data) {
          throw new UpstreamServiceError('Respons API Animasu kosong atau tidak valid');
        }
        const body = res.data;
        if (body.status === false || body.success === false) {
          throw new UpstreamServiceError(
            String(body.message || 'API Animasu mengembalikan status gagal')
          );
        }
        return (body.data ?? body) as T;
      } catch (err) {
        lastError = err;
        const axiosErr = err as { response?: { status?: number }; code?: string };
        const status = axiosErr.response?.status;
        const retryable = !status || status >= 500 || axiosErr.code === 'ECONNABORTED';
        if (!retryable || attempt === retries) {
          break;
        }
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
      }
    }

    logger.error({ err: lastError, params }, 'Animasu API request failed');
    if (lastError instanceof UpstreamServiceError) throw lastError;
    throw new UpstreamServiceError('Gagal mengambil data anime dari penyedia');
  }

  async search(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new BadRequestError('Kata kunci pencarian anime tidak boleh kosong');
    }
    const cacheKey = `anime:search:${trimmed.toLowerCase()}`;
    const cached = await cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const raw = await this.requestWithRetry<Record<string, unknown>>({ search: trimmed });
    const rawResults = Array.isArray(raw.results) ? raw.results : [];
    const formatted = {
      query: String(raw.query || trimmed),
      total: Number(raw.total ?? rawResults.length),
      results: rawResults.map((item) => parseAnimeListItem((item || {}) as Record<string, unknown>)),
    };

    await cache.set(cacheKey, formatted, 300);
    return formatted;
  }

  async getCategoryList(category: 'ongoing' | 'completed' | 'popular', page = 1) {
    const safePage = Math.max(1, page);
    const cacheKey = `anime:${category}:p${safePage}`;
    const cached = await cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const raw = await this.requestWithRetry<Record<string, unknown>>({
      [category]: 1,
      page: safePage,
    });
    const list = Array.isArray(raw.animeList) ? raw.animeList : [];
    const formatted = {
      page: Number(raw.page ?? safePage),
      total: Number(raw.total ?? list.length),
      animeList: list.map((item) => parseAnimeListItem((item || {}) as Record<string, unknown>)),
    };

    await cache.set(cacheKey, formatted, 300);
    return formatted;
  }

  async getDetails(animeUrl: string): Promise<AnimeDetailsData> {
    if (!isValidHttpUrl(animeUrl)) {
      throw new BadRequestError('Parameter URL anime tidak valid');
    }
    const cacheKey = `anime:details:${animeUrl}`;
    const cached = await cache.get<AnimeDetailsData>(cacheKey);
    if (cached) return cached;

    const raw = await this.requestWithRetry<Record<string, unknown>>({ details: animeUrl });
    const rawEpisodes = Array.isArray(raw.episodes) ? raw.episodes : [];
    const genres = Array.isArray(raw.genres)
      ? raw.genres.map((g) => String(g)).filter(Boolean)
      : [];

    const formatted: AnimeDetailsData = {
      title: String(raw.title || 'Tanpa Judul'),
      image: normalizeNullableString(raw.image),
      info: raw.info && typeof raw.info === 'object' ? (raw.info as Record<string, unknown>) : {},
      genres,
      sinopsis: String(raw.sinopsis || 'Sinopsis belum tersedia.'),
      rating: normalizeNullableString(raw.rating),
      totalEpisodes:
        raw.totalEpisodes !== undefined && raw.totalEpisodes !== null
          ? (raw.totalEpisodes as string | number)
          : rawEpisodes.length || null,
      episodes: rawEpisodes.map((ep) => {
        const obj = (ep || {}) as Record<string, unknown>;
        return {
          episode: String(obj.episode ?? ''),
          title: String(obj.title ?? `Episode ${obj.episode ?? ''}`),
          episodeUrl: String(obj.episodeUrl ?? ''),
          date: normalizeNullableString(obj.date),
        };
      }),
      url: String(raw.url || animeUrl),
    };

    await cache.set(cacheKey, formatted, 600);
    return formatted;
  }

  async getSchedule() {
    const cacheKey = 'anime:schedule';
    const cached = await cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const raw = await this.requestWithRetry<Record<string, unknown>>({ schedule: 1 });
    const rawSchedule =
      raw.schedule && typeof raw.schedule === 'object'
        ? (raw.schedule as Record<string, unknown>)
        : {};

    // Dynamic parsing because day group names from upstream can vary
    const scheduleGroups: Array<{ day: string; items: AnimeListItem[] }> = [];
    for (const [dayKey, value] of Object.entries(rawSchedule)) {
      const items = Array.isArray(value)
        ? value.map((item) => parseAnimeListItem((item || {}) as Record<string, unknown>))
        : [];
      scheduleGroups.push({ day: dayKey, items });
    }

    const formatted = {
      totalDays: Number(raw.totalDays ?? scheduleGroups.length),
      schedule: rawSchedule,
      groups: scheduleGroups,
    };

    await cache.set(cacheKey, formatted, 900);
    return formatted;
  }

  async getStream(episodeUrl: string): Promise<StreamResolution> {
    if (!isValidHttpUrl(episodeUrl)) {
      throw new BadRequestError('Parameter URL episode tidak valid');
    }
    const cacheKey = `anime:stream:${episodeUrl}`;
    const cached = await cache.get<StreamResolution>(cacheKey);
    if (cached) return cached;

    const raw = await this.requestWithRetry<Record<string, unknown>>({ stream: episodeUrl });
    const rawStreamUrl = normalizeNullableString(raw.streamUrl);
    const validStreamUrl = isValidHttpUrl(rawStreamUrl) ? rawStreamUrl : null;
    const alternativeLinks = parseAlternativeLinks(raw.alternativeLinks);
    const epInfo =
      raw.episodeInfo && typeof raw.episodeInfo === 'object'
        ? (raw.episodeInfo as Record<string, unknown>)
        : {};

    const detection = detectStreamFormat(validStreamUrl);

    let availabilityMessage = 'Stream siap diputar.';
    if (!validStreamUrl) {
      availabilityMessage =
        alternativeLinks.length > 0
          ? 'Stream langsung tidak tersedia. Gunakan tautan alternatif resmi yang tersedia.'
          : 'Sumber stream tidak tersedia untuk episode ini.';
    } else if (!detection.isDirectPlayable) {
      availabilityMessage =
        'Sumber video berupa pemutar eksternal/embed. Gunakan tampilan web resmi atau tautan alternatif.';
    }

    const formatted: StreamResolution = {
      streamUrl: validStreamUrl,
      alternativeLinks,
      episodeInfo: {
        title: String(epInfo.title || 'Episode'),
        heading: String(epInfo.heading || epInfo.title || 'Pemutar Anime'),
      },
      format: detection.format,
      isDirectPlayable: detection.isDirectPlayable,
      requiresExternalOrWebFallback: detection.requiresExternalOrWebFallback,
      availabilityMessage,
    };

    await cache.set(cacheKey, formatted, 180);
    return formatted;
  }
}

export const animeService = new AnimeService();
