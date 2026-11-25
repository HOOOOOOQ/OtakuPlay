'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Badge, Card } from '@/components/ui/primitives';
import { apiRequest } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface AuditRow {
  _id: string;
  action: string;
  actorRole: string;
  targetType: string;
  targetId?: string;
  ipAddress?: string;
  createdAt: string;
  actorId?: { username: string; displayName: string };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);

  useEffect(() => {
    apiRequest<AuditRow[]>('/admin/audit-logs?limit=100')
      .then((res) => setLogs(res.data))
      .catch(() => undefined);
  }, []);

  return (
    <AdminShell
      title="Admin Audit Logs"
      subtitle="Rekam jejak seluruh tindakan administratif untuk transparansi dan keamanan"
    >
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-secondary-surface/60 text-xs text-text-secondary">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Aktor</th>
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                  Belum ada catatan audit.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-secondary-surface/35">
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-semibold text-white">
                      @{log.actorId?.username || 'admin'}
                    </span>{' '}
                    <Badge tone="primary">{log.actorRole}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="default">{log.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {log.targetType} {log.targetId ? `(${log.targetId})` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{log.ipAddress || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
