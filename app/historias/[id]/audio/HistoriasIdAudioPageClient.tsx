'use client';

/**
 * /historias/[id]/audio — Reproductor de audio (AudioPlayer).
 * Solo para historias con audioUrl; si no hay audio, redirige al detalle normal.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AudioPlayer, { type HistoriaAudio } from '@/components/historia/AudioPlayer';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import type { StoryPoint } from '@/lib/map-data/stories';
import { storyToHistoriaAudio } from '@/lib/historias/audio-adapter';
import { getDemoStoryPointById } from '@/lib/historias/historias-demo-stories';
import { neu } from '@/lib/historias-neumorph';

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

  const crumbAudios = (
    <div className="w-full max-w-[480px] shrink-0 px-1 pt-1 md:px-0">
      <Breadcrumbs
        items={
          loading || !historia
            ? [
                { label: 'Inicio', href: '/' },
                { label: 'Historias', href: '/historias' },
                { label: 'Audios', href: '/historias/audios' },
                { label: loading ? '…' : 'Audio' },
              ]
            : [
                { label: 'Inicio', href: '/' },
                { label: 'Historias', href: '/historias' },
                { label: 'Audios', href: '/historias/audios' },
                { label: historia.titulo },
              ]
        }
      />
    </div>
  );

  if (loading) {
    return (
      <div
        className="flex w-full flex-1 flex-col items-center gap-3 min-h-[50vh]"
        style={{ backgroundColor: neu.bg }}
      >
        {crumbAudios}
        <p className="font-sans text-sm tracking-wide text-[color:var(--almamundi-orange)]" style={{ color: neu.orange }}>
          Cargando…
        </p>
      </div>
    );
  }

  if (!historia) {
    return (
      <div
        className="flex w-full flex-1 min-h-[50vh] flex-col items-center justify-center gap-6 px-6"
        style={{ backgroundColor: neu.bg }}
      >
        {crumbAudios}
        <p className="font-sans text-center" style={{ color: neu.textBody }}>
          No encontramos esta historia o no tiene audio.
        </p>
        <Link
          href="/historias"
          className="rounded-full border border-[color:var(--almamundi-orange)]/40 px-6 py-3 text-sm font-medium transition-colors hover:bg-[#ff4500]/10"
          style={{ color: neu.orange }}
        >
          Ver historias
        </Link>
      </div>
    );
  }

  /** Incrustado en layout global: masthead y footer como el resto del sitio. */
  return (
    <div className="flex w-full min-h-0 flex-1 flex-col items-center gap-1">
      {crumbAudios}
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <AudioPlayer historia={historia} presentation="embed" />
      </div>
    </div>
  );
}
