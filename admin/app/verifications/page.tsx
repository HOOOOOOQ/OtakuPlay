'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Check, X } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { apiRequest } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface VerificationRow {
  _id: string;
  fullName: string;
  category: string;
  reason: string;
  portfolioLinks: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  userId?: {
    username: string;
    displayName: string;
    email: string;
    level: number;
    xp: number;
  };
}

export default function AdminVerificationsPage() {
  const [items, setItems] = useState<VerificationRow[]>([]);
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    const res = await apiRequest<VerificationRow[]>('/admin/verifications?status=all');
    setItems(res.data);
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    await apiRequest(`/admin/verification/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        reviewNotes:
          status === 'approved'
            ? 'Memenuhi kriteria kreator/komunitas OtakuPlay.'
            : 'Belum memenuhi syarat kelayakan verifikasi.',
      }),
    });
    setFeedback(`Permohonan verifikasi ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
    load();
  };

  return (
    <AdminShell
      title="Verifikasi Lencana Biru"
      subtitle="Peninjauan manual permohonan centang biru (tidak otomatis dari level)"
    >
      <div className="space-y-4">
        {feedback && (
          <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs text-secondary">
            {feedback}
          </div>
        )}

        {items.length === 0 ? (
          <Card>
            <p className="text-sm text-text-secondary">Belum ada permohonan verifikasi.</p>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item._id} className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-sky-400" />
                  <span className="font-semibold text-white">{item.fullName}</span>
                  <Badge tone="primary">{item.category}</Badge>
                  <Badge
                    tone={
                      item.status === 'approved'
                        ? 'success'
                        : item.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary">
                  @{item.userId?.username} · Level {item.userId?.level} ({item.userId?.xp} XP) ·{' '}
                  {formatDateTime(item.createdAt)}
                </p>
                <p className="text-sm text-white/90">{item.reason}</p>
                {item.portfolioLinks?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.portfolioLinks.map((link) => (
                      <a
                        key={link}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent underline"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {item.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleReview(item._id, 'approved')}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Setujui
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleReview(item._id, 'rejected')}
                  >
                    <X className="h-3.5 w-3.5" />
                    Tolak
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </AdminShell>
  );
}
