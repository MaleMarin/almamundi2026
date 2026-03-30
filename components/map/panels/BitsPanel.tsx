'use client';

import { SITE_FONT_STACK } from '@/lib/typography';
import type { HuellaPunto } from '@/lib/huellas';

export type BitLike = Pick<HuellaPunto, 'id' | 'lugar' | 'pais' | 'lat' | 'lon'> & {
  categoria?: string;
  titulo?: string;
  historia?: string;
  color?: string;
  fuenteUrl?: string;
};

function openStreetMapUrl(lat: number, lon: number): string {
  const z = lat === 0 && lon === 0 ? 2 : 7;
  return `https://www.openstreetmap.org/#map=${z}/${lat}/${lon}`;
}

function isAllowedExternalHref(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

const linkButtonStyle = (density: 'compact' | 'readable'): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  padding: density === 'readable' ? '11px 18px' : '8px 14px',
  borderRadius: 999,
  fontFamily: SITE_FONT_STACK,
  fontSize: density === 'readable' ? 13 : 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textDecoration: 'none',
  border: '1px solid rgba(120, 180, 255, 0.45)',
  background: 'rgba(30, 70, 120, 0.35)',
  color: 'rgba(200, 230, 255, 0.98)',
  boxShadow: '0 4px 18px rgba(0, 40, 90, 0.25)',
  transition: 'background 160ms ease, border-color 160ms ease',
});

export type BitsPanelProps = {
  bits: BitLike[] | HuellaPunto[];
  selectedBit: BitLike | HuellaPunto | null;
  onSelectBit: (bit: BitLike | HuellaPunto | null) => void;
  onSubirMiHistoria: () => void;
  /**
   * Si es false: no se lista todos los lugares; solo la ficha del bit elegido (p. ej. tras clic en el globo).
   * @default true
   */
  showIndexList?: boolean;
};

function getBitAt(list: HuellaPunto[], index: number): HuellaPunto {
  return list[index] as HuellaPunto;
}

function ensureHuellaPunto(x: unknown): HuellaPunto {
  return x as HuellaPunto;
}

function idLabel(id: number): string {
  return id < 100 ? String(id).padStart(2, '0') : String(id);
}

const rowBase: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: SITE_FONT_STACK,
  border: 'none',
  borderRadius: 8,
  padding: '5px 6px',
  marginBottom: 2,
  transition: 'background 160ms ease, border-color 160ms ease',
};

function BitIndexRow({
  bit,
  isActive,
  onClick,
}: {
  bit: BitLike | HuellaPunto;
  isActive: boolean;
  onClick: () => void;
}) {
  const num = idLabel(bit.id);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...rowBase,
        background: isActive
          ? 'linear-gradient(90deg, rgba(255, 69, 0, 0.38) 0%, rgba(255, 95, 30, 0.18) 100%)'
          : 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(12px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
        border: `1px solid ${isActive ? 'rgba(255, 110, 50, 0.75)' : 'rgba(255,255,255,0.2)'}`,
        borderLeft: isActive ? '2px solid #ff4500' : '2px solid transparent',
        boxShadow: isActive ? 'inset 0 1px 0 rgba(255, 200, 150, 0.35), 0 0 12px rgba(255, 69, 0, 0.2)' : 'inset 0 1px 0 rgba(255,255,255,0.15)',
      }}
    >
      <span style={{ fontSize: 9, color: '#ff5719', letterSpacing: '0.12em', display: 'block' }}>
        #{num}
      </span>
      <span
        style={{
          fontSize: 10,
          color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.72)',
          lineHeight: 1.25,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginTop: 2,
        }}
      >
        {bit.lugar}
      </span>
    </button>
  );
}

type BitDetailDensity = 'compact' | 'readable';

