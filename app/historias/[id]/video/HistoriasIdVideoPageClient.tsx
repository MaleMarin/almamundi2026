'use client';

/**
 * /historias/[id]/video — Cine Personal: intertítulo, proyección con iris wipe, pantalla de fin.
 * Solo para historias con videoUrl; si no hay video, redirige al detalle normal.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import VideoPlayer, { type Historia } from '@/components/historia/VideoPlayer';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { demoStoryFieldsFromPoint, showPublicDemoStories } from '@/lib/demo-stories-public';
import { DEMO_VIDEO_STORIES } from '@/lib/demo-video-stories';
import type { StoryPoint } from '@/lib/map-data/stories';
import { neu } from '@/lib/historias-neumorph';

function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#c23600" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#ff4500" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function storyToCineHistoria(s: StoryPoint): Historia {
  const nombre = s.authorName || 'Anónimo';
  const ubicacion = [s.city, s.country].filter(Boolean).join(', ') || undefined;
  const demoStory = demoStoryFieldsFromPoint(s);
  return {
    id: s.id,
    titulo: s.title || 'Sin título',
    subtitulo: ubicacion,
    autor: {
      nombre,
      avatar: s.imageUrl || defaultAvatar(nombre),
      ubicacion,
      bio: s.description,
    },
    videoUrl: s.videoUrl!,
    thumbnailUrl: s.imageUrl || s.videoUrl!,
    duracion: 0,
    fecha: s.publishedAt || '',
    tags: s.topic ? [s.topic] : undefined,
    citaDestacada: undefined,
    ...(demoStory ? { demoStory } : {}),
  };
}

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
          setHistoria(storyToCineHistoria(data.story));
        } else if (showPublicDemoStories() && id.startsWith('demo-video-')) {
          const demo = DEMO_VIDEO_STORIES.find((s) => s.id === id);
          if (demo?.videoUrl) {
            setHistoria(storyToCineHistoria(demo as StoryPoint));
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

  const crumbVideo = (
    <div className="w-full max-w-6xl shrink-0 px-3 pt-1 md:px-6">
      <Breadcrumbs
        items={
          loading || !historia
            ? [
                { label: 'Inicio', href: '/' },
                { label: 'Historias', href: '/historias' },
                { label: 'Videos', href: '/historias/videos' },
                { label: loading ? '…' : 'Video' },
              ]
            : [
                { label: 'Inicio', href: '/' },
                { label: 'Historias', href: '/historias' },
                { label: 'Videos', href: '/historias/videos' },
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
        {crumbVideo}
        <p className="font-sans text-sm" style={{ color: neu.orange }}>
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
        {crumbVideo}
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
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-0 flex-1 flex-col items-center gap-1">
      {crumbVideo}
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <VideoPlayer historia={historia} siteLayout />
      </div>
    </div>
  );
}
