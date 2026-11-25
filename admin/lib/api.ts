const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

const TOKEN_KEY = 'otakuplay_admin_access_token';
const REFRESH_KEY = 'otakuplay_admin_refresh_token';
const USER_KEY = 'otakuplay_admin_user';

export interface AdminUserSession {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  avatarUrl?: string;
}

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredAdminUser(): AdminUserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUserSession;
  } catch {
    return null;
  }
}

export function saveAdminSession(accessToken: string, refreshToken: string, user: AdminUserSession) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAdminSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string; meta?: Record<string, unknown> }> {
  const token = getStoredAccessToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({
    success: false,
    message: 'Respons server tidak valid',
  }));

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/auth/')) {
      clearAdminSession();
    }
    throw new Error(json.message || `HTTP ${res.status}`);
  }

  return json;
}
