'use client';

/**
 * /historias/[id] — ficha pública. El mensaje para el equipo no se muestra.
 */
import { useState } from 'react';
import Link from 'next/link';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { ShareAfterNotice } from '@/components/stories/ShareAfterNotice';
import { RespondeALine } from '@/components/historia/RespondeALine';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
import { parseCancionRelacionadaHref } from '@/lib/cancion-relacionada';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { TemaTags } from '@/components/historias/TemaTags';
import type { AlmaLocale } from '@/lib/i18n/locale';
import type { StoryPoint } from '@/lib/map-data/stories';

const FORMAT_LABEL: Record<AlmaLocale, Record<string, string>> = {
  es: { video: 'Video', audio: 'Audio', image: 'Foto', foto: 'Foto', photos: 'Foto', text: 'Texto', texto: 'Texto' },
  pt: { video: 'Vídeo', audio: 'Áudio', image: 'Foto', foto: 'Foto', photos: 'Foto', text: 'Texto', texto: 'Texto' },
  en: { video: 'Video', audio: 'Audio', image: 'Photo', foto: 'Photo', photos: 'Photo', text: 'Text', texto: 'Text' },
};

const COPY = {
  es: {
    by: (name: string) => `Por ${name}`,
    today: 'Hoy',
    yesterday: 'Ayer',
    days: (n: number) => `hace ${n} días`,
    read: 'Leer en modo lectura',
    map: 'Ver en el mapa',
    share: 'Compartir',
    songLead: 'Una canción para esta historia:',
    song: (song: string) => `Una canción para esta historia: ${song}`,
    ask: '¿Tienes una historia que contar?',
    tell: 'Cuenta la tuya',
    all: 'Ver todas las historias',
    back: 'Historias',
  },
  pt: {
    by: (name: string) => `Por ${name}`,
    today: 'Hoje',
    yesterday: 'Ontem',
    days: (n: number) => `há ${n} dias`,
    read: 'Ler em modo leitura',
    map: 'Ver no mapa',
    share: 'Partilhar',
    songLead: 'Uma música para esta história:',
    song: (song: string) => `Uma música para esta história: ${song}`,
    ask: 'Tem uma história para contar?',
    tell: 'Conte a sua',
    all: 'Ver todas as histórias',
    back: 'Histórias',
  },
  en: {
    by: (name: string) => `By ${name}`,
    today: 'Today',
    yesterday: 'Yesterday',
    days: (n: number) => `${n} days ago`,
    read: 'Read in reading mode',
    map: 'See on the map',
    share: 'Share',
    songLead: 'A song for this story:',
    song: (song: string) => `A song for this story: ${song}`,
    ask: 'Do you have a story to tell?',
    tell: 'Tell yours',
    all: 'See all stories',
    back: 'Stories',
  },
} as const;

function aliasName(raw: string | undefined): string {
  const name = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!name) return '';
  return name.charAt(0).toLocaleUpperCase('es-CL') + name.slice(1);
}

function whenLabel(publishedAt: string | undefined, locale: AlmaLocale): string {
  const copy = COPY[locale];
  if (!publishedAt) return '';
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return copy.today;
  if (days === 1) return copy.yesterday;
  if (days < 7) return copy.days(days);
  return date.toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'pt' ? 'pt-BR' : 'es-CL', {
    day: 'numeric',
    month: 'long',
  });
}

function storyKind(story: StoryPoint): 'video' | 'audio' | 'image' | 'text' {
  const format = (story.format ?? '').toLowerCase();
  if (format === 'video') return 'video';
  if (format === 'audio') return 'audio';
  if (format === 'image' || format === 'foto' || format === 'photos') return 'image';
  if (format === 'text' || format === 'texto') return 'text';
  if (story.videoUrl || story.hasVideo) return 'video';
  if (story.audioUrl || story.hasAudio) return 'audio';
  if (story.imageUrl || (story.imagenes?.length ?? 0) > 0) return 'image';
  return 'text';
}

