'use client';

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import ForceGraph2D from 'react-force-graph-2d';

/* ------------------------------------------------------------------ */
/* TIPOS (listos para conectar a backend)                             */
/* ------------------------------------------------------------------ */
export type ConnectionType = 'inspiración' | 'cita' | 'continuación';

export type StoryNode = {
  id: string;
  name: string;
  excerpt?: string;
  group?: string;
  val?: number;
  /** Slug o ID para URL /story/[id] — backend puede proveer */
  slug?: string;
};

export type StoryLink = {
  source: string;
  target: string;
  /** Tipo de conexión entre historias */
  relation?: ConnectionType | string;
};

export type GraphData = {
  nodes: StoryNode[];
  links: StoryLink[];
};

/* ------------------------------------------------------------------ */
/* DATOS DE EJEMPLO (sustituibles por fetch desde backend)            */
/* ------------------------------------------------------------------ */
const defaultGraphData: GraphData = {
  nodes: [
    { id: '1', name: 'Raíces', excerpt: 'De dónde venimos', group: 'origen', val: 10, slug: 'raices' },
    { id: '2', name: 'El viaje', excerpt: 'Caminos que se cruzan', group: 'camino', val: 8, slug: 'el-viaje' },
    { id: '3', name: 'Encuentros', excerpt: 'Personas que marcan', group: 'personas', val: 9, slug: 'encuentros' },
    { id: '4', name: 'Umbral', excerpt: 'Un antes y un después', group: 'transformación', val: 7, slug: 'umbral' },
    { id: '5', name: 'Tejiendo', excerpt: 'Hilos que unen', group: 'tejido', val: 8, slug: 'tejiendo' },
    { id: '6', name: 'Casa común', excerpt: 'El mundo que compartimos', group: 'comunidad', val: 9, slug: 'casa-comun' },
    { id: '7', name: 'Semilla', excerpt: 'Lo que dejamos crecer', group: 'futuro', val: 6, slug: 'semilla' },
    { id: '8', name: 'Memoria', excerpt: 'Lo que perdura', group: 'origen', val: 7, slug: 'memoria' },
  ],
  links: [
    { source: '1', target: '2', relation: 'inspiración' },
    { source: '2', target: '3', relation: 'continuación' },
    { source: '3', target: '4', relation: 'inspiración' },
    { source: '4', target: '5', relation: 'continuación' },
    { source: '5', target: '6', relation: 'inspiración' },
    { source: '6', target: '7', relation: 'continuación' },
    { source: '1', target: '8', relation: 'cita' },
    { source: '8', target: '5', relation: 'inspiración' },
    { source: '3', target: '6', relation: 'cita' },
    { source: '2', target: '5', relation: 'continuación' },
  ],
};

const NEUMO = {
  bg: '#E8ECF1',
  light: 'rgba(255,255,255,0.85)',
  shadow: 'rgba(163,177,198,0.5)',
  glass: 'rgba(255,255,255,0.25)',
  glassBorder: 'rgba(255,255,255,0.4)',
  linkStroke: 'rgba(120,130,150,0.35)',
};

function drawNodeGlass(
  node: StoryNode & { x?: number; y?: number },
  ctx: CanvasRenderingContext2D,
  globalScale: number
) {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const size = Math.max(4, (node.val ?? 6) * 1.2);
  const scale = Math.min(globalScale, 2);
  const r = size * scale;

  ctx.beginPath();
  ctx.arc(x, y, r + 2, 0, 2 * Math.PI);
  ctx.fillStyle = NEUMO.shadow;
  ctx.shadowColor = NEUMO.shadow;
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  const gradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  gradient.addColorStop(0, NEUMO.light);
  gradient.addColorStop(0.5, NEUMO.glass);
  gradient.addColorStop(1, NEUMO.shadow);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = NEUMO.glassBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, r * 0.35, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
}

