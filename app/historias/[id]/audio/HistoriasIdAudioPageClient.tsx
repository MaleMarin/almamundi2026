'use client';

/**
 * /historias/[id]/audio — Reproductor de audio (AudioPlayer).
 * Solo para historias con audioUrl; si no hay audio, redirige al detalle normal.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AudioPlayer, { type HistoriaAudio } from '@/components/historia/AudioPlayer';
import type { StoryPoint } from '@/lib/map-data/stories';
import { storyToHistoriaAudio } from '@/lib/historias/audio-adapter';
import { getDemoStoryPointById } from '@/lib/historias/historias-demo-stories';

export default function HistoriasIdAudioPageClient() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [historia, setHistoria] = useState<HistoriaAudio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/stories/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { story?: StoryPoint } | null) => {
        if (cancelled) return;
        if (data?.story) {
          if (!data.story.audioUrl) {
            router.replace(`/historias/${id}`);
            return;
          }
          setHistoria(storyToHistoriaAudio(data.story));
        } else if (id.startsWith('demo-audio-')) {
          const sp = getDemoStoryPointById(id);
          if (sp?.audioUrl) setHistoria(storyToHistoriaAudio(sp));
          else setHistoria(null);
        } else {
          setHistoria(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#111009] flex items-center justify-center">
        <p className="font-sans text-sm tracking-widest uppercase text-[#ff4500]/80">Cargando…</p>
      </div>
    );
  }

  if (!historia) {
    return (
      <div className="fixed inset-0 bg-[#111009] flex flex-col items-center justify-center gap-6 px-6">
        <p className="font-sans text-[#f5f0e8]/70">No encontramos esta historia o no tiene audio.</p>
        <Link
          href="/historias"
          className="px-6 py-3 rounded-full text-sm font-medium text-[#ff4500] border border-[#ff4500]/40 hover:bg-[#ff4500]/10 transition-colors"
        >
          Ver historias
        </Link>
      </div>
    );
  }

  /** Misma presentación que `/historias/[id]/video`: experiencia a pantalla completa, sin volver al detalle neumórfico. */
  return <AudioPlayer historia={historia} />;
}
