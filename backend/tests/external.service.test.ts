import { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { ExternalService } from '../src/services/external.service';

function makeMockAxios(getImpl: (...args: unknown[]) => Promise<unknown>): AxiosInstance {
  return { get: vi.fn(getImpl) } as unknown as AxiosInstance;
}

describe('ExternalService (SnapTik, Otaku AI, Kompas News)', () => {
  it('parses TikTok SnapTik download links with legal notice', async () => {
    const svc = new ExternalService(
      makeMockAxios(async () => ({
        status: 200,
        data: {
          author: 'otaku_creator',
          status: true,
          title: 'Cosplay Transition',
          thumbnail: 'https://img.example/thumb.jpg',
          download_links: [
            { label: 'MP4 No Watermark', url: 'https://dl.example/nowm.mp4' },
            { label: 'MP4 HD', url: 'https://dl.example/hd.mp4' },
            { label: 'MP3 Audio', url: 'https://dl.example/audio.mp3' },
          ],
        },
      }))
    );

    const result = await svc.resolveTikTok('https://www.tiktok.com/@otaku/video/123');
    expect(result.author).toBe('otaku_creator');
    expect(result.download_links).toHaveLength(3);
    expect(result.download_links[1].type).toBe('mp4_hd');
    expect(result.download_links[2].type).toBe('mp3_audio');
    expect(result.legalNotice).toContain('hak cipta');
  });

  it('parses Otaku AI response safely', async () => {
    const svc = new ExternalService(
      makeMockAxios(async () => ({
        status: 200,
        data: {
          author: 'nexadev',
          status: true,
          data: {
            message: 'Rekomendasi anime terbaik musim ini adalah Frieren!',
          },
        },
      }))
    );

    const res = await svc.askOtakuAi('Rekomendasi anime fantasy terbaik');
    expect(res.data.message).toContain('Frieren');
  });

  it('parses Kompas News with official attribution', async () => {
    const svc = new ExternalService(
      makeMockAxios(async () => ({
        status: 200,
        data: {
          status: true,
          success: true,
          count: 1,
          data: [
            {
              title: 'Industri Anime Global Tumbuh Pesat',
              url: 'https://tekno.kompas.com/read/123',
              category: 'Tekno',
              image: 'https://asset.kompas.com/123.jpg',
              time: '1 jam lalu',
              published: '2026-11-24',
              description: 'Ringkasan berita teknologi dan hiburan.',
            },
          ],
        },
      }))
    );

    const news = await svc.getKompasNews();
    expect(news.success).toBe(true);
    expect(news.attribution).toContain('Kompas');
    expect(news.data[0].title).toContain('Industri Anime');
  });
});
