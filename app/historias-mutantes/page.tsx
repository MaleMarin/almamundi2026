'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, GitBranch, BookOpen } from 'lucide-react';

export type MutantStoryNode = {
  id: string;
  title: string;
  excerpt: string;
  slug?: string;
  children?: MutantStoryNode[];
};

/* Datos de ejemplo: historia raíz con ramificaciones "¿y si...?" */
const TREE_DATA: MutantStoryNode = {
  id: 'root',
  title: 'El cruce',
  excerpt: 'Una decisión en la estación cambia todo.',
  slug: 'el-cruce',
  children: [
    {
      id: 'a1',
      title: 'El tren que no tomé',
      excerpt: 'Si hubiera subido a ese vagón...',
      slug: 'tren-que-no-tome',
      children: [
        {
          id: 'a1b1',
          title: 'La ciudad que nunca vi',
          excerpt: 'Otra vida en otra ciudad.',
          slug: 'ciudad-que-nunca-vi',
          children: [],
        },
      ],
    },
    {
      id: 'a2',
      title: 'El mismo tren',
      excerpt: 'Seguir el camino de siempre.',
      slug: 'mismo-tren',
      children: [
        {
          id: 'a2b1',
          title: 'El pasajero de enfrente',
          excerpt: 'Una conversación que lo cambió todo.',
          slug: 'pasajero-enfrente',
          children: [],
        },
        {
          id: 'a2b2',
          title: 'La parada equivocada',
          excerpt: 'Bajé en la estación que no era.',
          slug: 'parada-equivocada',
          children: [],
        },
      ],
    },
  ],
};

const GLASS = {
  card: 'rgba(255,255,255,0.85)',
  border: 'rgba(255,255,255,0.5)',
  shadow: 'rgba(163,177,198,0.35)',
  text: '#4A5568',
  textSoft: '#718096',
};

function TreeNode({
  node,
  depth,
  x,
  y,
  offsetX,
  onSelect,
}: {
  node: MutantStoryNode;
  depth: number;
  x: number;
  y: number;
  offsetX: number;
  onSelect: (n: MutantStoryNode) => void;
}) {
  const [hover, setHover] = useState(false);
  const childCount = node.children?.length ?? 0;
  const nodeWidth = 180;
  const nodeHeight = 72;
  const verticalGap = 24;
  const horizontalGap = 48;

  const childY = y + nodeHeight + verticalGap;
  const totalChildWidth = childCount * (nodeWidth + horizontalGap) - horizontalGap;
  const startX = x - totalChildWidth / 2 + nodeWidth / 2 + horizontalGap / 2;

  return (
    <g>
      {/* Líneas a hijos */}
      {node.children?.map((child, i) => {
        const cx = startX + i * (nodeWidth + horizontalGap);
        const cy = childY - verticalGap / 2;
        const path = `M ${x} ${y + nodeHeight / 2} L ${x} ${cy} L ${cx} ${cy} L ${cx} ${childY - nodeHeight / 2}`;
        return (
          <path
            key={child.id}
            d={path}
            fill="none"
            stroke={GLASS.shadow}
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.7"
          />
        );
      })}

      {/* Nodo: tarjeta glassmorphism */}
      <g
        transform={`translate(${x - nodeWidth / 2}, ${y})`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ cursor: 'pointer' }}
      >
        <rect
          width={nodeWidth}
          height={nodeHeight}
          rx="12"
          ry="12"
          fill={GLASS.card}
          stroke={GLASS.border}
          strokeWidth="1"
          filter={hover ? 'url(#shadow-strong)' : 'url(#shadow-soft)'}
          onClick={() => onSelect(node)}
        />
        <text
          x={nodeWidth / 2}
          y={22}
          textAnchor="middle"
          fill={GLASS.text}
          fontSize="13"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
        >
          {node.title.length > 22 ? node.title.slice(0, 21) + '…' : node.title}
        </text>
        <text
          x={nodeWidth / 2}
          y={42}
          textAnchor="middle"
          fill={GLASS.textSoft}
          fontSize="11"
          fontFamily="system-ui, sans-serif"
        >
          {node.excerpt.length > 26 ? node.excerpt.slice(0, 25) + '…' : node.excerpt}
        </text>
        <text
          x={nodeWidth / 2}
          y={60}
          textAnchor="middle"
          fill={GLASS.textSoft}
          fontSize="10"
          fontFamily="system-ui, sans-serif"
        >
          Leer →
        </text>
      </g>

      {/* Hijos recursivos */}
      {node.children?.map((child, i) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          x={startX + i * (nodeWidth + horizontalGap)}
          y={childY}
          offsetX={offsetX}
          onSelect={onSelect}
        />
      ))}
    </g>
  );
}

