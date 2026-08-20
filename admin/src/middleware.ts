import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_access_token');
  const pathname = new URL(request.url).pathname;
  const isLogin = pathname === '/login';

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
