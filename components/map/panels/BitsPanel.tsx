'use client';

import type { HuellaPunto } from '@/lib/huellas';
import type { BitEntry } from '@/lib/bits-data';

export type BitLike = Pick<HuellaPunto, 'id' | 'lugar' | 'pais'> & {
  categoria?: string;
  titulo?: string;
  historia?: string;
};

export type BitsPanelProps = {
  bits: BitLike[] | HuellaPunto[];
  selectedBit: BitLike | HuellaPunto | null;
  onSelectBit: (bit: BitLike | HuellaPunto | null) => void;
  onSubirMiHistoria: () => void;
};

function getBitAt(list: HuellaPunto[], index: number): HuellaPunto {
  return list[index] as HuellaPunto;
}

function ensureHuellaPunto(x: unknown): HuellaPunto {
  return x as HuellaPunto;
}

const categoryPillStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
  color: '#FFC84A',
  background: 'rgba(255,200,74,0.12)',
  border: '1px solid rgba(255,200,74,0.35)',
  fontFamily: "'Avenir Light', Avenir, sans-serif",
};

function BitCard({
  bit,
  isActive,
  onClick,
}: {
  bit: BitLike | HuellaPunto;
  isActive: boolean;
  onClick: () => void;
}) {
  const num = String(bit.id).padStart(2, '0');
  const titulo = bit.titulo ?? bit.lugar;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '14px 16px',
        borderRadius: 14,
        background: isActive ? 'rgba(255,200,74,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? 'rgba(255,200,74,0.25)' : 'rgba(255,255,255,0.07)'}`,
        borderLeft: isActive ? '3px solid rgba(255,200,74,0.6)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        fontFamily: "'Avenir Light', Avenir, sans-serif",
        width: '100%',
      }}
    >
      <p style={{ fontSize: 11, color: '#FFC84A', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 6px' }}>
        Bit #{num}
      </p>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: '0 0 4px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {bit.lugar}
      </p>
      <p style={{ fontSize: 13, color: '#8899AA', margin: 0, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {titulo}
      </p>
    </button>
  );
}

function BitDetail({ bit, onSubirMiHistoria }: { bit: BitLike | HuellaPunto; onSubirMiHistoria: () => void }) {
  const num = String(bit.id).padStart(2, '0');
  const categoria = bit.categoria ?? 'Bit';
  const titulo = bit.titulo ?? bit.lugar;
  const historia = bit.historia ?? '—';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 11, color: '#FFC84A', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0, fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
        BIT #{num}
      </p>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
        {bit.lugar}
      </h2>
      <p style={{ fontSize: 11, letterSpacing: '0.05em', color: 'rgba(136,153,170,0.8)', margin: '0 0 2px', fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
        PAÍS / REGIÓN
      </p>
      <p style={{ fontSize: 13, color: '#8899AA', margin: 0 }}>
        {bit.pais}
      </p>
      <div>
        <span style={categoryPillStyle}>{categoria}</span>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />
      <p style={{ fontSize: 17, fontWeight: 500, color: '#F0F4FF', lineHeight: 1.5, margin: 0, fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
        {titulo}
      </p>
      <p style={{ fontSize: 14, color: '#8899AA', lineHeight: 1.7, margin: 0, fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
        {historia}
      </p>
      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0 0' }} />
      <div style={{ padding: '24px 0 0', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: '0 0 4px', fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
          ¿Estuviste aquí o conocés algo de este lugar?
        </p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: '0 0 16px', fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
          Contá tu historia o experiencia.
        </p>
        <button
          type="button"
          onClick={onSubirMiHistoria}
          style={{
            padding: '12px 24px',
            borderRadius: 999,
            cursor: 'pointer',
            fontFamily: "'Avenir Light', Avenir, sans-serif",
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            background: 'linear-gradient(180deg, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0.16) 100%)',
            border: '1px solid rgba(255,155,60,0.45)',
            boxShadow: 'inset 0 1.5px 0 rgba(255,185,70,0.45), inset 0 -1px 0 rgba(180,55,0,0.20), 0 0 12px rgba(249,115,22,0.15), 0 4px 8px rgba(0,0,0,0.25)',
            transition: 'all 200ms ease',
          }}
        >
          + Subir mi historia
        </button>
      </div>
    </div>
  );
}

export function BitsPanel({ bits, selectedBit, onSelectBit, onSubirMiHistoria }: BitsPanelProps) {
  const bitsList = bits as unknown as HuellaPunto[];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {selectedBit ? (
        <>
          <button
            type="button"
            onClick={() => onSelectBit(null)}
            style={{
              alignSelf: 'flex-start',
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Avenir Light', Avenir, sans-serif",
              padding: 0,
              marginBottom: 4,
            }}
          >
            ← Todos los Bits
          </button>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <BitDetail bit={selectedBit} onSubirMiHistoria={onSubirMiHistoria} />
          </div>
        </>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'thin' }}>
          {bitsList.map((_bit, index) => {
            const item = ensureHuellaPunto(getBitAt(bitsList, index));
            return (
              <BitCard
                key={item.id ?? index}
                bit={item}
                isActive={
                  // @ts-expect-error - bits inferred as never[] at call site
                  selectedBit?.id === item.id
                }
                onClick={() => onSelectBit(item)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