/** Ficha del Bit: en `readable` (solo clic en globo) tipografía amplia y aire; en `compact` cabe junto al índice. */
function BitDetailCompact({
  bit,
  onSubirMiHistoria,
  relaxedHeight,
}: {
  bit: BitLike | HuellaPunto;
  onSubirMiHistoria: () => void;
  relaxedHeight?: boolean;
}) {
  const density: BitDetailDensity = relaxedHeight ? 'readable' : 'compact';
  const num = idLabel(bit.id);
  const titulo = (bit.titulo ?? '').trim() || bit.lugar;
  const historia = (bit.historia ?? '').trim();

  const s =
    density === 'readable'
      ? {
          maxHeight: 'min(78vh, 620px)' as const,
          padding: '22px 20px 26px',
          radius: 16,
          meta: 11,
          metaMb: 10,
          metaTrack: '0.1em' as const,
          lugar: 19,
          lugarMb: 18,
          lugarLh: 1.3,
          label: 11,
          labelMb: 8,
          labelTrack: '0.08em' as const,
          titulo: 17,
          tituloMb: 18,
          tituloLh: 1.42,
          historia: 15,
          historiaLh: 1.68,
          historiaMb: 8,
          historiaColor: 'rgba(212, 220, 232, 0.98)' as const,
          emptyFs: 14,
          emptyLh: 1.55,
          btnSectionMt: 48,
          btnPy: 12,
          btnPx: 22,
          btnFs: 14,
          btnRadius: 999,
        }
      : {
          maxHeight: 'min(52vh, 320px)' as const,
          padding: '12px 11px 14px',
          radius: 11,
          meta: 9,
          metaMb: 6,
          metaTrack: '0.12em' as const,
          lugar: 13,
          lugarMb: 12,
          lugarLh: 1.3,
          label: 9,
          labelMb: 5,
          labelTrack: '0.1em' as const,
          titulo: 12,
          tituloMb: 10,
          tituloLh: 1.45,
          historia: 11,
          historiaLh: 1.58,
          historiaMb: 6,
          historiaColor: 'rgba(190, 202, 218, 0.96)' as const,
          emptyFs: 11,
          emptyLh: 1.5,
          btnSectionMt: 36,
          btnPy: 9,
          btnPx: 16,
          btnFs: 12,
          btnRadius: 999,
        };

  const boxStyle: React.CSSProperties = {
    maxWidth: '100%',
    maxHeight: s.maxHeight,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: s.padding,
    borderRadius: s.radius,
    border: '1px solid rgba(255,255,255,0.4)',
    background:
      'linear-gradient(168deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.07) 75%, rgba(210, 228, 255, 0.12) 100%)',
    backdropFilter: 'blur(32px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(32px) saturate(1.5)',
    boxShadow: '0 12px 44px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.5)',
    boxSizing: 'border-box',
    fontFamily: SITE_FONT_STACK,
    scrollbarWidth: 'thin',
  };

  return (
    <div style={boxStyle}>
      <p
        style={{
          fontSize: s.meta,
          color: '#ff5a14',
          letterSpacing: s.metaTrack,
          textTransform: 'uppercase',
          margin: `0 0 ${s.metaMb}px`,
          lineHeight: 1.35,
        }}
      >
        Bit #{num} · {bit.pais}
      </p>
      <p
        style={{
          fontSize: s.lugar,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.94)',
          margin: `0 0 ${s.lugarMb}px`,
          lineHeight: s.lugarLh,
        }}
      >
        {bit.lugar}
      </p>

      <p
        style={{
          fontSize: s.label,
          color: 'rgba(255,255,255,0.48)',
          letterSpacing: s.labelTrack,
          textTransform: 'uppercase',
          margin: `0 0 ${s.labelMb}px`,
          lineHeight: 1.35,
        }}
      >
        Qué pasó aquí
      </p>
      <p
        style={{
          fontSize: s.titulo,
          fontWeight: 600,
          color: 'rgba(240,245,255,0.96)',
          lineHeight: s.tituloLh,
          margin: `0 0 ${s.tituloMb}px`,
        }}
      >
        {titulo}
      </p>

      {historia ? (
        <p
          style={{
            fontSize: s.historia,
            color: s.historiaColor,
            lineHeight: s.historiaLh,
            margin: `0 0 ${s.historiaMb}px`,
            whiteSpace: 'pre-wrap',
          }}
        >
          {historia}
        </p>
      ) : (
        <p
          style={{
            fontSize: s.emptyFs,
            color: 'rgba(255,255,255,0.42)',
            lineHeight: s.emptyLh,
            margin: `0 0 ${s.historiaMb}px`,
          }}
        >
          Aún no hay relato cargado para este lugar.
        </p>
      )}

      <div
        style={{
          marginTop: density === 'readable' ? 20 : 14,
          display: 'flex',
          flexDirection: 'column',
          gap: density === 'readable' ? 10 : 8,
        }}
      >
        <a
          href={openStreetMapUrl(bit.lat, bit.lon)}
          target="_blank"
          rel="noopener noreferrer"
          style={linkButtonStyle(density)}
        >
          Ver ubicación en mapa (OpenStreetMap)
        </a>
        {typeof bit.fuenteUrl === 'string' &&
          bit.fuenteUrl.trim() &&
          isAllowedExternalHref(bit.fuenteUrl.trim()) && (
            <a
              href={bit.fuenteUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...linkButtonStyle(density),
                border: '1px solid rgba(255, 100, 40, 0.65)',
                background: 'linear-gradient(180deg, rgba(255, 85, 30, 0.35) 0%, rgba(255, 69, 0, 0.22) 100%)',
                color: '#fff3e8',
              }}
            >
              Abrir fuente / referencia
            </a>
          )}
      </div>

      <div style={{ marginTop: s.btnSectionMt }}>
        <button
          type="button"
          onClick={onSubirMiHistoria}
          style={{
            padding: `${s.btnPy}px ${s.btnPx}px`,
            borderRadius: s.btnRadius,
            cursor: 'pointer',
            fontFamily: SITE_FONT_STACK,
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            color: '#ffffff',
            fontSize: s.btnFs,
            fontWeight: 600,
            letterSpacing: '0.04em',
            width: '100%',
            background: 'linear-gradient(180deg, #ff5f1a 0%, #e63e00 100%)',
            border: '1px solid rgba(255, 170, 110, 0.9)',
            boxShadow: '0 8px 28px rgba(255, 69, 0, 0.55), inset 0 1px 0 rgba(255, 210, 170, 0.45)',
          }}
        >
          Contar tu historia
        </button>
      </div>
    </div>
  );
}

