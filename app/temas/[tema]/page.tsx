'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';

/**
 * /temas/[tema] — Historias filtradas por tema. Neumorfismo.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useStories } from '@/hooks/useStories';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { Footer } from '@/components/layout/Footer';
import { getTemaBySlug } from '@/lib/temas-list';
import type { StoryPoint } from '@/lib/map-data/stories';

function normalizeTema(t: string | undefined): string {
  if (!t || typeof t !== 'string') return '';
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u0300-\u036f/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function formatPlace(s: StoryPoint): string {
  return [s.city, s.country].filter(Boolean).join(', ') || s.label || '—';
}

function timeAgo(publishedAt: string | undefined): string {
  if (!publishedAt) return '—';
  const d = new Date(publishedAt);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  if (days < 14) return 'hace 1 semana';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function getFormat(s: StoryPoint): 'video' | 'audio' | 'text' | 'photo' {
  if (s.videoUrl || s.hasVideo) return 'video';
  if (s.audioUrl || s.hasAudio) return 'audio';
  if (s.imageUrl) return 'photo';
  return 'text';
}

export default function TemaPage() {
  const params = useParams();
  const slug = (params?.tema as string) ?? '';
  const tema = getTemaBySlug(slug);
  const stories = useStories();

  const list = useMemo(() => {
    const base = stories.filter((s) => !(s as StoryPoint & { isDemo?: boolean }).isDemo);
    if (!slug) return base;
    const slugNorm = slug.toLowerCase();
    return base.filter((s) => {
      const topic = s.topic;
      if (!topic) return false;
      const n = normalizeTema(topic);
      return n === slugNorm || n.includes(slugNorm) || slugNorm.includes(n);
    });
  }, [stories, slug]);

  if (!tema) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
        <p style={{ color: neu.textBody }}>Tema no encontrado.</p>
        <Link href="/temas" className="btn-almamundi px-6 py-3 rounded-full font-medium" style={{ ...neu.button, color: neu.textMain }}>← Temas</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className={historiasInterior.navClassName} style={historiasInterior.navBarStyle}>
        <HomeHardLink href="/" className="flex items-center flex-shrink-0 min-w-0 pr-2" aria-label="AlmaMundi — inicio">
          <img src={historiasInterior.logoSrc} alt="AlmaMundi" className={historiasInterior.logoClassName} />
        </HomeHardLink>
        <div className={historiasInterior.navLinksRowClassName}>
          <ActiveInternalNavLink href="/temas" className="btn-almamundi btn-almamundi-interior-nav px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button }}>← Temas</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#intro" className="btn-almamundi btn-almamundi-interior-nav px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button }}>Nuestro propósito</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#como-funciona" className="btn-almamundi btn-almamundi-interior-nav px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button }}>¿Cómo funciona?</ActiveInternalNavLink>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button }} className="[&_button]:btn-almamundi [&_button]:btn-almamundi-interior-nav" />
          <ActiveInternalNavLink href="/#mapa" className="btn-almamundi btn-almamundi-interior-nav px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button }}>Mapa</ActiveInternalNavLink>
        </div>
      </nav>

      <section className="px-6 md:px-12 py-10 md:py-12 max-w-5xl mx-auto">
        <Link href="/temas" className="inline-flex items-center gap-2 text-sm md:text-base mb-8" style={{ color: neu.textBody }}>← Temas</Link>
        <div className="rounded-2xl p-6 md:p-8 mb-10" style={{ ...neu.card, borderTop: `3px solid ${tema.color}` }}>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] mb-3" style={{ color: neu.textMain }}>{tema.name}</h1>
          {tema.description && (
            <p className="text-base leading-relaxed mb-3" style={{ color: neu.textBody }}>{tema.description}</p>
          )}
          <p className="text-sm" style={{ color: neu.textBody }}>
            {list.length} {list.length === 1 ? 'historia' : 'historias'} en este tema
          </p>
        </div>

        {list.length === 0 ? (
          <p className="py-8" style={{ color: neu.textBody }}>Aún no hay historias con este tema.</p>
        ) : (
          <div className="space-y-4">
            {list.map((s) => (
              <Link
                key={s.id}
                href={`/historias/${s.id}`}
                className="block p-5 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={neu.card}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold tracking-widest uppercase text-amber-700 mb-1">{formatPlace(s)}</div>
                    <h2 className="text-lg font-semibold tracking-tight text-gray-800 line-clamp-2">{s.title || 'Sin título'}</h2>
                    {s.description && <p className="text-sm text-gray-600 line-clamp-1 mt-1">{s.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500 capitalize">{getFormat(s)}</span>
                    <span className="text-xs text-gray-400">{timeAgo(s.publishedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
