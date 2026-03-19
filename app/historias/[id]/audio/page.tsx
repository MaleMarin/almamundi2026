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
import { MOCK_STORIES } from '@/lib/almamundi/mock-data';

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
        } else if (id === 'demo-audio-1') {
          const m = MOCK_STORIES.audio;
          setHistoria({
            id: m.id,
            titulo: m.titulo,
            subtitulo: m.subtitulo,
            audioUrl: m.audioUrl,
            thumbnailUrl: m.thumbnailUrl,
            duracion: m.duracion,
            fecha: m.fecha,
            citaDestacada: m.citaDestacada,
            frases: m.frases,
            autor: { nombre: m.autor.nombre, avatar: m.autor.avatar, ubicacion: m.autor.ubicacion, bio: (m.autor as { bio?: string }).bio } as HistoriaAudio['autor'],
            tags: m.tags,
          });
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
