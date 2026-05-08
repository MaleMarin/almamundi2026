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
import { neu, historiasInterior } from '@/lib/historias-neumorph';

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
      <main
        className={historiasInterior.mainClassName}
        style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}
      >
        <div className={`${historiasInterior.contentWrapClassName} flex w-full flex-1 flex-col`}>
          <section
            className="flex w-full flex-1 flex-col items-center justify-center px-4 py-10 md:px-10"
            aria-busy="true"
          >
            <p className="font-sans text-sm tracking-wide" style={{ color: neu.orange }}>
              Cargando…
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!historia) {
    return (
      <main
        className={historiasInterior.mainClassName}
        style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}
      >
        <div className={`${historiasInterior.contentWrapClassName} flex w-full flex-1 flex-col`}>
          <section className="flex w-full flex-1 flex-col items-center justify-center gap-6 px-6 py-16 md:py-24">
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
          </section>
        </div>
      </main>
    );
  }

  /** Masthead + migas (`GlobalSiteChrome`) + esta columna + footer global (`RootLayout`). */
  return (
    <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <div className={`${historiasInterior.contentWrapClassName} flex w-full flex-1 flex-col min-h-0`}>
        <section className="flex w-full flex-1 flex-col items-center justify-center px-4 pb-12 pt-6 md:px-10 md:pb-16 md:pt-10 min-h-0">
          <AudioPlayer historia={historia} presentation="embed" />
        </section>
      </div>
    </main>
  );
}