export default function HistoriasIdPageClient({ story }: { story: StoryPoint }) {
  const { locale } = useHomeLocale();
  const copy = COPY[locale];
  const [shareOpen, setShareOpen] = useState(false);

  const kind = storyKind(story);
  const place = formatPublicPlace(story.city, story.country);
  const when = whenLabel(story.publishedAt, locale);
  const kicker = [FORMAT_LABEL[locale][kind] ?? FORMAT_LABEL[locale].text, place, when]
    .filter(Boolean)
    .join(' · ');
  const alias = aliasName(story.authorName);
  const song = story.cancionRelacionada?.trim() ?? '';
  const songHref = song ? parseCancionRelacionadaHref(song) : null;
  const photos = (story.imagenes ?? []).map((item) => item.url).filter(Boolean);
  const image = story.imageUrl || photos[0] || '';

  return (
    <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <div className={`${historiasInterior.contentWrapClassName} ${historiasInterior.sectionGrowClassName}`}>
        <section className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:px-6 md:py-12">
          <Link
            href="/historias"
            className="mb-6 inline-flex items-center gap-2 text-[length:var(--fs-pequeno)]"
            style={{ color: neu.textBody }}
          >
            ← {copy.back}
          </Link>

          <p
            className="mb-3 text-[length:var(--fs-etiqueta)] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--almamundi-orange)' }}
          >
            {kicker}
          </p>
          <RespondeALine questionId={story.questionId} questionMode={story.questionMode} color={neu.textBody} />
          <h1 className="mb-2 text-[length:var(--fs-titular)] font-normal leading-[1.1]" style={{ color: neu.textMain }}>
            {story.title || 'Sin título'}
          </h1>
          {alias ? (
            <p className="mb-4 text-[length:var(--fs-pequeno)]" style={{ color: neu.textBody }}>
              {copy.by(alias)}
            </p>
          ) : null}
          <TemaTags ids={story.temas} tone="light" className="mb-6" />

          <div className="mb-5 overflow-hidden rounded-2xl" style={neu.card}>
            {kind === 'video' && story.videoUrl ? (
              <video src={story.videoUrl} controls playsInline className="aspect-video w-full bg-black object-contain" />
            ) : kind === 'audio' && story.audioUrl ? (
              <div className="px-4 py-8 sm:px-8">
                <audio src={story.audioUrl} controls className="w-full" />
              </div>
            ) : kind === 'image' && (image || photos.length > 0) ? (
              <div className="flex flex-col gap-3 p-3 sm:p-4">
                {(photos.length > 0 ? photos : [image]).map((url) => (
                  <img key={url} src={url} alt="" className="w-full rounded-xl object-contain" />
                ))}
              </div>
            ) : (
              <div
                className="whitespace-pre-wrap px-5 py-6 text-[length:var(--fs-pequeno)] leading-relaxed sm:px-8"
                style={{ color: neu.textBody }}
              >
                {story.body || story.excerpt || ''}
              </div>
            )}
          </div>

          {kind === 'text' ? (
            <Link
              href={`/historias/${story.id}/texto`}
              className="mb-4 inline-block text-[length:var(--fs-etiqueta)] font-medium"
              style={{ color: 'var(--almamundi-orange)' }}
            >
              {copy.read}
            </Link>
          ) : null}

          {song ? (
            <p className="mb-5 text-[length:var(--fs-etiqueta)] leading-relaxed" style={{ color: neu.textBody }}>
              {songHref ? (
                <>
                  {copy.songLead}{' '}
                  <a href={songHref} target="_blank" rel="noopener noreferrer nofollow ugc" className="underline">
                    {song}
                  </a>
                </>
              ) : (
                copy.song(song)
              )}
            </p>
          ) : null}

          <div className="mb-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/?historia=${encodeURIComponent(story.id)}#mapa`}
              className="btn-am-principal inline-flex min-h-11 w-full items-center justify-center px-5 py-2.5 sm:w-auto"
            >
              {copy.map}
            </Link>
            <button
              type="button"
              className="btn-am-secundario inline-flex min-h-11 w-full items-center justify-center px-5 py-2.5 sm:w-auto"
              onClick={() => setShareOpen(true)}
            >
              {copy.share}
            </button>
          </div>

          <div className="mb-10 border-t border-gray-300/40 pt-8">
            <HomeHardLink
              href="/#mapa"
              className="text-[length:var(--fs-pequeno)] font-semibold"
              style={{ color: 'var(--almamundi-orange)' }}
            >
              {copy.all}
            </HomeHardLink>
          </div>

          <div className="flex flex-col items-center px-2 pb-6 text-center">
            <p className="mb-4 text-[length:var(--fs-subtitulo)]" style={{ color: neu.textMain }}>
              {copy.ask}
            </p>
            <HomeHardLink href="/#historias" className="btn-am-principal inline-flex min-h-11 items-center justify-center px-6 py-2.5">
              {copy.tell}
            </HomeHardLink>
          </div>
        </section>
      </div>
      <ShareAfterNotice
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        kind="story"
        storyId={story.id}
        title={story.title || ''}
        city={story.city ?? ''}
        format={kind === 'image' ? 'photo' : kind}
      />
    </main>
  );
}