function drawLinkSoft(
  link: { source: { x?: number; y?: number }; target: { x?: number; y?: number } },
  ctx: CanvasRenderingContext2D
) {
  const sx = link.source.x ?? 0;
  const sy = link.source.y ?? 0;
  const tx = link.target.x ?? 0;
  const ty = link.target.y ?? 0;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(tx, ty);
  ctx.strokeStyle = NEUMO.linkStroke;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.stroke();
}

type StoriesNetworkProps = {
  /** Datos desde backend; si no se pasa, se usan datos de ejemplo */
  graphData?: GraphData;
};

export default function StoriesNetwork({ graphData: externalData }: StoriesNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);

  const graphData = useMemo(() => externalData ?? defaultGraphData, [externalData]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => {
      const rect = el.getBoundingClientRect();
      setDimensions({ w: rect.width, h: rect.height });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nodeCanvasObject = useCallback(
    (node: StoryNode & { x?: number; y?: number }, ctx: CanvasRenderingContext2D, globalScale: number) => {
      drawNodeGlass(node, ctx, globalScale);
    },
    []
  );

  const linkCanvasObject = useCallback(
    (
      link: StoryLink & { source: { x?: number; y?: number }; target: { x?: number; y?: number } },
      ctx: CanvasRenderingContext2D
    ) => {
      drawLinkSoft(link, ctx);
    },
    []
  );

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div
        ref={containerRef}
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{
          background: NEUMO.bg,
          boxShadow: 'inset 6px 6px 12px rgba(163,177,198,0.4), inset -6px -6px 12px rgba(255,255,255,0.6)',
        }}
      >
        <ForceGraph2D
          graphData={graphData}
          width={dimensions.w}
          height={dimensions.h}
          backgroundColor="transparent"
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode="replace"
          linkCanvasObject={linkCanvasObject}
          linkCanvasObjectMode="replace"
          nodeLabel={(n) => {
            const node = n as StoryNode;
            const conn = (graphData.links.find(
              (l) => (l.source as StoryNode)?.id === node.id || (l.target as StoryNode)?.id === node.id
            ) as StoryLink)?.relation;
            return `<div class="p-3 rounded-xl" style="
              background: rgba(255,255,255,0.9);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255,255,255,0.5);
              box-shadow: 6px 6px 12px rgba(163,177,198,0.4);
              color: #4A5568;
              font-family: system-ui, sans-serif;
              font-size: 14px;
              max-width: 220px;
            ">
              <strong>${node.name}</strong>
              ${node.excerpt ? `<br/><span style="color:#718096;font-size:12px">${node.excerpt}</span>` : ''}
              ${conn ? `<br/><span style="color:#b45309;font-size:11px">Conexión: ${conn}</span>` : ''}
              <br/><span style="font-size:11px;color:#718096">Clic para leer</span>
            </div>`;
          }}
          linkLabel={(l) => (l as StoryLink).relation ?? 'conecta'}
          onNodeClick={(node) => {
            const n = node as StoryNode;
            setSelectedNode(n);
          }}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          enableNodeDrag
          minZoom={0.3}
          maxZoom={3}
        />
      </div>

      {/* Tarjeta emergente neumórfica: clic en nodo → leer historia (espacio para backend) */}
      {selectedNode && (
        <div
          className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-10 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            boxShadow: '8px 8px 20px rgba(163,177,198,0.5), -8px -8px 20px rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          <p className="text-[#4A5568] font-semibold">{selectedNode.name}</p>
          {selectedNode.excerpt && (
            <p className="text-[#718096] text-sm mt-1">{selectedNode.excerpt}</p>
          )}
          <Link
            href={`/story/${selectedNode.slug ?? selectedNode.id}`}
            className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-[#4A5568] transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: '#E8ECF1',
              boxShadow: '6px 6px 12px rgba(163,177,198,0.45), -6px -6px 12px rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.4)',
            }}
          >
            Leer historia
          </Link>
          <button
            type="button"
            onClick={() => setSelectedNode(null)}
            className="ml-2 text-[#718096] text-sm underline"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
