'use client';

import { useSortable, useDraggable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Type, Image, Music } from 'lucide-react';

export type BlockType = 'frase' | 'imagen' | 'tono';

const BLOCK_CONFIG: Record<
  BlockType,
  { icon: typeof Type; color: string; label: string }
> = {
  frase: {
    icon: Type,
    color: 'from-amber-100 to-amber-50 border-amber-200/60',
    label: 'Frase',
  },
  imagen: {
    icon: Image,
    color: 'from-violet-100 to-violet-50 border-violet-200/60',
    label: 'Imagen',
  },
  tono: {
    icon: Music,
    color: 'from-emerald-100 to-emerald-50 border-emerald-200/60',
    label: 'Tono',
  },
};

export type RemixBlockData = {
  id: string;
  type: BlockType;
  content: string;
  sourceStory?: string;
};

type RemixBlockProps = {
  block: RemixBlockData;
  /** Si es true, el bloque está en la paleta (solo arrastrable hacia canvas). Si false, está en el canvas (sortable). */
  isInPalette?: boolean;
};

export function RemixBlock({ block, isInPalette = false }: RemixBlockProps) {
  const config = BLOCK_CONFIG[block.type];
  const Icon = config.icon;

  const sortable = useSortable({
    id: block.id,
    data: { type: 'block', block },
  });

  const draggable = useDraggable({
    id: block.id,
    data: { type: 'block', block },
  });

  const isSortable = !isInPalette;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = isSortable
    ? sortable
    : { ...draggable, transform: draggable.transform, transition: undefined };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-start gap-3 rounded-2xl p-4 transition-all duration-200
        bg-gradient-to-br ${config.color} border
        backdrop-blur-sm
        ${isDragging ? 'opacity-90 shadow-xl scale-105 z-50' : ''}
        ${isInPalette ? 'cursor-grab active:cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}
      `}
      {...attributes}
    >
      <button
        type="button"
        className="touch-none p-1 rounded-lg text-[#718096] hover:bg-white/50 hover:text-[#4A5568] transition-colors"
        aria-label="Arrastrar"
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-[#4A5568] shrink-0" />
          <span className="text-xs font-medium text-[#718096] uppercase tracking-wide">
            {config.label}
          </span>
          {block.sourceStory && (
            <span className="text-xs text-[#718096]/80 truncate">· {block.sourceStory}</span>
          )}
        </div>
        <p className="text-[#4A5568] text-sm leading-relaxed break-words">
          {block.content || '...'}
        </p>
      </div>
    </div>
  );
}

/** Bloque placeholder para agregar nuevos tipos en el futuro */
export function RemixBlockPlaceholder({ type }: { type: string }) {
  return (
    <div
      className="rounded-2xl p-4 border-2 border-dashed border-[#718096]/30 bg-white/30 backdrop-blur-sm text-[#718096] text-sm text-center"
      data-block-type={type}
    >
      + {type}
    </div>
  );
}