export function BitsPanel({
  bits,
  selectedBit,
  onSelectBit,
  onSubirMiHistoria,
  showIndexList = true,
}: BitsPanelProps) {
  if (!showIndexList) {
    return (
      <div className="flex flex-col" style={{ fontFamily: SITE_FONT_STACK }}>
        <div className="min-w-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {selectedBit ? (
            <BitDetailCompact
              bit={selectedBit}
              onSubirMiHistoria={onSubirMiHistoria}
              relaxedHeight
            />
          ) : (
            <p
              style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.58)',
                lineHeight: 1.65,
                margin: '8px 4px 0',
                letterSpacing: '0.01em',
              }}
            >
              Tocá un punto <span style={{ color: '#ff4500', fontWeight: 700 }}>brillante</span> en el
              globo para leer la historia de ese Bit.
            </p>
          )}
        </div>
      </div>
    );
  }

  const bitsList = bits as unknown as HuellaPunto[];
  const count = bitsList.length;

  return (
    <div
      className="flex min-h-[min(360px,52vh)] w-full flex-col gap-2 md:min-h-[min(400px,58vh)] md:flex-row md:gap-0"
      style={{ fontFamily: SITE_FONT_STACK }}
    >
      <div className="flex max-h-[min(40vh,300px)] min-h-0 shrink-0 flex-col border-white/10 md:max-h-none md:w-[112px] md:flex-none md:border-r md:pr-2">
        <p
          style={{
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
            margin: '0 0 6px',
            flexShrink: 0,
          }}
        >
          {count} lugares
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden md:max-h-none" style={{ scrollbarWidth: 'thin' }}>
          {bitsList.map((_bit, index) => {
            const item = ensureHuellaPunto(getBitAt(bitsList, index));
            return (
              <BitIndexRow
                key={item.id ?? index}
                bit={item}
                isActive={selectedBit?.id === item.id}
                onClick={() => onSelectBit(item)}
              />
            );
          })}
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto md:pl-2" style={{ scrollbarWidth: 'thin' }}>
        {selectedBit ? (
          <BitDetailCompact bit={selectedBit} onSubirMiHistoria={onSubirMiHistoria} />
        ) : (
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, margin: '6px 0 0' }}>
            Elegí un lugar en la lista o un punto en el globo para leer el hecho curioso de ese sitio.
          </p>
        )}
      </div>
    </div>
  );
}
