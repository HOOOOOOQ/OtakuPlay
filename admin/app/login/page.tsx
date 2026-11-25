'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { AdminUserSession, apiRequest, saveAdminSession } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui/primitives';

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest<{
        accessToken: string;
        refreshToken: string;
        user: AdminUserSession;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          password,
          platform: 'web',
          deviceName: 'OtakuPlay Admin Dashboard',
        }),
      });

      if (!['moderator', 'admin', 'super_admin'].includes(res.data.user.role)) {
        throw new Error('Akun ini tidak memiliki hak akses Admin atau Moderator');
      }

      saveAdminSession(res.data.accessToken, res.data.refreshToken, res.data.user);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-primary shadow-violet">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide text-white">
            OTAKU<span className="text-secondary">PLAY</span> ADMIN
          </h1>
          <p className="mt-1 text-xs text-text-secondary">
            Your Anime. Your Community. Your Universe.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Email atau Username Admin
              </label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@otakuplay.app"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Kata Sandi
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              <Lock className="h-4 w-4" />
              {loading ? 'Memverifikasi...' : 'Masuk ke Command Center'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
