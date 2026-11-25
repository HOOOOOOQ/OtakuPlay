import { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { AnimeService, detectStreamFormat } from '../src/services/anime.service';

function makeMockAxios(getImpl: (...args: unknown[]) => Promise<unknown>): AxiosInstance {
  return { get: vi.fn(getImpl) } as unknown as AxiosInstance;
}

describe('AnimeService & Stream Format Detection', () => {
  it('detects stream formats safely without assuming MP4', () => {
    expect(detectStreamFormat('https://cdn.example.com/ep1.mp4?token=1')).toEqual({
      format: 'mp4',
      isDirectPlayable: true,
      requiresExternalOrWebFallback: false,
    });
    expect(detectStreamFormat('https://cdn.example.com/master.m3u8')).toEqual({
      format: 'hls',
      isDirectPlayable: true,
      requiresExternalOrWebFallback: false,
    });
    expect(detectStreamFormat('https://player.example.com/embed/123')).toEqual({
      format: 'embed',
      isDirectPlayable: false,
      requiresExternalOrWebFallback: true,
    });
    expect(detectStreamFormat(null)).toEqual({
      format: 'unavailable',
      isDirectPlayable: false,
      requiresExternalOrWebFallback: true,
    });
    expect(detectStreamFormat('not-a-valid-url')).toEqual({
      format: 'unavailable',
      isDirectPlayable: false,
      requiresExternalOrWebFallback: true,
    });
  });

  it('parses search results with nullable ratings safely', async () => {
    const mockClient = makeMockAxios(async () => ({
      status: 200,
      data: {
        data: {
          query: 'jujutsu kaisen',
          total: 2,
          results: [
            {
              title: 'Jujutsu Kaisen',
              link: 'https://animasu.example/anime/jjk',
              image: 'https://img.example/jjk.jpg',
              latestEpisode: 'Episode 24',
              type: 'TV',
              rating: null,
            },
            {
              title: 'Jujutsu Kaisen 0',
              link: 'https://animasu.example/anime/jjk0',
              image: 'https://img.example/jjk0.jpg',
              latestEpisode: 'Movie',
              type: 'Movie',
              rating: '8.7',
            },
          ],
        },
      },
    }));

    const svc = new AnimeService(mockClient);
    const res = await svc.search('jujutsu kaisen');
    expect(res.query).toBe('jujutsu kaisen');
    expect(res.total).toBe(2);
    expect((res.results as Array<{ rating: string | null }>)[0].rating).toBeNull();
    expect((res.results as Array<{ rating: string | null }>)[1].rating).toBe('8.7');
  });

  it('parses schedule with dynamic day keys', async () => {
    const mockClient = makeMockAxios(async () => ({
      status: 200,
      data: {
        data: {
          totalDays: 2,
          schedule: {
            Senin: [{ title: 'Anime A', link: 'https://a.com' }],
            'Rilis Khusus': [{ title: 'Anime B', link: 'https://b.com' }],
          },
        },
      },
    }));

    const svc = new AnimeService(mockClient);
    const res = await svc.getSchedule();
    expect(res.totalDays).toBe(2);
    const groups = res.groups as Array<{ day: string; items: unknown[] }>;
    expect(groups.map((g) => g.day)).toEqual(['Senin', 'Rilis Khusus']);
    expect(groups[1].items).toHaveLength(1);
  });

  it('resolves stream with fallback links when direct streamUrl is absent', async () => {
    const mockClient = makeMockAxios(async () => ({
      status: 200,
      data: {
        data: {
          streamUrl: null,
          alternativeLinks: [{ server: 'Mirror Resmi', url: 'https://mirror.example/ep1' }],
          episodeInfo: {
            title: 'Episode 1',
            heading: 'Frieren Episode 1',
          },
        },
      },
    }));

    const svc = new AnimeService(mockClient);
    const stream = await svc.getStream('https://animasu.example/ep/1');
    expect(stream.isDirectPlayable).toBe(false);
    expect(stream.requiresExternalOrWebFallback).toBe(true);
    expect(stream.alternativeLinks).toHaveLength(1);
    expect(stream.episodeInfo.title).toBe('Episode 1');
  });

  it('rejects invalid URLs on details and stream', async () => {
    const svc = new AnimeService(makeMockAxios(async () => ({})));
    await expect(svc.getDetails('invalid-url')).rejects.toThrow();
    await expect(svc.getStream('ftp://not-http.com')).rejects.toThrow();
  });
});
