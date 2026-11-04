'use client';

import { SITE_FONT_STACK } from '@/lib/typography';

export type Estado = 'pendiente' | 'aprobada' | 'rechazada' | 'archivada';

const ESTILO: Record<Estado, { fondo: string; borde: string; texto: string; marca: string; nombre: string }> = {
  pendiente: { fondo: 'rgba(245,158,11,0.16)', borde: 'rgba(245,158,11,0.5)', texto: '#fcd34d', marca: '●', nombre: 'Pendiente de revisión' },
  aprobada: { fondo: 'rgba(34,197,94,0.18)', borde: 'rgba(34,197,94,0.55)', texto: '#86efac', marca: '✓', nombre: 'Aprobada' },
  rechazada: { fondo: 'rgba(239,68,68,0.18)', borde: 'rgba(239,68,68,0.55)', texto: '#fca5a5', marca: '✕', nombre: 'Rechazada' },
  archivada: { fondo: 'rgba(255,255,255,0.08)', borde: 'rgba(255,255,255,0.3)', texto: 'rgba(255,255,255,0.8)', marca: '▪', nombre: 'Archivada' },
};

function fecha(ms: number | null | undefined): string {
  if (!ms) return '';
  try {
    return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago' }).format(new Date(ms));
  } catch {
    return '';
  }
}

/** Estado de la revisión del equipo, grande y a la vista, junto a los botones. */
export function EstadoRevision({ estado, el }: { estado: Estado; el?: number | null }) {
  const e = ESTILO[estado];
  const dia = fecha(el);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        borderRadius: 999,
        border: `1px solid ${e.borde}`,
        background: e.fondo,
        color: e.texto,
        fontWeight: 700,
        fontSize: 13,
        whiteSpace: 'nowrap',
        fontFamily: SITE_FONT_STACK,
      }}
    >
      {e.marca} {e.nombre}
      {dia && estado !== 'pendiente' ? ` el ${dia}` : ''}
    </span>
  );
}
