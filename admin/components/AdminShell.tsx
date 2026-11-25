'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  BadgeCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ShieldAlert,
  Users,
} from 'lucide-react';
import {
  AdminUserSession,
  apiRequest,
  clearAdminSession,
  getStoredAccessToken,
  getStoredAdminUser,
} from '@/lib/api';
import { Badge } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/users', label: 'Manajemen User', icon: Users },
  { href: '/moderation', label: 'Moderasi & Laporan', icon: ShieldAlert },
  { href: '/verifications', label: 'Verifikasi Biru', icon: BadgeCheck },
  { href: '/content', label: 'Konten & Banner', icon: Megaphone },
  { href: '/audit-logs', label: 'Audit Logs', icon: FileText },
];

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUserSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStoredAccessToken();
    const stored = getStoredAdminUser();
    if (!token || !stored) {
      router.replace('/login');
      return;
    }
    if (!['moderator', 'admin', 'super_admin'].includes(stored.role)) {
      clearAdminSession();
      router.replace('/login');
      return;
    }
    setUser(stored);
    setReady(true);
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
    } catch {
      // ignore
    }
    clearAdminSession();
    router.replace('/login');
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r border-border bg-surface/95 p-5 lg:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-primary shadow-violet">
            <span className="text-lg font-extrabold text-white">▶</span>
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wider text-white">
              OTAKU<span className="text-secondary">PLAY</span>
            </p>
            <p className="text-[11px] text-text-secondary">Admin Command Center</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/20 text-white border border-primary/40 shadow-violet'
                    : 'text-text-secondary hover:bg-secondary-surface hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-accent' : 'text-text-secondary')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-2xl border border-border bg-secondary-surface p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.displayName}</p>
              <p className="truncate text-xs text-text-secondary">@{user?.username}</p>
            </div>
            <Badge tone="primary">{user?.role}</Badge>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 py-2 text-xs font-medium text-danger hover:bg-danger/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/60 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-xl px-2.5 py-1.5 text-xs font-medium',
                  pathname === item.href
                    ? 'bg-primary text-white'
                    : 'bg-secondary-surface text-text-secondary'
                )}
              >
                {item.label.split(' ')[0]}
              </Link>
            ))}
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
