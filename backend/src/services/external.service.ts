import axios, { AxiosInstance } from 'axios';
import { cache } from '../config/cache';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { BadRequestError, UpstreamServiceError } from '../utils/errors';

export interface TikTokDownloadOption {
  label: string;
  type: 'mp4_no_watermark' | 'mp4_hd' | 'mp3_audio' | 'other';
  url: string;
}

export interface TikTokResolveResult {
  author: string;
  status: boolean;
  title: string;
  thumbnail: string | null;
  download_links: TikTokDownloadOption[];
  legalNotice: string;
}

export interface KompasNewsItem {
  title: string;
  url: string;
  category: string;
  image: string | null;
  time: string;
  published: string;
  description: string;
}

export class ExternalService {
  private client: AxiosInstance;

  constructor(client?: AxiosInstance) {
    this.client =
      client ||
      axios.create({
        timeout: 15000,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OtakuPlay-Backend/1.0',
        },
      });
  }

  async resolveTikTok(tiktokUrl: string): Promise<TikTokResolveResult> {
    if (!tiktokUrl || !tiktokUrl.includes('tiktok.com')) {
      throw new BadRequestError('URL TikTok tidak valid');
    }

    try {
      const res = await this.client.get<Record<string, unknown>>(env.SNAPTIK_BASE_URL, {
        params: { url: tiktokUrl },
      });
      const body = res.data || {};
      const dataNode = (body.data && typeof body.data === 'object'
        ? body.data
        : body) as Record<string, unknown>;

      const rawLinks = Array.isArray(dataNode.download_links)
        ? dataNode.download_links
        : Array.isArray(body.download_links)
          ? body.download_links
          : [];

      const links: TikTokDownloadOption[] = rawLinks
        .map((item, idx): TikTokDownloadOption | null => {
          if (typeof item === 'string') {
            return {
              label: idx === 0 ? 'Download MP4 (No Watermark)' : `Unduhan ${idx + 1}`,
              type: idx === 0 ? 'mp4_no_watermark' : 'other',
              url: item,
            };
          }
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>;
            const url = String(obj.url || obj.link || obj.href || '').trim();
            if (!url) return null;
            const rawLabel = String(obj.label || obj.type || obj.quality || obj.name || '').trim();
            const lower = rawLabel.toLowerCase();
            let type: TikTokDownloadOption['type'] = 'other';
            if (lower.includes('mp3') || lower.includes('audio')) type = 'mp3_audio';
            else if (lower.includes('hd')) type = 'mp4_hd';
            else if (lower.includes('mp4') || lower.includes('watermark') || idx === 0)
              type = 'mp4_no_watermark';

            return {
              label:
                rawLabel ||
                (type === 'mp4_hd'
                  ? 'Download MP4 HD (No Watermark)'
                  : type === 'mp3_audio'
                    ? 'Download MP3 Audio'
                    : 'Download MP4 (No Watermark)'),
              type,
              url,
            };
          }
          return null;
        })
        .filter((x): x is TikTokDownloadOption => x !== null);

      if (links.length === 0) {
        throw new UpstreamServiceError('Tautan unduhan TikTok tidak ditemukan');
      }

      return {
        author: String(body.author || dataNode.author || 'TikTok Creator'),
        status: Boolean(body.status ?? true),
        title: String(dataNode.title || body.title || 'Video TikTok'),
        thumbnail: (dataNode.thumbnail || body.thumbnail || null) as string | null,
        download_links: links,
        legalNotice:
          'Gunakan fitur ini hanya untuk konten yang Anda miliki atau memiliki izin resmi untuk diunduh. Hormati hak cipta dan ketentuan TikTok.',
      };
    } catch (err) {
      if (err instanceof UpstreamServiceError || err instanceof BadRequestError) throw err;
      logger.error({ err }, 'TikTok SnapTik resolve failed');
      throw new UpstreamServiceError('Gagal memproses URL TikTok saat ini');
    }
  }

  async askOtakuAi(question: string) {
    const trimmed = question.trim();
    if (!trimmed) {
      throw new BadRequestError('Pertanyaan untuk Otaku AI tidak boleh kosong');
    }
    if (trimmed.length > 2000) {
      throw new BadRequestError('Pertanyaan maksimal 2000 karakter');
    }

    try {
      const res = await this.client.get<Record<string, unknown>>(env.OTAKU_AI_BASE_URL, {
        params: { q: trimmed },
        timeout: 25000,
      });
      const body = res.data || {};
      const dataNode =
        body.data && typeof body.data === 'object'
          ? (body.data as Record<string, unknown>)
          : {};
      const message = String(dataNode.message || body.message || '').trim();

      if (!message) {
        throw new UpstreamServiceError('Otaku AI tidak mengembalikan jawaban');
      }

      return {
        author: String(body.author || 'Otaku AI'),
        status: Boolean(body.status ?? true),
        data: {
          message,
        },
      };
    } catch (err) {
      if (err instanceof UpstreamServiceError || err instanceof BadRequestError) throw err;
      logger.error({ err }, 'Otaku AI request failed');
      throw new UpstreamServiceError('Otaku AI sedang sibuk, silakan coba lagi sebentar');
    }
  }

  async getKompasNews(): Promise<{
    status: boolean;
    success: boolean;
    count: number;
    attribution: string;
    data: KompasNewsItem[];
  }> {
    const cacheKey = 'news:kompas:latest';
    const cached = await cache.get<{
      status: boolean;
      success: boolean;
      count: number;
      attribution: string;
      data: KompasNewsItem[];
    }>(cacheKey);
    if (cached) return cached;

    try {
      const res = await this.client.get<Record<string, unknown>>(env.KOMPAS_NEWS_URL);
      const body = res.data || {};
      const rawItems = Array.isArray(body.data) ? body.data : [];

      const items: KompasNewsItem[] = rawItems.map((raw) => {
        const obj = (raw || {}) as Record<string, unknown>;
        return {
          title: String(obj.title || ''),
          url: String(obj.url || ''),
          category: String(obj.category || 'Umum'),
          image: obj.image ? String(obj.image) : null,
          time: String(obj.time || ''),
          published: String(obj.published || obj.time || ''),
          description: String(obj.description || ''),
        };
      });

      const payload = {
        status: Boolean(body.status ?? true),
        success: Boolean(body.success ?? true),
        count: Number(body.count ?? items.length),
        attribution: 'Sumber berita resmi: Kompas.com',
        data: items,
      };

      await cache.set(cacheKey, payload, 300);
      return payload;
    } catch (err) {
      logger.error({ err }, 'Kompas News fetch failed');
      throw new UpstreamServiceError('Gagal memuat berita terbaru dari Kompas');
    }
  }
}

export const externalService = new ExternalService();
