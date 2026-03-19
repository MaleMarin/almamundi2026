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

function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#8b6914" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#c9a96e" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function storyToHistoriaAudio(s: StoryPoint): HistoriaAudio {
  const nombre = s.authorName ?? s.author?.name ?? 'Anónimo';
  const ubicacion = [s.city, s.country].filter(Boolean).join(', ') || undefined;
  const thumb = s.imageUrl ?? s.thumbnailUrl ?? '';
  return {
    id: s.id,
    titulo: s.title ?? 'Sin título',
    subtitulo: s.subtitle ?? ubicacion,
    audioUrl: s.audioUrl!,
    thumbnailUrl: thumb || defaultAvatar(nombre),
    duracion: 0,
    fecha: s.publishedAt ?? '',
    citaDestacada: s.quote,
    frases: undefined,
    autor: {
      nombre,
      avatar: s.author?.avatar ?? s.authorAvatar ?? defaultAvatar(nombre),
      ubicacion,
      bio: s.author?.bio,
    },
    tags: s.tags ?? (s.topic ? [s.topic] : undefined),
  };
}

export default function HistoriasIdAudioPage() {
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
        } else {
          setHistoria(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, router]);

  useEffect(() => {
    if (historia) {
      document.title = `${historia.titulo} · AlmaMundi`;
      if (historia.subtitulo) {
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', historia.subtitulo);
      }
    }
    return () => { document.title = 'AlmaMundi'; };
  }, [historia]);

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#111009', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,169,110,0.8)' }}>Cargando…</p>
      </div>
    );
  }

  if (!historia) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#111009', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '1.5rem' }}>
        <p style={{ fontFamily: "'Jost', sans-serif", color: 'rgba(245,240,232,0.7)' }}>No encontramos esta historia o no tiene audio.</p>
        <Link
          href="/historias"
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#c9a96e',
            border: '1px solid rgba(201,169,110,0.4)',
            textDecoration: 'none',
          }}
        >
          Ver historias
        </Link>
      </div>
    );
  }

  return (
    <AudioPlayer
      historia={historia}
      onClose={() => router.push(`/historias/${id}`)}
    />
  );
}
