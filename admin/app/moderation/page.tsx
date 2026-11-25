'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Flag, Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { apiRequest } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface ReportRow {
  _id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string;
  status: string;
  createdAt: string;
  reporterId?: { username: string; displayName: string };
}

interface PostRow {
  _id: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  isApprovedContribution: boolean;
  createdAt: string;
  authorId?: { username: string; displayName: string };
}

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [repRes, postRes] = await Promise.all([
        apiRequest<ReportRow[]>('/admin/reports?status=all'),
        apiRequest<PostRow[]>('/admin/posts'),
      ]);
      setReports(repRes.data);
      setPosts(postRes.data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal memuat moderasi');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResolveReport = async (id: string, status: 'resolved' | 'dismissed', removeContent: boolean) => {
    await apiRequest(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, deleteTargetContent: removeContent }),
    });
    setMessage('Laporan berhasil diproses');
    loadData();
  };

  const handleDeletePost = async (id: string) => {
    await apiRequest(`/admin/posts/${id}`, { method: 'DELETE' });
    setMessage('Postingan dihapus');
    loadData();
  };

  const handleApproveContribution = async (id: string) => {
    await apiRequest(`/admin/posts/${id}/approve-contribution`, { method: 'POST' });
    setMessage('Kontribusi disetujui (+5 XP untuk penulis)');
    loadData();
  };

  return (
    <AdminShell
      title="Moderasi & Laporan"
      subtitle="Tinjau laporan postingan, komentar, chat abuse, dan kurasi kontribusi komunitas"
    >
      <div className="space-y-6">
        {message && (
          <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs text-secondary">
            {message}
          </div>
        )}

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Flag className="h-4 w-4 text-danger" />
            <h2 className="text-base font-semibold text-white">Antrean Laporan Pengguna</h2>
          </div>
          <div className="space-y-3">
            {reports.length === 0 ? (
              <p className="text-sm text-text-secondary">Tidak ada laporan saat ini.</p>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary-surface p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone="primary">{rep.targetType}</Badge>
                      <Badge tone={rep.status === 'pending' ? 'warning' : 'success'}>
                        {rep.status}
                      </Badge>
                      <span className="text-xs text-text-secondary">
                        Pelapor: @{rep.reporterId?.username || 'user'} · {formatDateTime(rep.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-white">{rep.reason}</p>
                    {rep.details && <p className="text-xs text-text-secondary">{rep.details}</p>}
                  </div>
                  {rep.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleResolveReport(rep._id, 'resolved', true)}
                      >
                        Hapus Konten & Selesaikan
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleResolveReport(rep._id, 'dismissed', false)}
                      >
                        Abaikan
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-white">Postingan Komunitas Terbaru</h2>
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary-surface p-4"
              >
                <div className="max-w-2xl">
                  <p className="text-xs text-text-secondary">
                    @{post.authorId?.username || 'user'} · {formatDateTime(post.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-white line-clamp-2">{post.caption}</p>
                </div>
                <div className="flex gap-2">
                  {!post.isApprovedContribution ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleApproveContribution(post._id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Setujui Kontribusi (+5 XP)
                    </Button>
                  ) : (
                    <Badge tone="success">Kontribusi Disetujui</Badge>
                  )}
                  <Button size="sm" variant="danger" onClick={() => handleDeletePost(post._id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
