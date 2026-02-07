'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

type Huella = {
  id: string;
  x: number;
  y: number;
  label: string;
  emotion: string;
  connections: number[]; // ids de otras huellas
};

const HUELLAS_DATA: Huella[] = [
  { id: '1', x: 20, y: 25, label: 'Raíces', emotion: 'calma', connections: [2, 4] },
  { id: '2', x: 45, y: 20, label: 'El viaje', emotion: 'luz', connections: [1, 3, 5] },
  { id: '3', x: 70, y: 30, label: 'Encuentros', emotion: 'comunidad', connections: [2, 4, 6] },
  { id: '4', x: 25, y: 55, label: 'Umbral', emotion: 'tensión', connections: [1, 3, 5] },
  { id: '5', x: 50, y: 60, label: 'Casa común', emotion: 'comunidad', connections: [2, 4, 6] },
  { id: '6', x: 75, y: 55, label: 'Semilla', emotion: 'luz', connections: [3, 5] },
];

function useHuellasLayout() {
  return useMemo(() => HUELLAS_DATA, []);
}

type HuellasMapProps = {
  /** Si true, solo muestra el mapa (sin título ni párrafos). Útil para incrustar en /explora. */
  compact?: boolean;
};

export default function HuellasMap({ compact = false }: HuellasMapProps) {
  const huellas = useHuellasLayout();
  const [hoverId, setHoverId] = useState<string | null>(null);

  const connectedIds = useMemo(() => {
    if (!hoverId) return new Set<string>();
    const h = huellas.find((x) => x.id === hoverId);
    if (!h) return new Set<string>();
    const set = new Set<string>([hoverId]);
    h.connections.forEach((c) => set.add(String(c)));
    huellas.forEach((x) => {
      if (x.connections.includes(Number(hoverId))) set.add(x.id);
    });
    return set;
  }, [hoverId, huellas]);

  const isHighlight = useCallback(
    (id: string) => hoverId === null || connectedIds.has(id),
    [hoverId, connectedIds]
  );

  const isLinkHighlight = useCallback(
    (a: string, b: string) => connectedIds.has(a) && connectedIds.has(b),
    [connectedIds]
  );

  const content = (
    <>
      {!compact && (
        <>
          <h2
            className="font-display font-semibold text-2xl sm:text-3xl text-earth-800 text-center mb-4"
            style={{ fontFamily: 'var(--font-raleway)' }}
          >
            Mapa de huellas
          </h2>
          <p className="text-earth-600 text-center max-w-xl mx-auto mb-10">
            Cada punto es una historia. Pasa el cursor sobre una huella para ver cómo se conecta con otras por emoción.
          </p>
        </>
      )}
      <div
          className="relative rounded-3xl overflow-hidden mx-auto"
          style={{
            background: 'rgba(255,255,255,0.35)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: 'inset 4px 4px 16px rgba(255,255,255,0.4), 12px 12px 32px rgba(163,177,198,0.15)',
          }}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-auto min-h-[320px] sm:min-h-[400px]"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Líneas entre huellas: se iluminan al hover */}
            <g>
              {huellas.flatMap((a) =>
                a.connections.map((bId) => {
                  const b = huellas.find((x) => x.id === String(bId));
                  if (!b || a.id >= b.id) return null;
                  const highlight = isLinkHighlight(a.id, b.id);
                  return (
                    <line
                      key={`${a.id}-${b.id}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={highlight ? '#94a187' : 'rgba(125,143,111,0.2)'}
                      strokeWidth={highlight ? 1.2 : 0.6}
                      strokeLinecap="round"
                      transition="stroke 0.2s"
                    />
                  );
                })
              )}
            </g>
            {/* Puntos (huellas) */}
            {huellas.map((h) => {
              const active = isHighlight(h.id);
              return (
                <g
                  key={h.id}
                  onMouseEnter={() => setHoverId(h.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <motion.circle
                    cx={h.x}
                    cy={h.y}
                    r={active ? 3.2 : 2.4}
                    fill={active ? '#d9a24b' : '#c4956a'}
                    opacity={active ? 0.95 : 0.6}
                    initial={false}
                    transition={{ duration: 0.2 }}
                  />
                  {/* Tooltip al hover */}
                  {hoverId === h.id && (
                    <g>
                      <rect
                        x={h.x + 4}
                        y={h.y - 3}
                        width={22}
                        height={8}
                        rx={4}
                        fill="rgba(255,255,255,0.92)"
                        stroke="rgba(255,255,255,0.6)"
                        strokeWidth={0.5}
                        filter="drop-shadow(0 2px 8px rgba(0,0,0,0.08))"
                      />
                      <text
                        x={h.x + 15}
                        y={h.y + 2}
                        textAnchor="middle"
                        fontSize={3.2}
                        fill="#3d3630"
                        fontFamily="system-ui, sans-serif"
                      >
                        {h.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

      {!compact && (
        <p className="text-center text-sm text-earth-600 mt-4">
          Haz clic en una huella para abrir la historia (próximamente enlazado al listado).
        </p>
      )}
    </>
  );

  if (compact) {
    return <div className="p-4 sm:p-6">{content}</div>;
  }

  return (
    <section id="huellas" className="py-16 px-6">
      <motion.div
        className="max-w-5xl mx-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        {content}
      </motion.div>
    </section>
  );
}
