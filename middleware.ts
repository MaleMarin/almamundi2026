import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isPlaceholderHistoriasId } from '@/lib/historias/historias-demo-stories';

/**
 * Si alguien abre /historias/ID/... copiando un ejemplo, redirige a una demo real
 * para que video / audio / texto / foto se vean igual que con un id válido.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
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
  matcher: ['/historias/:path*'],
};
