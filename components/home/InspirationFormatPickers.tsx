'use client';

import { useState } from 'react';
import { X, ChevronDown, Video, Mic, PenLine, Camera } from 'lucide-react';
import { INSPIRATION_TOPICS } from '@/lib/topics';
import type { ChosenInspirationTopic, StoryModalMode } from '@/components/home/StoryModal';

const APP_FONT = "'Avenir Light', Avenir, system-ui, sans-serif";

const soft = {
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  flat: {
    backgroundColor: '#E8EBF2',
    borderRadius: '32px',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: [
      '14px 14px 34px rgba(136, 150, 170, 0.48)',
      '-14px -14px 38px rgba(255, 255, 255, 0.98)',
      'inset 2px 2px 4px rgba(255, 255, 255, 0.75)',
      'inset -3px -3px 8px rgba(163, 177, 198, 0.22)',
    ].join(', '),
  },
  inset: {
    backgroundColor: '#E0E5EC',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow:
      'inset 8px 8px 14px rgba(163,177,198,0.7), inset -8px -8px 14px rgba(255,255,255,0.85)',
  },
  button: {
    backgroundColor: '#E9ECF3',
    borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontFamily: APP_FONT,
    transition: 'transform 0.2s ease, box-shadow 0.25s ease, color 0.2s ease',
    boxShadow: [
      '11px 11px 26px rgba(136, 150, 170, 0.45)',
      '-11px -11px 26px rgba(255, 255, 255, 0.96)',
      'inset 1px 1px 3px rgba(255, 255, 255, 0.65)',
      'inset -2px -2px 6px rgba(163, 177, 198, 0.18)',
    ].join(', '),
  },
} as const;

export type InspirationFormatPickersProps = {
  inspirationOpen: boolean;
  onCloseInspiration: () => void;
  formatPickerOpen: boolean;
  onCloseFormatPicker: () => void;
  onTopicCommitted: (topic: ChosenInspirationTopic) => void;
  onFormatCommitted: (mode: StoryModalMode) => void;
};

export function InspirationFormatPickers({
  inspirationOpen,
  onCloseInspiration,
  formatPickerOpen,
  onCloseFormatPicker,
  onTopicCommitted,
  onFormatCommitted,
}: InspirationFormatPickersProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      {inspirationOpen && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center p-3 sm:p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspiration-modal-title"
        >
          <div
            className="flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden"
            style={{ ...soft.flat, fontFamily: APP_FONT }}
          >
            <div
              className="flex shrink-0 items-start justify-between gap-4 border-b border-white/30 px-6 py-5 md:px-8"
              style={{ backgroundColor: soft.bg }}
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-600">ALMAMUNDI</p>
                <h2 id="inspiration-modal-title" className="mt-1 text-2xl font-light text-gray-700 md:text-3xl">
                  ¿No sabes qué contar?
                </h2>
                <p className="mt-2 text-base" style={{ color: soft.textBody }}>
                  Elige un tema; después podrás decidir si lo cuentas en video, audio, texto o fotos.
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseInspiration}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:text-red-600"
                style={soft.button}
                aria-label="Cerrar inspiración"
              >
                <X size={22} strokeWidth={2} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 md:px-8" style={{ backgroundColor: soft.bg }}>
              <div className="space-y-3">
                {INSPIRATION_TOPICS.map((topic, idx) => {
                  const isActive = activeIndex === idx;
                  const committed: ChosenInspirationTopic = {
                    title: topic.title,
                    questions: topic.questions,
                  };
                  return (
                    <div key={topic.title} className="overflow-hidden rounded-[28px]">
                      <button
                        type="button"
                        onClick={() => setActiveIndex(isActive ? null : idx)}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left transition active:scale-[0.99] md:p-5"
                        style={!isActive ? soft.button : soft.inset}
                        aria-expanded={isActive}
                        aria-controls={`inspiration-panel-${idx}`}
                      >
                        <span className={`text-base font-bold md:text-lg ${isActive ? 'text-orange-600' : 'text-gray-700'}`}>
                          {topic.title}
                        </span>
                        <ChevronDown
                          className={`shrink-0 text-gray-400 transition-transform ${isActive ? 'rotate-180 text-orange-500' : ''}`}
                          size={22}
                          aria-hidden
                        />
                      </button>
                      <div
                        id={`inspiration-panel-${idx}`}
                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${isActive ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <ul className="space-y-3 px-4 pb-5 pl-8 pt-1 md:px-6">
                            {topic.questions.map((q) => (
                              <li key={q} className="relative pl-5 text-sm leading-relaxed md:text-base" style={{ color: soft.textBody }}>
                                <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-orange-400" aria-hidden />
                                {q}
                              </li>
                            ))}
                          </ul>
                          <div className="px-4 pb-4 md:px-6">
                            <button
                              type="button"
                              onClick={() => {
                                onTopicCommitted(committed);
                                setActiveIndex(null);
                              }}
                              className="w-full rounded-full py-3.5 text-sm font-bold uppercase tracking-wide text-white md:py-4 md:text-base"
                              style={{
                                background: 'linear-gradient(180deg,#ff4500,#e63e00)',
                                boxShadow: '0 8px 24px rgba(255,69,0,0.35)',
                              }}
                              aria-label={`Usar tema ${topic.title}`}
                            >
                              Usar este tema
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {formatPickerOpen && (
        <div
          className="fixed inset-0 z-[215] flex items-center justify-center p-3 sm:p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="format-picker-title"
        >
          <div
            className="w-full max-w-lg rounded-[32px] p-6 md:p-8"
            style={{ ...soft.flat, fontFamily: APP_FONT }}
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-600">ALMAMUNDI</p>
                <h2 id="format-picker-title" className="mt-1 text-xl font-light text-gray-800 md:text-2xl">
                  ¿Cómo quieres contarlo?
                </h2>
                <p className="mt-2 text-sm text-gray-600">Elige un formato. Podrás cambiar de idea cerrando y eligiendo otra tarjeta en la página.</p>
              </div>
              <button
                type="button"
                onClick={onCloseFormatPicker}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-600"
                style={soft.button}
                aria-label="Cerrar selector de formato"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  { mode: 'video' as const, label: 'Video', Icon: Video },
                  { mode: 'audio' as const, label: 'Audio', Icon: Mic },
                  { mode: 'texto' as const, label: 'Texto', Icon: PenLine },
                  { mode: 'foto' as const, label: 'Fotografía', Icon: Camera },
                ] as const
              ).map(({ mode, label, Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onFormatCommitted(mode)}
                  className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl py-4 text-base font-bold text-gray-700 md:min-h-[64px] md:text-lg"
                  style={soft.button}
                  aria-label={`Contar en formato ${label}`}
                >
                  <Icon className="h-6 w-6 text-orange-500" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
