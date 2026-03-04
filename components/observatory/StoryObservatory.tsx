'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { StoryPoint } from '@/lib/map-data/stories';
import { Headphones, Video, FileText } from 'lucide-react';
import { AudioEmotionVisualizer } from '@/components/mapa/AudioEmotionVisualizer';
import { PhotoStoryViewer } from '@/components/observatory/PhotoStoryViewer';
import { EMOTION_VISUALS, type EmotionVisual } from '@/lib/audioEmotion';
import { registerPulse } from '@/lib/userLocation';

interface StoryObservatoryProps {
  story: StoryPoint;
  /** Callback para que el fondo de la página responda a la emoción del audio */
  onEmotionChange?: (visual: EmotionVisual) => void;
}

type TabId = 'audio' | 'video' | 'text' | 'photos';

/** Cuerpo de texto con detección de fin de lectura (scroll 90%) para registrar huella. */
function StoryTextBody({
  body,
  storyId,
  onSpeak,
  isSpeaking,
}: {
  body: string;
  storyId: string;
  onSpeak: () => void;
  isSpeaking: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!storyId || !endRef.current) return;
    let fired = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !fired) {
          fired = true;
          void registerPulse(storyId);
        }
      },
      { threshold: 0.9 }
    );

    observer.observe(endRef.current);
    return () => observer.disconnect();
  }, [storyId]);

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          type="button"
          onClick={onSpeak}
          disabled={isSpeaking}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/90 hover:bg-white/15 disabled:opacity-60 transition font-medium text-sm"
        >
          <span aria-hidden>👁‍🗨</span>
          {isSpeaking ? 'Leyendo…' : 'Cerrar los ojos'}
        </button>
      </div>
      <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
        {body}
      </p>
      <div ref={endRef} style={{ height: 1 }} aria-hidden />
    </div>
  );
}

function defaultTabId(story: StoryPoint): TabId {
  const hasPhotos = (story.images?.length ?? 0) > 0 || Boolean(story.imageUrl);
  const hasVideo = story.hasVideo ?? Boolean(story.videoUrl);
  const hasAudio = story.hasAudio ?? Boolean(story.audioUrl);
  const hasText = story.hasText ?? Boolean(story.body || story.description);
  if (hasPhotos) return 'photos';
  if (hasVideo) return 'video';
  if (hasAudio) return 'audio';
  return 'text';
}

/** Web Speech API: voz suave para "Cerrar los ojos" (roadmap 1C). El fondo responde como con audio real. */
function useSpeakText(text: string, onEmotionChange?: (v: EmotionVisual) => void) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.trim());
    u.lang = 'es-ES';
    u.rate = 0.92;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const es = voices.find((v) => v.lang.startsWith('es'));
    if (es) u.voice = es;
    u.onstart = () => {
      setIsSpeaking(true);
      onEmotionChange?.(EMOTION_VISUALS.warm);
    };
    u.onend = u.onerror = () => {
      setIsSpeaking(false);
      onEmotionChange?.(EMOTION_VISUALS.silence);
    };
    window.speechSynthesis.speak(u);
  }, [text, onEmotionChange]);

  useEffect(() => {
    if (!isSpeaking) return;
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [isSpeaking]);

  return { speak, isSpeaking };
}

export function StoryObservatory({ story, onEmotionChange }: StoryObservatoryProps) {
  const defaultTab = useMemo(() => defaultTabId(story), [story]);
  const [tab, setTab] = useState<TabId>(defaultTab);
  const textBody = story.body || story.description || '';
  const { speak, isSpeaking } = useSpeakText(textBody, onEmotionChange);

  useEffect(() => {
    if (tab !== 'audio' && tab !== 'text') {
      if (onEmotionChange) onEmotionChange(EMOTION_VISUALS.silence);
    }
  }, [tab, onEmotionChange]);

  const location = [story.city, story.country].filter(Boolean).join(', ');
  const hasPhotos = (story.images?.length ?? 0) > 0 || Boolean(story.imageUrl);
  const hasAudio = story.hasAudio ?? Boolean(story.audioUrl);
  const hasVideo = story.hasVideo ?? Boolean(story.videoUrl);
  const hasText = story.hasText ?? Boolean(story.body || story.description);
  const photoImages = story.images?.length ? story.images : (story.imageUrl ? [story.imageUrl] : []);

  const tabs: { id: TabId; label: string; icon: React.ReactNode; disabled: boolean }[] = [
    { id: 'photos', label: 'Fotos', icon: <span className="text-base">📷</span>, disabled: !hasPhotos },
    { id: 'audio', label: 'Escuchar', icon: <Headphones size={18} />, disabled: !hasAudio },
    { id: 'video', label: 'Ver', icon: <Video size={18} />, disabled: !hasVideo },
    { id: 'text', label: 'Leer', icon: <FileText size={18} />, disabled: !hasText },
  ];

  return (
    <div className="flex flex-col gap-6">
      {location && (
        <p className="text-white/60 text-sm">{location}</p>
      )}
      {story.topic && (
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium w-fit">
          {story.topic}
        </span>
      )}

      <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={t.disabled}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? 'bg-white/15 text-white border border-white/20'
                : t.disabled
                  ? 'text-white/40 cursor-not-allowed'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden min-h-[200px]">
        {tab === 'photos' && (
          <div className="p-4">
            {hasPhotos ? (
              <PhotoStoryViewer
                images={photoImages}
                title={story.label}
                date={story.publishedAt}
              />
            ) : (
              <p className="text-white/50 py-8 text-center">No hay fotos en esta historia.</p>
            )}
          </div>
        )}
        {tab === 'audio' && (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            {hasAudio ? (
              <AudioEmotionVisualizer
                audioUrl={story.audioUrl!}
                onEmotion={onEmotionChange}
                storyId={story.id}
              />
            ) : (
              <p className="text-white/50">No hay audio disponible para esta historia.</p>
            )}
          </div>
        )}
        {tab === 'video' && (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            {hasVideo ? (
              <video
                controls
                src={story.videoUrl!}
                className="w-full max-w-2xl rounded-xl border border-white/10"
                playsInline
                onEnded={() => void registerPulse(story.id)}
              />
            ) : (
              <p className="text-white/50">No hay video disponible para esta historia.</p>
            )}
          </div>
        )}
        {tab === 'text' && (
          <StoryTextBody
            body={story.body || story.description || 'Sin contenido de texto aún.'}
            storyId={story.id}
            onSpeak={speak}
            isSpeaking={isSpeaking}
          />
        )}
      </div>
    </div>
  );
}
