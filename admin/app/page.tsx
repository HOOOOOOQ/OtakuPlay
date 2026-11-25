'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  BadgeCheck,
  Flag,
  MessageSquare,
  MessagesSquare,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { ActivityPoint, OverviewCharts } from '@/components/OverviewCharts';
import { Badge, Card } from '@/components/ui/primitives';
import { apiRequest } from '@/lib/api';

interface DashboardPayload {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalPosts: number;
    totalComments: number;
    totalMessages: number;
    verificationRequests: number;
    reports: number;
  };
  apiHealth: {
    status: string;
    database: string;
    uptimeSeconds: number;
    timestamp: string;
  };
  activitySeries: ActivityPoint[];
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<DashboardPayload>('/admin/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat dashboard'));
  }, []);

  const cards = data
    ? [
        { label: 'Total Pengguna', value: data.metrics.totalUsers, icon: Users },
        { label: 'Pengguna Aktif (24j)', value: data.metrics.activeUsers, icon: Sparkles },
        { label: 'Pengguna Baru (7h)', value: data.metrics.newUsers, icon: UserPlus },
        { label: 'Total Postingan', value: data.metrics.totalPosts, icon: MessageSquare },
        { label: 'Total Komentar', value: data.metrics.totalComments, icon: MessagesSquare },
        { label: 'Total Pesan Chat', value: data.metrics.totalMessages, icon: MessagesSquare },
        {
          label: 'Antrean Verifikasi',
          value: data.metrics.verificationRequests,
          icon: BadgeCheck,
        },
        { label: 'Laporan Terbuka', value: data.metrics.reports, icon: Flag },
      ]
    : [];

  return (
    <AdminShell
      title="Dashboard Overview"
      subtitle="Statistik platform, kesehatan API, dan metrik moderasi realtime"
    >
      {error && (
        <div className="mb-5 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-secondary">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Kesehatan API & Database</p>
                <p className="text-xs text-text-secondary">
                  Uptime: {data.apiHealth.uptimeSeconds}s · Database: {data.apiHealth.database}
                </p>
              </div>
            </div>
            <Badge tone={data.apiHealth.status === 'healthy' ? 'success' : 'warning'}>
              {data.apiHealth.status.toUpperCase()}
            </Badge>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-secondary">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold text-white">{item.value}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-surface text-secondary">
                    <Icon className="h-5 w-5" />
                  </div>
                </Card>
              );
            })}
          </div>

          <OverviewCharts data={data.activitySeries} />
        </div>
      )}
    </AdminShell>
  );
}
