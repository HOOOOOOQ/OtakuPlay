'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Ban, CheckCircle2, Search, Shield, UserX } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { Badge, Button, Card, Input } from '@/components/ui/primitives';
import { apiRequest } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface AdminUserRow {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  status: 'active' | 'suspended' | 'banned';
  isVerified: boolean;
  xp: number;
  level: number;
  levelTitle: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const loadUsers = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const res = await apiRequest<AdminUserRow[]>(
        `/admin/users?q=${encodeURIComponent(q)}&limit=50`
      );
      setUsers(res.data);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Gagal memuat pengguna');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateStatus = async (id: string, body: Record<string, unknown>, msg: string) => {
    try {
      await apiRequest(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setFeedback(msg);
      loadUsers(query);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Gagal memperbarui pengguna');
    }
  };

  return (
    <AdminShell
      title="Manajemen Pengguna"
      subtitle="Cari pengguna, kelola status akun, peran RBAC, dan verifikasi biru"
    >
      <div className="space-y-5">
        <Card className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
            <Input
              className="pl-10"
              placeholder="Cari username, nama, atau email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => loadUsers(query)}>Cari</Button>
        </Card>

        {feedback && (
          <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs text-secondary">
            {feedback}
          </div>
        )}

        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary-surface/60 text-xs text-text-secondary">
              <tr>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">Level / XP</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Terdaftar</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-secondary-surface/35">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        {u.displayName}
                        {u.isVerified && <BadgeCheck className="h-4 w-4 text-sky-400" />}
                      </div>
                      <p className="text-xs text-text-secondary">
                        @{u.username} · {u.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-medium text-white">Lv {u.level} · {u.levelTitle}</p>
                      <p className="text-text-secondary">{u.xp} XP</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateStatus(u._id, { role: e.target.value }, `Role @${u.username} diubah`)
                        }
                        className="rounded-xl border border-border bg-secondary-surface px-2.5 py-1 text-xs text-white"
                      >
                        <option value="user">user</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          u.status === 'active'
                            ? 'success'
                            : u.status === 'suspended'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {formatDateTime(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            updateStatus(
                              u._id,
                              { isVerified: !u.isVerified },
                              `Verifikasi @${u.username} diperbarui`
                            )
                          }
                        >
                          <Shield className="h-3.5 w-3.5" />
                          {u.isVerified ? 'Cabut Centang' : 'Verifikasi'}
                        </Button>
                        {u.status === 'active' ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateStatus(
                                  u._id,
                                  { status: 'suspended', suspendedDays: 7 },
                                  `@${u.username} ditangguhkan 7 hari`
                                )
                              }
                            >
                              <UserX className="h-3.5 w-3.5" />
                              Suspend
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                updateStatus(
                                  u._id,
                                  { status: 'banned', banReason: 'Pelanggaran kebijakan' },
                                  `@${u.username} diblokir`
                                )
                              }
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Ban
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              updateStatus(u._id, { status: 'active' }, `@${u.username} diaktifkan`)
                            }
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Unban
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminShell>
  );
}
