'use client';

import { SITE_FONT_STACK } from '@/lib/typography';
import type { HuellaPunto } from '@/lib/huellas';

export type BitLike = Pick<HuellaPunto, 'id' | 'lugar' | 'pais'> & {
  categoria?: string;
  titulo?: string;
  historia?: string;
  color?: string;
};

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
        background: isActive ? 'rgba(255,200,74,0.12)' : 'transparent',
        borderLeft: isActive ? '2px solid rgba(255,200,74,0.75)' : '2px solid transparent',
      }}
    >
      <span style={{ fontSize: 9, color: 'rgba(255,200,74,0.85)', letterSpacing: '0.12em', display: 'block' }}>
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
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,10,24,0.5)',
    boxSizing: 'border-box',
    fontFamily: SITE_FONT_STACK,
    scrollbarWidth: 'thin',
  };

  return (
    <div style={boxStyle}>
      <p
        style={{
          fontSize: s.meta,
          color: 'rgba(255,210,120,0.82)',
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
            background: 'var(--almamundi-orange, #ff4500)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            boxShadow: '0 6px 24px rgba(255, 69, 0, 0.35)',
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
      <div className="flex h-full min-h-0 flex-1 flex-col" style={{ fontFamily: SITE_FONT_STACK }}>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
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
              Tocá un punto <span style={{ color: 'rgba(255,234,0,0.95)', fontWeight: 600 }}>amarillo</span> en el
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
      className="flex h-full min-h-0 flex-1 flex-col gap-2 md:flex-row md:gap-0"
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
