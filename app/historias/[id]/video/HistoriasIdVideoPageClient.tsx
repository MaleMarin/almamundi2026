'use client';

/**
 * /historias/[id]/video — Cine Personal: intertítulo, proyección con iris wipe, pantalla de fin.
 * Solo para historias con videoUrl; si no hay video, redirige al detalle normal.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import VideoPlayer, { type Historia } from '@/components/historia/VideoPlayer';
import { showPublicDemoStories } from '@/lib/demo-stories-public';
import { DEMO_VIDEO_STORIES } from '@/lib/demo-video-stories';
import type { StoryPoint } from '@/lib/map-data/stories';
import { storyToVideoHistoria } from '@/lib/historias/video-adapter';
import { neu, historiasInterior } from '@/lib/historias-neumorph';

export default function HistoriasIdVideoPageClient() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [historia, setHistoria] = useState<Historia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/stories/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { story?: StoryPoint } | null) => {
        if (cancelled) return;
        if (data?.story) {
          if (!data.story.videoUrl) {
            router.replace(`/historias/${id}`);
            return;
          }
          setHistoria(storyToVideoHistoria(data.story));
        } else if (showPublicDemoStories() && id.startsWith('demo-video-')) {
          const demo = DEMO_VIDEO_STORIES.find((s) => s.id === id);
          if (demo?.videoUrl) {
            setHistoria(storyToVideoHistoria(demo as StoryPoint));
          } else router.replace(`/historias/${id}`);
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
      <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
        <div className={`${historiasInterior.contentWrapClassName} flex w-full flex-1 flex-col`}>
          <section className="flex flex-1 flex-col items-center justify-center px-4 py-16" aria-busy="true">
            <p className="font-sans text-sm" style={{ color: neu.orange }}>
              Cargando…
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!historia) {
    return (
      <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
        <div className={`${historiasInterior.contentWrapClassName} flex w-full flex-1 flex-col`}>
          <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
            <p className="font-sans text-center" style={{ color: neu.textBody }}>
              No encontramos esta historia o no tiene video.
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

  return (
    <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <div className={`${historiasInterior.contentWrapClassName} flex w-full flex-1 flex-col min-h-0`}>
        <section className="flex w-full min-h-0 flex-1 flex-col">
          <VideoPlayer historia={historia} siteLayout />
        </section>
      </div>
    </main>
  );
}
