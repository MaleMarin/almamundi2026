import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { MAPA_HOME_REDIRECT_PATH } from '@/lib/mapa-home-nav';

/**
 * Next.js 16+: convención `proxy` (antes `middleware`).
 * `/mapa` exacto → home `/?section=mapa`.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const path = pathname.replace(/\/$/, '') || '/';

  if (path === '/mapa') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = MAPA_HOME_REDIRECT_PATH.split('?')[1] ?? '';
    url.hash = '';
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/mapa', '/mapa/'],
};
