'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { Badge, Button, Card, Input } from '@/components/ui/primitives';
import { apiRequest } from '@/lib/api';

interface ContentItem {
  _id: string;
  kind: 'announcement' | 'banner' | 'featured_anime' | 'news_highlight';
  title: string;
  body: string;
  imageUrl?: string;
  targetUrl?: string;
  priority: number;
  isActive: boolean;
}

export default function AdminContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [kind, setKind] = useState<ContentItem['kind']>('announcement');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [priority, setPriority] = useState(10);

  const load = useCallback(async () => {
    const res = await apiRequest<ContentItem[]>('/admin/content');
    setItems(res.data);
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest('/admin/content', {
      method: 'POST',
      body: JSON.stringify({
        kind,
        title,
        body,
        imageUrl: imageUrl || undefined,
        targetUrl: targetUrl || undefined,
        priority: Number(priority),
        isActive: true,
      }),
    });
    setTitle('');
    setBody('');
    setImageUrl('');
    setTargetUrl('');
    load();
  };

  const handleDelete = async (id: string) => {
    await apiRequest(`/admin/content/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <AdminShell
      title="Manajemen Konten & Banner"
      subtitle="Kelola banner beranda, pengumuman resmi, anime pilihan, dan sorotan berita"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 text-base font-semibold text-white">Tambah Konten Baru</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-text-secondary">Jenis Konten</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as ContentItem['kind'])}
                className="w-full rounded-xl border border-border bg-secondary-surface px-3 py-2.5 text-sm text-white"
              >
                <option value="announcement">Pengumuman</option>
                <option value="banner">Banner Beranda</option>
                <option value="featured_anime">Featured Anime</option>
                <option value="news_highlight">News Highlight</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">Judul</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">Deskripsi / Isi</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                required
                className="w-full rounded-xl border border-border bg-secondary-surface p-3 text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">URL Gambar (Opsional)</label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">Target URL (Opsional)</label>
              <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">Prioritas (0-100)</label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
            </div>
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4" />
              Publikasikan
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-white">Daftar Konten Aktif</h2>
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-text-secondary">Belum ada konten yang dipublikasikan.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item._id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border bg-secondary-surface p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone="primary">{item.kind}</Badge>
                      <Badge tone="default">Prioritas {item.priority}</Badge>
                    </div>
                    <h3 className="mt-1.5 font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs text-text-secondary">{item.body}</p>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(item._id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
