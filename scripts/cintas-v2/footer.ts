import { formatLongDate, type AlmaLocale } from '@/lib/i18n/locale';
import { TINTA_PIE } from '@/lib/cintas-v2/palette';

export const LADO = 1080;

export function metricasPie(lado: number, conTitulo: boolean) {
  const padX = Math.round(lado * 0.056);
  const padBottom = Math.round(lado * 0.042);
  const padTop = Math.round(lado * 0.028);
  const titlePx = Math.max(15, Math.round(lado * 0.022));
  const metaPx = Math.max(12, Math.round(lado * 0.015));
  const sitePx = Math.max(11, Math.round(lado * 0.013));
  const gap = Math.max(4, Math.round(lado * 0.008));
  const titleBlock = conTitulo ? titlePx + gap : 0;
  const height = padTop + titleBlock + metaPx + gap + sitePx + padBottom;
  return { padX, padBottom, padTop, titlePx, metaPx, sitePx, gap, height };
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function svgPie(params: {
  titulo: string;
  ciudad: string;
  pais: string;
  at: Date;
  locale: AlmaLocale;
}): Buffer {
  const titulo = params.titulo.trim();
  const m = metricasPie(LADO, Boolean(titulo));
  const fecha = formatLongDate(params.at, params.locale);
  const lugar = [params.ciudad.trim(), params.pais.trim()].filter(Boolean).join(', ');
  const meta = lugar ? `${lugar} · ${fecha}` : fecha;
  let y = m.padTop;
  const textos: string[] = [
    `<line x1="0" y1="0.5" x2="${LADO}" y2="0.5" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>`,
  ];
  const fuente = 'Helvetica, Arial, sans-serif';
  if (titulo) {
    y += m.titlePx;
    textos.push(
      `<text x="${m.padX}" y="${y}" font-size="${m.titlePx}" fill="${TINTA_PIE}" font-family="${fuente}">${escapeXml(titulo)}</text>`
    );
    y += m.gap;
  }
  y += m.metaPx;
  textos.push(
    `<text x="${m.padX}" y="${y}" font-size="${m.metaPx}" fill="${TINTA_PIE}" font-family="${fuente}">${escapeXml(meta)}</text>`
  );
  y += m.gap + m.sitePx;
  textos.push(
    `<text x="${m.padX}" y="${y}" font-size="${m.sitePx}" fill="${TINTA_PIE}" font-family="${fuente}">almamundi.org</text>`
  );
  const svg = `<svg width="${LADO}" height="${m.height}" xmlns="http://www.w3.org/2000/svg">${textos.join('')}</svg>`;
  return Buffer.from(svg);
}
