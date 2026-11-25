import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

describe('Backend API Security, Health & Validation', () => {
  const app = createApp();

  it('GET /health returns 200 with security headers', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('otakuplay-backend');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('rejects unauthenticated access to protected endpoints', async () => {
    const [meRes, convRes, adminRes] = await Promise.all([
      request(app).get('/api/v1/users/me'),
      request(app).get('/api/v1/conversations'),
      request(app).get('/api/v1/admin/dashboard'),
    ]);

    expect(meRes.status).toBe(401);
    expect(convRes.status).toBe(401);
    expect(adminRes.status).toBe(401);
  });

  it('validates auth register input strictly via Zod', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      username: 'a',
      displayName: 'X',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('rejects non-TikTok URLs on /api/v1/tools/tiktok/resolve', async () => {
    const res = await request(app).post('/api/v1/tools/tiktok/resolve').send({
      url: 'https://evil-site.example/video.mp4',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('requires query parameters on anime endpoints', async () => {
    const [searchRes, detailRes, streamRes] = await Promise.all([
      request(app).get('/api/v1/anime/search'),
      request(app).get('/api/v1/anime/details'),
      request(app).get('/api/v1/anime/stream'),
    ]);

    expect(searchRes.status).toBe(400);
    expect(detailRes.status).toBe(400);
    expect(streamRes.status).toBe(400);
  });

  it('returns consistent 404 JSON on unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('ROUTE_NOT_FOUND');
  });
});
