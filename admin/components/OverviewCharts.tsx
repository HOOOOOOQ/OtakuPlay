'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/primitives';

export interface ActivityPoint {
  date: string;
  newUsers: number;
  newPosts: number;
}

export function OverviewCharts({ data }: { data: ActivityPoint[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Pertumbuhan Pengguna (7 Hari)</h3>
          <p className="text-xs text-text-secondary">Registrasi harian pengguna baru OtakuPlay</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252236" />
              <XAxis dataKey="date" stroke="#A5A1B5" fontSize={11} />
              <YAxis stroke="#A5A1B5" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12111D',
                  borderColor: '#8B5CF6',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="newUsers"
                name="User Baru"
                stroke="#C084FC"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#userGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Aktivitas Postingan Komunitas</h3>
          <p className="text-xs text-text-secondary">Jumlah postingan baru per hari</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252236" />
              <XAxis dataKey="date" stroke="#A5A1B5" fontSize={11} />
              <YAxis stroke="#A5A1B5" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12111D',
                  borderColor: '#8B5CF6',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="newPosts" name="Postingan" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
