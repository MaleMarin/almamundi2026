'use client';

import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { SITE_FONT_STACK } from '@/lib/typography';
import type { HuellaPunto } from '@/lib/huellas';

const TEXT = '#F7F8FC';

const COPY = {
  es: {
    happened: 'Qué pasó aquí',
    maps: 'Ver ubicación en Google Maps',
    phrase: 'El mundo está lleno de historias sorprendentes. La tuya también merece contarse.',
    tell: 'Cuenta tu historia',
    empty: 'Este mapa se construye con historias como la tuya.',
    places: (n: number) => `${n} lugares` },
  pt: {
    happened: 'O que aconteceu aqui',
    maps: 'Ver localização no Google Maps',
    phrase: 'O mundo está cheio de histórias surpreendentes. A sua também merece ser contada.',
    tell: 'Conte sua história',
    empty: 'Este mapa é feito de histórias como a sua.',
    places: (n: number) => `${n} lugares` },
  en: {
    happened: 'What happened here',
    maps: 'See location on Google Maps',
    phrase: 'The world is full of surprising stories. Yours deserves to be told too.',
    tell: 'Tell your story',
    empty: 'This map is made of stories like yours.',
    places: (n: number) => (n === 1 ? '1 place' : `${n} places`) } } as const;

export type BitLike = Pick<HuellaPunto, 'id' | 'lugar' | 'pais' | 'lat' | 'lon'> & {
  categoria?: string;
  titulo?: string;
  historia?: string;
  color?: string;
  fuenteUrl?: string;
};

function googleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

const actionStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  minHeight: 44,
  padding: '8px 16px',
  textAlign: 'center' };

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

const rowBase: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 2,
  width: '100%',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: SITE_FONT_STACK,
  border: 'none',
  borderRadius: 8,
  padding: '8px 10px',
  marginBottom: 4,
  transition: 'background 160ms ease, border-color 160ms ease' };

