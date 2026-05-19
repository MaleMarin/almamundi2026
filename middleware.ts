import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { MAPA_HOME_REDIRECT_PATH } from '@/lib/mapa-home-nav';

/** Solo la raíz `/mapa`; subrutas `/mapa/historias/*` etc. siguen para deep links. */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/\/$/, '') || '/';
  if (path !== '/mapa') {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.search = MAPA_HOME_REDIRECT_PATH.split('?')[1] ?? '';
  url.hash = '';
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ['/mapa', '/mapa/'],
};
