import { NextResponse, type NextRequest } from 'next/server';

// Paths without a language prefix go to /ru or /en by the browser's first language.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (/^\/(ru|en)(\/|$)/.test(pathname)) return;

  const first = request.headers.get('accept-language')?.split(',')[0]?.trim().toLowerCase() ?? '';
  const lang = first && !first.startsWith('ru') ? 'en' : 'ru';

  const url = request.nextUrl.clone();
  url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals and anything with a file extension.
  matcher: ['/((?!_next|.*\\..*).*)'],
};