function BitIndexRow({
  bit,
  isActive,
  onClick }: {
  bit: BitLike | HuellaPunto;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...rowBase,
        background: isActive ? 'rgba(255, 74, 28, 0.28)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${isActive ? 'rgba(255, 110, 50, 0.75)' : 'rgba(255,255,255,0.16)'}`,
        borderLeft: isActive ? '2px solid #FF4A1C' : '2px solid transparent' }}
    >
      <span
        style={{
          fontSize: 'var(--fs-etiqueta)',
          color: TEXT,
          lineHeight: 1.35,
          fontWeight: 500 }}
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
  copy,
  onSubirMiHistoria,
  relaxedHeight }: {
  bit: BitLike | HuellaPunto;
  copy: (typeof COPY)[keyof typeof COPY];
  onSubirMiHistoria: () => void;
  relaxedHeight?: boolean;
}) {
  const density: BitDetailDensity = relaxedHeight ? 'readable' : 'compact';
  const titulo = (bit.titulo ?? '').trim() || bit.lugar;
  const historia = (bit.historia ?? '').trim();

  const s =
    density === 'readable'
      ? {
          padding: '22px 20px 26px',
          radius: 16,
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
          emptyFs: 14,
          emptyLh: 1.55 }
      : {
          padding: '12px 11px 14px',
          radius: 11,
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
          emptyFs: 11,
          emptyLh: 1.5 };

  const boxStyle: React.CSSProperties = {
    maxWidth: '100%',
    overflow: 'visible',
    padding: s.padding,
    borderRadius: s.radius,
    border: '1px solid rgba(255,255,255,0.28)',
    background:
      'linear-gradient(168deg, rgba(18, 32, 54, 0.92) 0%, rgba(12, 22, 40, 0.94) 100%)',
    backdropFilter: 'blur(32px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(32px) saturate(1.5)',
    boxShadow: '0 12px 44px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.5)',
    boxSizing: 'border-box',
    fontFamily: SITE_FONT_STACK };

  return (
    <div style={boxStyle}>
      <p
        style={{
          fontSize: s.lugar,
          fontWeight: 600,
          color: TEXT,
          margin: `0 0 ${s.lugarMb}px`,
          lineHeight: s.lugarLh }}
      >
        {bit.lugar}
      </p>

      <p
        style={{
          fontSize: s.label,
          color: TEXT,
          fontWeight: 600,
          letterSpacing: s.labelTrack,
          textTransform: 'uppercase',
          margin: `0 0 ${s.labelMb}px`,
          lineHeight: 1.35 }}
      >
        {copy.happened}
      </p>
      <p
        style={{
          fontSize: s.titulo,
          fontWeight: 600,
          color: TEXT,
          lineHeight: s.tituloLh,
          margin: `0 0 ${s.tituloMb}px` }}
      >
        {titulo}
      </p>

      {historia ? (
        <p
          style={{
            fontSize: s.historia,
            color: TEXT,
            lineHeight: s.historiaLh,
            margin: `0 0 ${s.historiaMb}px`,
            whiteSpace: 'pre-wrap' }}
        >
          {historia}
        </p>
      ) : (
        <p
          style={{
            fontSize: s.emptyFs,
            color: TEXT,
            lineHeight: s.emptyLh,
            margin: `0 0 ${s.historiaMb}px` }}
        >
          {copy.empty}
        </p>
      )}

      <div
        style={{
          marginTop: density === 'readable' ? 20 : 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 16 }}
      >
        <a
          className="btn-am-secundario"
          href={googleMapsUrl(bit.lat, bit.lon)}
          target="_blank"
          rel="noopener noreferrer"
          style={actionStyle}
        >
          {copy.maps}
        </a>
        <p
          style={{
            fontSize: 'var(--fs-texto)',
            color: TEXT,
            lineHeight: 1.5,
            margin: 0 }}
        >
          {copy.phrase}
        </p>
        <button type="button" className="btn-am-secundario" onClick={onSubirMiHistoria} style={actionStyle}>
          {copy.tell}
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
  showIndexList = true }: BitsPanelProps) {
  const { locale } = useHomeLocale();
  const copy = COPY[locale];
  if (!showIndexList) {
    return (
      <div style={{ fontFamily: SITE_FONT_STACK }}>
        {selectedBit ? (
          <BitDetailCompact
            bit={selectedBit}
            copy={copy}
            onSubirMiHistoria={onSubirMiHistoria}
            relaxedHeight
          />
        ) : null}
      </div>
    );
  }

  const bitsList = bits as unknown as HuellaPunto[];
  const count = bitsList.length;
  const hasSelection = selectedBit != null;

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden"
      style={{ fontFamily: SITE_FONT_STACK }}
    >
      <div
        className={
          hasSelection
            ? 'flex min-h-0 flex-1 flex-col gap-2 md:flex-row md:gap-0'
            : 'flex min-h-0 flex-1 flex-col'
        }
      >
        <div
          className={
            hasSelection
              ? 'flex max-h-[min(40vh,300px)] min-h-0 shrink-0 flex-col border-white/10 md:max-h-none md:w-[140px] md:flex-none md:border-r md:pr-2'
              : 'flex min-h-0 w-full flex-1 flex-col'
          }
        >
          <p
            style={{
              fontSize: 'var(--fs-etiqueta)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: TEXT,
              margin: '0 0 6px',
              flexShrink: 0 }}
          >
            {copy.places(count)}
          </p>
          <div
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
            onWheel={(event) => event.stopPropagation()}
            style={{ scrollbarWidth: 'thin', overscrollBehavior: 'contain' }}
          >
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

        {selectedBit ? (
          <div
            className="min-h-0 min-w-0 flex-1 overflow-y-auto md:pl-2"
            onWheel={(event) => event.stopPropagation()}
            style={{ scrollbarWidth: 'thin', overscrollBehavior: 'contain' }}
          >
            <BitDetailCompact bit={selectedBit} copy={copy} onSubirMiHistoria={onSubirMiHistoria} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