function computeTreeLayout(node: MutantStoryNode, depth: number): { width: number; height: number } {
  const nodeHeight = 72;
  const verticalGap = 24;
  const horizontalGap = 48;
  const nodeWidth = 180;

  if (!node.children?.length) {
    return { width: nodeWidth, height: nodeHeight };
  }

  let totalWidth = 0;
  let maxChildHeight = 0;
  for (const child of node.children) {
    const childLayout = computeTreeLayout(child, depth + 1);
    totalWidth += childLayout.width + (totalWidth > 0 ? horizontalGap : 0);
    maxChildHeight = Math.max(maxChildHeight, childLayout.height);
  }

  const width = Math.max(nodeWidth, totalWidth);
  const height = nodeHeight + verticalGap + maxChildHeight;
  return { width, height };
}

export default function HistoriasMutantesPage() {
  const [selected, setSelected] = useState<MutantStoryNode | null>(null);
  const layout = useMemo(() => computeTreeLayout(TREE_DATA, 0), []);
  const svgWidth = Math.max(layout.width + 80, 520);
  const svgHeight = Math.max(layout.height + 80, 420);
  const rootX = svgWidth / 2;
  const rootY = 48;

  return (
    <div className="min-h-screen bg-[#E8ECF1] text-[#4A5568] font-[system-ui,sans-serif] antialiased">
      <header
        className="sticky top-0 z-20 px-4 py-4 md:px-8"
        style={{
          background: 'rgba(232,236,241,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.4)',
          boxShadow: '0 4px 24px rgba(163,177,198,0.12)',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: '#E8ECF1',
              boxShadow: '8px 8px 16px rgba(163,177,198,0.5), -8px -8px 16px rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            <ArrowLeft className="w-5 h-5 text-[#718096]" />
            <span className="text-sm font-medium">Volver</span>
          </Link>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-amber-600/80" aria-hidden />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: '#4A5568' }}>
              Historias Mutantes
            </h1>
          </div>
          <div className="w-[100px] md:w-[120px]" aria-hidden />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
        <p
          className="rounded-2xl px-5 py-3 mb-6 text-center text-[#718096] text-sm"
          style={{
            background: 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: 'inset 2px 2px 8px rgba(255,255,255,0.5)',
          }}
        >
          Cada historia puede tener ramificaciones alternativas. Haz clic en un nodo para leer.
        </p>

        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.45)',
            boxShadow: 'inset 4px 4px 12px rgba(255,255,255,0.4), 12px 12px 28px rgba(163,177,198,0.35)',
          }}
        >
          <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <defs>
              <filter id="shadow-soft" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor={GLASS.shadow} floodOpacity="0.5" />
              </filter>
              <filter id="shadow-strong" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor={GLASS.shadow} floodOpacity="0.6" />
              </filter>
            </defs>
            <TreeNode
              node={TREE_DATA}
              depth={0}
              x={rootX}
              y={rootY}
              offsetX={180 + 48}
              onSelect={setSelected}
            />
          </svg>
        </div>

        {selected && (
          <div
            className="mt-6 rounded-2xl p-5 flex flex-wrap items-center gap-4"
            style={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '8px 8px 20px rgba(163,177,198,0.4)',
            }}
          >
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-[#4A5568]">{selected.title}</h2>
              <p className="text-sm text-[#718096] mt-1">{selected.excerpt}</p>
            </div>
            <Link
              href={`/story/${selected.slug ?? selected.id}`}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[#4A5568] transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: '#E8ECF1',
                boxShadow: '6px 6px 12px rgba(163,177,198,0.45), -6px -6px 12px rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.4)',
              }}
            >
              <BookOpen className="w-4 h-4" />
              Leer historia
            </Link>
          </div>
        )}
      </main>

      <footer className="px-4 py-8 text-center text-[#718096] text-sm">
        AlmaMundi · Historias Mutantes
      </footer>
    </div>
  );
}
