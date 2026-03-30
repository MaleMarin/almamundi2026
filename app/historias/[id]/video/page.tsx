'use client';

/**
 * /historias/[id]/video — Cine Personal: intertítulo, proyección con iris wipe, pantalla de fin.
 * Solo para historias con videoUrl; si no hay video, redirige al detalle normal.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import VideoPlayer, { type Historia } from '@/components/historia/VideoPlayer';
import { DEMO_VIDEO_STORIES } from '@/lib/demo-video-stories';
import type { StoryPoint } from '@/lib/map-data/stories';

function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#c23600" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#ff4500" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function storyToCineHistoria(s: StoryPoint): Historia {
  const nombre = s.authorName || 'Anónimo';
  const ubicacion = [s.city, s.country].filter(Boolean).join(', ') || undefined;
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
  };
}

export default function HistoriasIdVideoPage() {
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
        } else if (id.startsWith('demo-video-')) {
          const demo = DEMO_VIDEO_STORIES.find((s) => s.id === id);
          if (demo?.videoUrl) setHistoria(storyToCineHistoria(demo as StoryPoint));
          else router.replace(`/historias/${id}`);
        } else {
          setHistoria(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
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
        <p className="font-sans text-[#f5f0e8]/70">No encontramos esta historia o no tiene video.</p>
        <Link
          href="/historias"
          className="px-6 py-3 rounded-full text-sm font-medium text-[#ff4500] border border-[#ff4500]/40 hover:bg-[#ff4500]/10 transition-colors"
        >
          Ver historias
        </Link>
      </div>
    );
  }

  return <VideoPlayer historia={historia} />;
}
