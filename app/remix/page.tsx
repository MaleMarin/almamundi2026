'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import { RemixBlock, type RemixBlockData } from '@/components/RemixBlock';

/* Datos de ejemplo: bloques que el usuario puede arrastrar desde "otras historias" */
const PALETTE_BLOCKS: RemixBlockData[] = [
  { id: 'p-1', type: 'frase', content: 'El camino se hace al andar.', sourceStory: 'Raíces' },
  { id: 'p-2', type: 'imagen', content: 'Una ventana abierta al atardecer.', sourceStory: 'El viaje' },
  { id: 'p-3', type: 'tono', content: 'Calma, esperanza.', sourceStory: 'Encuentros' },
  { id: 'p-4', type: 'frase', content: 'Cada encuentro deja una semilla.', sourceStory: 'Tejiendo' },
  { id: 'p-5', type: 'tono', content: 'Nostalgia suave.', sourceStory: 'Memoria' },
];

const CANVAS_DROP_ID = 'canvas-drop';

function CanvasDropZone({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROP_ID });
  return (
    <section
      ref={setNodeRef}
      className={className}
      style={{
        background: isOver ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.25)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.45)',
        boxShadow: 'inset 4px 4px 12px rgba(255,255,255,0.4), 12px 12px 28px rgba(163,177,198,0.35)',
      }}
    >
      {children}
    </section>
  );
}

export default function RemixPage() {
  const [canvasBlocks, setCanvasBlocks] = useState<RemixBlockData[]>([]);
  const [paletteBlocks] = useState<RemixBlockData[]>(PALETTE_BLOCKS);
  const [activeId, setActiveId] = useState<string | null>(null);

  const allIds = [...canvasBlocks.map((b) => b.id), ...paletteBlocks.map((b) => b.id)];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromPalette = paletteBlocks.some((b) => b.id === activeId);
    const overCanvas = canvasBlocks.some((b) => b.id === overId);
    const overPalette = paletteBlocks.some((b) => b.id === overId);

    if (fromPalette && (overCanvas || overId === CANVAS_DROP_ID)) {
      const block = paletteBlocks.find((b) => b.id === activeId);
      if (block) {
        const newBlock: RemixBlockData = {
          ...block,
          id: `c-${Date.now()}-${block.id}`,
        };
        setCanvasBlocks((prev) => [...prev, newBlock]);
      }
      return;
    }

    const oldIndex = canvasBlocks.findIndex((b) => b.id === activeId);
    const newIndex = canvasBlocks.findIndex((b) => b.id === overId);
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      setCanvasBlocks((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  }, [canvasBlocks, paletteBlocks]);

  const activeBlock = activeId
    ? [...canvasBlocks, ...paletteBlocks].find((b) => b.id === activeId)
    : null;

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
            <Layers className="w-5 h-5 text-violet-600/80" aria-hidden />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: '#4A5568' }}>
              Remix Narrativo
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
          Arrastra frases, imágenes o tonos desde la paleta a tu composición. Reordena con drag & drop.
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Paleta: bloques disponibles */}
            <aside
              className="lg:col-span-1 rounded-3xl p-5 space-y-3 max-h-[70vh] overflow-y-auto"
              style={{
                background: 'rgba(255,255,255,0.35)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '9px 9px 18px rgba(163,177,198,0.4), -9px -9px 18px rgba(255,255,255,0.5)',
              }}
            >
              <h2 className="text-sm font-semibold text-[#4A5568] uppercase tracking-wide mb-4">
                Bloques para remix
              </h2>
              {paletteBlocks.map((block) => (
                <RemixBlock key={block.id} block={block} isInPalette />
              ))}
            </aside>

            {/* Canvas: composición */}
            <CanvasDropZone className="lg:col-span-2 rounded-3xl p-6 min-h-[420px] transition-colors duration-200">
              <h2 className="text-sm font-semibold text-[#4A5568] uppercase tracking-wide mb-4">
                Tu composición
              </h2>
              <SortableContext items={canvasBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {canvasBlocks.length === 0 ? (
                    <div
                      className="rounded-2xl border-2 border-dashed border-[#718096]/30 py-12 text-center text-[#718096] text-sm"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                    >
                      Suelta aquí bloques de la paleta
                    </div>
                  ) : (
                    canvasBlocks.map((block) => (
                      <RemixBlock key={block.id} block={block} isInPalette={false} />
                    ))
                  )}
                </div>
              </SortableContext>
            </CanvasDropZone>
          </div>

          <DragOverlay>
            {activeBlock ? (
              <div className="rounded-2xl shadow-2xl opacity-95">
                <RemixBlock block={activeBlock} isInPalette />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <footer className="px-4 py-8 text-center text-[#718096] text-sm">
        AlmaMundi · Remix Narrativo
      </footer>
    </div>
  );
}
