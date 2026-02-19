'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';

const APP_FONT = 'Avenir, sans-serif';

export type TopicsModalStory = {
  id?: string;
  lat: number;
  lng: number;
  label: string;
  topic?: string;
  description?: string;
  city?: string;
  country?: string;
};

function stripLeadingIndex(title: string): string {
  return title.replace(/^\s*\d+\.\s*/g, '').trim();
}

function normalizeQuery(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function storySearchHaystack(s: TopicsModalStory): string {
  return normalizeQuery(
    [s.topic, s.label, s.description, s.city, s.country].filter(Boolean).join(' ')
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  topics: Array<{ title: string }>;
  stories: TopicsModalStory[];
  selectedTopic: string | null;
  onSelectTopic: (topicTitle: string) => void;
  onSelectStory: (story: TopicsModalStory) => void;
  onClearTopic: () => void;
  exploreQuery?: string;
  onExploreQueryChange?: (q: string) => void;
};

export function TopicsModal({
  open,
  onClose,
  topics,
  stories,
  selectedTopic,
  onSelectTopic,
  onSelectStory,
  onClearTopic,
  exploreQuery = '',
  onExploreQueryChange
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [localQuery, setLocalQuery] = useState('');
  const query = onExploreQueryChange ? exploreQuery : localQuery;
  const setQuery = onExploreQueryChange ?? setLocalQuery;

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const q = normalizeQuery(query);
  const filteredTopics = useMemo(() => {
    const list = topics
      .map((t) => ({ raw: t.title, title: stripLeadingIndex(t.title) }))
      .filter((t) => !/tema\s*libre/i.test(t.title));
    if (!q) return list;
    return list.filter((t) => normalizeQuery(t.title).includes(q));
  }, [topics, q]);

  const storyHits = useMemo(() => {
    if (!q) return [];
    return stories
      .filter((s) => storySearchHaystack(s).includes(q))
      .slice(0, 10);
  }, [stories, q]);

  if (!open || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/55 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="temas-modal-title"
          className="w-[92vw] max-w-[860px] max-h-[70vh] rounded-3xl border border-white/10 bg-[rgba(10,18,35,0.55)] shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col"
          style={{ fontFamily: APP_FONT }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header: Temas + X */}
          <div className="shrink-0 p-5 md:p-6 border-b border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h3 id="temas-modal-title" className="text-white font-semibold tracking-tight text-lg">
                Temas
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-full grid place-items-center text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                aria-label="Cerrar temas"
              >
                <X size={18} />
              </button>
            </div>

            {/* Único input de búsqueda: temas e historias */}
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/45">
                <Search size={18} />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Explora un tema o historia..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/35 outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:border-orange-500/40"
              />
            </div>

            {selectedTopic && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-white/55">
                  Filtro activo: <span className="text-white/85 font-semibold">{selectedTopic}</span>
                </div>
                <button
                  type="button"
                  onClick={onClearTopic}
                  className="text-xs font-semibold text-orange-300/90 hover:text-orange-200 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                >
                  Limpiar filtro
                </button>
              </div>
            )}
          </div>

          {/* Lista scrolleable: solo Temas + (opcional) Historias cuando hay búsqueda */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* Lista de temas filtrados */}
            <section>
              <div className="text-[11px] font-black tracking-widest uppercase text-white/55 mb-3">
                Temas
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredTopics.map((t, idx) => (
                  <button
                    key={`topic-${idx}-${t.raw}`}
                    type="button"
                    onClick={() => {
                      onSelectTopic(t.title);
                      onClose();
                    }}
                    className="text-left px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                  >
                    <div className="text-sm font-semibold leading-snug">{t.title}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Lista de historias filtradas: solo cuando hay búsqueda en el input superior */}
            {q.length > 0 && (
              <section>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-black tracking-widest uppercase text-white/55">
                    Historias
                  </div>
                  <div className="text-xs text-white/40">
                    {storyHits.length > 0 ? `Resultados: ${storyHits.length}` : 'Sin coincidencias'}
                  </div>
                </div>
                {storyHits.length === 0 && (
                  <div className="mt-3 text-sm text-white/45">Sin coincidencias en historias.</div>
                )}
                {storyHits.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {storyHits.map((s, idx) => (
                      <button
                        key={`story-hit-${idx}-${s.id ?? ''}-${s.lat}-${s.lng}-${s.label}`}
                        type="button"
                        onClick={() => {
                          onSelectStory(s);
                          onClose();
                        }}
                        className="w-full text-left px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                      >
                        <div className="text-sm font-semibold leading-snug">{s.label}</div>
                        {(s.city || s.country || s.topic) && (
                          <div className="text-xs text-white/55 mt-1">
                            {[s.topic, s.city, s.country].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
