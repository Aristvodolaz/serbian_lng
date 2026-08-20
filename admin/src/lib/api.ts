export const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000') as string;

export async function getAdminToken(): Promise<string | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return cookieStore.get('admin_access_token')?.value ?? null;
}

export async function fetchAdmin<T>(
  path: string,
  options?: RequestInit & { redirectOnError?: boolean },
): Promise<T> {
  const token = await getAdminToken();
  const { redirectOnError = true, ...fetchOptions } = options || {};

  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...fetchOptions?.headers,
    },
    cache: 'no-store',
    ...fetchOptions,
  });

  if (res.status === 401 && redirectOnError) {
    const { redirect } = await import('next/navigation');
    redirect('/api/refresh');
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}
