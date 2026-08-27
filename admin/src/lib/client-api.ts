const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

function getToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('admin_access_token='))
    ?.split('=')[1];
}

function getRefreshToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('admin_refresh_token='))
    ?.split('=')[1];
}

function setCookies(access_token: string, refresh_token: string) {
  document.cookie = `admin_access_token=${access_token}; Path=/; Max-Age=900; SameSite=Lax`;
  document.cookie = `admin_refresh_token=${refresh_token}; Path=/; Max-Age=2592000; SameSite=Lax`;
}

async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setCookies(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// Client-side API helper (cookies -> Bearer, refresh-on-401). Server
// components use the cookie-based fetchAdmin from '@/lib/api' instead.
export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  // On 401, try to refresh token and retry once
  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const newToken = getToken();
      return fetch(`${BACKEND_URL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        },
      });
    }
    // Refresh failed — log out
    document.cookie = 'admin_access_token=; Path=/; Max-Age=0';
    document.cookie = 'admin_refresh_token=; Path=/; Max-Age=0';
    window.location.href = '/login';
  }

  return response;
}
