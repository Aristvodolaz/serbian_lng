import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_access_token');
  const refreshToken = request.cookies.get('admin_refresh_token');
  const pathname = new URL(request.url).pathname;
  const isLogin = pathname === '/login';
  const isApiRefresh = pathname.startsWith('/api/refresh');

  // Let the refresh route through even without an access token
  if (isApiRefresh) {
    return NextResponse.next();
  }

  // If no access token but we have a refresh token, redirect to refresh
  if (!token && refreshToken && !isLogin) {
    const returnTo = encodeURIComponent(request.url);
    return NextResponse.redirect(new URL(`/api/refresh?returnTo=${returnTo}`, request.url));
  }

  if (!token && !isLogin) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isLogin) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
