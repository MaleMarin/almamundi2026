import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isPlaceholderHistoriasId } from '@/lib/historias/historias-demo-stories';
import { MAPA_HOME_REDIRECT_PATH } from '@/lib/mapa-home-nav';

/**
 * Next.js 16+: convención `proxy` (antes `middleware`).
 * - `/mapa` exacto → home `/?section=mapa` (mapa embebido en `#mapa`).
 * - `/historias/ID/...` placeholder → demo real.
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

  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'historias' || parts.length < 2) return NextResponse.next();

  const segment = parts[1];
  if (!isPlaceholderHistoriasId(segment)) return NextResponse.next();

  const format = parts[2];
  const url = request.nextUrl.clone();

  if (!format) {
    url.pathname = '/historias/videos';
    return NextResponse.redirect(url);
  }

  const demoByFormat: Record<string, string> = {
    video: 'demo-video-1',
    audio: 'demo-audio-1',
    texto: 'demo-texto-1',
    foto: 'demo-foto-1',
  };
  const demoId = demoByFormat[format];
  if (!demoId) return NextResponse.next();

  url.pathname = `/historias/${demoId}/${format}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/mapa', '/mapa/', '/historias/:path*'],
};
