import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get('admin_refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const data = await res.json();
    const returnTo = request.nextUrl.searchParams.get('returnTo') || '/';

    if (!returnTo.startsWith('/')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const response = NextResponse.redirect(new URL(returnTo, request.url));
    response.cookies.set('admin_access_token', data.accessToken, {
      path: '/',
      maxAge: 2592000,
      sameSite: 'lax',
    });
    response.cookies.set('admin_refresh_token', data.refreshToken, {
      path: '/',
      maxAge: 2592000,
      sameSite: 'lax',
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
