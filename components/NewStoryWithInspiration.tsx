'use client';

import { useState, useCallback } from 'react';
import { Quote, Sparkles, Heart, Sun } from 'lucide-react';

export type SuggestedStory = {
  id: string;
  title: string;
  excerpt: string;
  emotion?: string;
  theme?: string;
};

type NewStoryWithInspirationProps = {
  /** Al publicar, se incluye "Inspirado en la historia de X" si hay inspiración seleccionada */
  onSubmit?: (content: string, inspiredBy?: SuggestedStory) => void;
  /** Sugerencias similares por emoción o tema (pueden venir de un backend) */
  suggestedStories?: SuggestedStory[];
};

const EMOTION_ICONS: Record<string, typeof Heart> = {
  esperanza: Heart,
  calma: Sun,
  nostalgia: Heart,
  alegría: Sparkles,
  reflexión: Quote,
};

const DEFAULT_SUGGESTIONS: SuggestedStory[] = [
  { id: 's1', title: 'Raíces', excerpt: 'De dónde venimos.', emotion: 'nostalgia', theme: 'origen' },
  { id: 's2', title: 'El viaje', excerpt: 'Caminos que se cruzan.', emotion: 'esperanza', theme: 'camino' },
  { id: 's3', title: 'Encuentros', excerpt: 'Personas que marcan.', emotion: 'alegría', theme: 'personas' },
  { id: 's4', title: 'Umbral', excerpt: 'Un antes y un después.', emotion: 'reflexión', theme: 'transformación' },
];

export default function NewStoryWithInspiration({
  onSubmit,
  suggestedStories = DEFAULT_SUGGESTIONS,
}: NewStoryWithInspirationProps) {
  const [content, setContent] = useState('');
  const [inspiredBy, setInspiredBy] = useState<SuggestedStory | null>(null);
  const [suggestions] = useState<SuggestedStory[]>(suggestedStories);

  const handleSubmit = useCallback(() => {
    onSubmit?.(content, inspiredBy ?? undefined);
  }, [content, inspiredBy, onSubmit]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '6px 6px 16px rgba(163,177,198,0.35), -6px -6px 16px rgba(255,255,255,0.5)',
        }}
      >
        <label className="block text-sm font-medium text-[#4A5568] mb-2">Tu historia</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe aquí... Las historias similares aparecerán abajo."
          rows={8}
          className="w-full rounded-xl px-4 py-3 text-[#4A5568] placeholder-[#718096]/70 resize-y focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
          style={{
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: 'inset 2px 2px 8px rgba(163,177,198,0.2)',
          }}
        />
      </div>

      {/* Sugerencias similares por emoción o tema */}
      <section>
        <h3 className="text-sm font-semibold text-[#4A5568] uppercase tracking-wide mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Historias similares (por emoción o tema)
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((story) => {
            const Icon = (story.emotion && EMOTION_ICONS[story.emotion]) || Quote;
            const isSelected = inspiredBy?.id === story.id;
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => setInspiredBy(isSelected ? null : story)}
                className="text-left rounded-2xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: isSelected ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${isSelected ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.5)'}`,
                  boxShadow: isSelected
                    ? '6px 6px 14px rgba(163,177,198,0.35)'
                    : '6px 6px 14px rgba(163,177,198,0.3), -6px -6px 14px rgba(255,255,255,0.4)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="rounded-lg p-2 shrink-0"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      boxShadow: 'inset 1px 1px 4px rgba(163,177,198,0.3)',
                    }}
                  >
                    <Icon className="w-4 h-4 text-amber-600/80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#4A5568] text-sm">{story.title}</p>
                    <p className="text-[#718096] text-xs mt-0.5 line-clamp-2">{story.excerpt}</p>
                    {story.emotion && (
                      <span className="inline-block mt-2 text-xs text-amber-700/80 font-medium">
                        {story.emotion}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-[#4A5568]"
                    style={{
                      background: 'rgba(232,236,241,0.9)',
                      boxShadow: '2px 2px 6px rgba(163,177,198,0.3)',
                    }}
                  >
                    Citar
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-[#4A5568]"
                    style={{
                      background: 'rgba(232,236,241,0.9)',
                      boxShadow: '2px 2px 6px rgba(163,177,198,0.3)',
                    }}
                  >
                    Usar como base
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {inspiredBy && (
        <p
          className="rounded-xl px-4 py-2 text-sm text-[#718096]"
          style={{
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.4)',
          }}
        >
          Al publicar se incluirá: <strong className="text-[#4A5568]">Inspirado en la historia de «{inspiredBy.title}»</strong>
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full rounded-2xl py-3.5 px-4 font-semibold text-[#4A5568] transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: '#E8ECF1',
          boxShadow: '8px 8px 18px rgba(163,177,198,0.5), -8px -8px 18px rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.4)',
        }}
      >
        Publicar historia
      </button>
    </div>
  );
}
