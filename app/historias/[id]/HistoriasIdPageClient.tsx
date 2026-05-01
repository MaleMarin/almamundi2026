'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';

/**
 * /historias/[id] — Historia individual. Neumorfismo fuerte.
 * Texto a la izquierda, vídeo/audio/imagen a la derecha, CTA "Subir mi historia", Más historias de [país].
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { DemoStoryDisclosure } from '@/components/stories/DemoStoryDisclosure';
import { showPublicDemoStories, storyShowsDemoDisclaimer } from '@/lib/demo-stories-public';
import { getDemoStoryPointById } from '@/lib/historias/historias-demo-stories';
import type { StoryPoint } from '@/lib/map-data/stories';
import type { HistoriasFormatListActiveTab } from '@/components/historias/HistoriasFormatListPageLayout';

type SimilarStory = {
  id: string;
  title: string;
  label?: string;
  description?: string;
  city?: string | null;
  country?: string | null;
  format?: string;
  publishedAt?: string | null;
};

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
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

export default function HistoriasIdPageClient() {
  const params = useParams();
  const id = params?.id as string;
  const [story, setStory] = useState<StoryPoint | null>(null);
  const [similar, setSimilar] = useState<SimilarStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/stories/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { story?: StoryPoint } | null) => {
        if (cancelled) return;
        if (data?.story) {
          setStory(data.story);
        } else if (showPublicDemoStories() && id.startsWith('demo-')) {
          const demo = getDemoStoryPointById(id);
          if (demo) setStory(demo);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/stories/${id}/similar`)
      .then((r) => (r.ok ? r.json() : { similar: [] }))
      .then((data: { similar?: SimilarStory[] }) => {
        if (!cancelled && Array.isArray(data.similar)) setSimilar(data.similar.filter((s) => s.id !== id));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
        <p style={{ color: neu.textBody }}>Cargando…</p>
      </main>
    );
  }
  if (!story) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
        <p style={{ color: neu.textBody }}>No encontramos esta historia.</p>
        <Link href="/historias" className="btn-almamundi px-6 py-3 rounded-full font-medium" style={{ ...neu.button, color: neu.textMain }}>
          ← Historias
        </Link>
      </main>
    );
  }

  const place = formatPlace(story);
  const hasVideo = Boolean(story.videoUrl || story.hasVideo);
  const hasAudio = Boolean(story.audioUrl || story.hasAudio);
  const hasBody = Boolean((story.body ?? '').trim());
  const hasImage = Boolean(story.imageUrl || (story as StoryPoint & { images?: string[] }).images?.length);

  /** Misma barra que `HistoriasFormatListPageLayout` (/historias/videos, …); pestaña según medio principal. */
  const formatNavActiveTab: HistoriasFormatListActiveTab = hasVideo
    ? 'videos'
    : hasAudio
      ? 'audios'
      : hasBody
        ? 'escrito'
        : hasImage
          ? 'fotos'
          : 'videos';

  return (
    <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className={historiasInterior.navClassName} style={historiasInterior.navBarStyle}>
        <HomeHardLink href="/" className="flex items-center flex-shrink-0 min-w-0 pr-2">
          <img src={historiasInterior.logoSrc} alt="AlmaMundi" className={historiasInterior.logoClassName} />
        </HomeHardLink>
        <div className={historiasInterior.navLinksRowClassName}>
          <ActiveInternalNavLink href="/#proposito" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.navLinkIdle }}>
            Nuestro propósito
          </ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#como-funciona" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.navLinkIdle }}>
            ¿Cómo funciona?
          </ActiveInternalNavLink>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.navLinkIdle }} className={historiasInterior.navHistoriasAccordionClassName} />
          <ActiveInternalNavLink
            href="/historias/videos"
            className={formatNavActiveTab === 'videos' ? `btn-almamundi ${historiasInterior.navActiveClassName}` : historiasInterior.navLinkClassName}
            style={formatNavActiveTab === 'videos' ? neu.cardInset : { ...neu.button, color: neu.navLinkIdle }}
          >
            Videos
          </ActiveInternalNavLink>
          <ActiveInternalNavLink
            href="/historias/audios"
            className={formatNavActiveTab === 'audios' ? `btn-almamundi ${historiasInterior.navActiveClassName}` : historiasInterior.navLinkClassName}
            style={formatNavActiveTab === 'audios' ? neu.cardInset : { ...neu.button, color: neu.navLinkIdle }}
          >
            Audios
          </ActiveInternalNavLink>
          <ActiveInternalNavLink
            href="/historias/escrito"
            className={formatNavActiveTab === 'escrito' ? `btn-almamundi ${historiasInterior.navActiveClassName}` : historiasInterior.navLinkClassName}
            style={formatNavActiveTab === 'escrito' ? neu.cardInset : { ...neu.button, color: neu.navLinkIdle }}
          >
            Escritos
          </ActiveInternalNavLink>
          <ActiveInternalNavLink
            href="/historias/fotos"
            className={formatNavActiveTab === 'fotos' ? `btn-almamundi ${historiasInterior.navActiveClassName}` : historiasInterior.navLinkClassName}
            style={formatNavActiveTab === 'fotos' ? neu.cardInset : { ...neu.button, color: neu.navLinkIdle }}
          >
            Fotografías
          </ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#mapa" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.navLinkIdle }}>
            Mapa
          </ActiveInternalNavLink>
        </div>
      </nav>

      <div className={`${historiasInterior.contentWrapClassName} ${historiasInterior.sectionGrowClassName}`}>
        <section className="px-6 md:px-12 py-10 md:py-14 max-w-6xl mx-auto flex-1">
          <Link href="/historias" className="inline-flex items-center gap-2 text-sm md:text-base mb-8" style={{ color: neu.textBody }}>
            ← Historias
          </Link>

          {storyShowsDemoDisclaimer(story) ? (
            <div className="mb-8 max-w-2xl">
              <DemoStoryDisclosure story={story} variant="page" onLightBackground />
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-12">
            <div>
              <div className="text-xs font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: 'var(--almamundi-orange)' }}>
                {place} · {hasVideo ? 'Videos' : hasAudio ? 'Audios' : hasImage ? 'Fotografías' : 'Escritos'} · {timeAgo(story.publishedAt)}
              </div>
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] mb-4" style={{ color: neu.textMain }}>
                {story.title || 'Sin título'}
              </h1>
              {story.body && (
                <>
                  <div className="text-base leading-relaxed mb-4" style={{ color: neu.textBody }}>
                    {story.body}
                  </div>
                  <Link
                    href={`/historias/${story.id}/texto`}
                    className="inline-block px-4 py-2 rounded-full text-xs font-medium border border-orange-500/50 hover:bg-orange-50 mb-8"
                    style={{ color: 'var(--almamundi-orange)' }}
                  >
                    Leer en modo lectura →
                  </Link>
                </>
              )}
              <div className="rounded-2xl p-6 mb-8" style={neu.cardInset}>
                <p className="text-xl font-semibold tracking-tight mb-2" style={{ color: neu.textMain }}>
                  ¿Estuviste aquí o conocés algo de este lugar?
                </p>
                <p className="text-sm mb-4" style={{ color: neu.textBody }}>
                  Contá tu historia o experiencia.
                </p>
                <HomeHardLink
                  href="/#historias"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: 'var(--almamundi-orange)' }}
                >
                  + Subir mi historia
                </HomeHardLink>
              </div>
            </div>
            <div>
              <div className="relative rounded-2xl overflow-hidden aspect-video flex items-center justify-center" style={neu.card}>
                {hasVideo && story.videoUrl ? (
                  <>
                    <video src={story.videoUrl} controls className="w-full h-full object-contain" />
                    <Link
                      href={`/historias/${story.id}/video`}
                      className="absolute bottom-3 right-3 px-4 py-2 rounded-full text-xs font-medium text-white border border-orange-500/50 transition-colors"
                      style={{ backgroundColor: 'var(--almamundi-orange)' }}
                    >
                      Ver en cine
                    </Link>
                  </>
                ) : hasAudio && story.audioUrl ? (
                  <div className="p-8 w-full flex flex-col items-center gap-4">
                    <audio src={story.audioUrl} controls className="w-full max-w-md" />
                    <Link
                      href={`/historias/${story.id}/audio`}
                      className="px-4 py-2 rounded-full text-xs font-medium text-white border border-orange-500/50 transition-colors"
                      style={{ backgroundColor: 'var(--almamundi-orange)' }}
                    >
                      Abrir reproductor
                    </Link>
                  </div>
                ) : hasImage ? (
                  <>
                    {story.imageUrl ? (
                      <img src={story.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={neu.cardInset}>
                        <span className="text-4xl opacity-50">📷</span>
                      </div>
                    )}
                    <Link
                      href={`/historias/${story.id}/foto`}
                      className="absolute bottom-3 right-3 px-4 py-2 rounded-full text-xs font-medium text-white border border-orange-500/50 transition-colors"
                      style={{ backgroundColor: 'var(--almamundi-orange)' }}
                    >
                      Ver álbum
                    </Link>
                  </>
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={neu.cardInset}>
                    <span className="text-4xl opacity-50">📖</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300/40 pt-8">
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-4">
              {story.country ? `Más historias de ${story.country}` : 'Más historias'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mb-6">
              {similar.slice(0, 3).map((s) => (
                <Link
                  key={s.id}
                  href={`/historias/${s.id}`}
                  className="block p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.99]"
                  style={neu.card}
                >
                  <div className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--almamundi-orange)' }}>
                    {[s.city, s.country].filter(Boolean).join(', ') || '—'}
                  </div>
                  <h3 className="font-semibold tracking-tight text-gray-800 line-clamp-2 text-sm">{s.title || 'Sin título'}</h3>
                </Link>
              ))}
            </div>
            <Link href="/historias" className={`btn-almamundi inline-block ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textMain }}>
              Ver todas las historias
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
