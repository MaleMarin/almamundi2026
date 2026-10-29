'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlignLeft, Headphones, Image as ImageIcon, Video } from 'lucide-react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { foldText } from '@/lib/historias/story-filter-helpers';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { neu } from '@/lib/historias-neumorph';
import type { StoryPoint } from '@/lib/map-data/stories';

const PAGE_SIZE = 24;

type Tab = 'todas' | 'video' | 'audio' | 'texto' | 'foto';
type FormatKey = Exclude<Tab, 'todas'>;

const COPY = {
  es: {
    featured: 'Destacadas',
    tabs: { todas: 'Todas', video: 'Video', audio: 'Audio', texto: 'Texto', foto: 'Foto' } as const,
    country: 'País',
    allCountries: 'Todos',
    order: 'Orden',
    newest: 'Más recientes',
    oldest: 'Más antiguas',
    search: 'Buscar por título o ciudad',
    by: 'Por',
    onGlobe: 'En el globo',
    more: 'Ver más',
  },
  pt: {
    featured: 'Destaques',
    tabs: { todas: 'Todas', video: 'Vídeo', audio: 'Áudio', texto: 'Texto', foto: 'Foto' } as const,
    country: 'País',
    allCountries: 'Todos',
    order: 'Ordem',
    newest: 'Mais recentes',
    oldest: 'Mais antigas',
    search: 'Buscar por título ou cidade',
    by: 'Por',
    onGlobe: 'No globo',
    more: 'Ver mais',
  },
  en: {
    featured: 'Featured',
    tabs: { todas: 'All', video: 'Video', audio: 'Audio', texto: 'Text', foto: 'Photo' } as const,
    country: 'Country',
    allCountries: 'All',
    order: 'Order',
    newest: 'Newest',
    oldest: 'Oldest',
    search: 'Search by title or city',
    by: 'By',
    onGlobe: 'On the globe',
    more: 'See more',
  },
} as const;

function tabFromParam(value: string | null): Tab {
  if (value === 'video' || value === 'audio' || value === 'texto' || value === 'foto') return value;
  return 'todas';
}

function formatKey(story: StoryPoint): FormatKey {
  const format = (story.format ?? '').toLowerCase();
  if (format === 'video' || story.videoUrl || story.hasVideo) return 'video';
  if (format === 'audio' || story.audioUrl || story.hasAudio) return 'audio';
  if (
    format === 'foto' ||
    format === 'image' ||
    format === 'photos' ||
    format === 'photo' ||
    (story.imagenes?.length ?? 0) > 0 ||
    (story.photos?.length ?? 0) > 0
  ) {
    return 'foto';
  }
  return 'texto';
}

function cardImage(story: StoryPoint): string {
  const photo = story.imagenes?.find((item) => item.url)?.url || story.photos?.[0]?.url;
  if (photo) return photo;
  if (story.videoUrl || story.hasVideo) {
    return story.thumbnailUrl || story.imageUrl || story.authorAvatar || story.author?.avatar || '';
  }
  return story.imageUrl || story.thumbnailUrl || story.authorAvatar || story.author?.avatar || '';
}

function initialCapital(raw: string | undefined): string {
  const name = (raw ?? '').trim();
  if (!name) return '';
  return name.charAt(0).toLocaleUpperCase('es-CL') + name.slice(1);
}

function publishedTime(iso: string | undefined): number {
  if (!iso) return 0;
  const time = Date.parse(iso);
  return Number.isFinite(time) ? time : 0;
}

function formatDate(iso: string | undefined, locale: 'es' | 'pt' | 'en'): string {
  const time = publishedTime(iso);
  if (!time) return '';
  const tag = locale === 'en' ? 'en-US' : locale === 'pt' ? 'pt-BR' : 'es-CL';
  return new Date(time).toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' });
}

function FormatMark({ kind }: { kind: FormatKey }) {
  const Icon = kind === 'video' ? Video : kind === 'audio' ? Headphones : kind === 'foto' ? ImageIcon : AlignLeft;
  return <Icon size={16} aria-hidden style={{ color: 'var(--almamundi-orange)' }} />;
}

function StoryCard({
  story,
  large,
  locale,
  copy,
}: {
  story: StoryPoint;
  large?: boolean;
  locale: 'es' | 'pt' | 'en';
  copy: (typeof COPY)[keyof typeof COPY];
}) {
  const image = cardImage(story);
  const alias = initialCapital(story.authorName || story.author?.name);
  const place = formatPublicPlace(story.city, story.country);
  const who = alias ? `${copy.by} ${alias}` : '';
  const byline = [who, place].filter(Boolean).join(' · ');
  const when = formatDate(story.publishedAt, locale);
  return (
    <Link
      href={`/historias/${story.id}`}
      className="flex h-full flex-col overflow-hidden"
      style={{ ...neu.card, borderRadius: large ? 28 : 22 }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ height: large ? 240 : 160, background: '#c5ceda' }}
      >
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : null}
        <span className="absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E0E5EC]/90">
          <FormatMark kind={formatKey(story)} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-4 py-4">
        <h2 className="text-[length:var(--fs-pequeno)] font-semibold leading-snug text-gray-800">
          {story.title || story.label}
        </h2>
        {byline ? (
          <p className="text-[length:var(--fs-etiqueta)] text-gray-600">{byline}</p>
        ) : null}
        {when ? <p className="text-[length:var(--fs-etiqueta)] text-gray-500">{when}</p> : null}
        {story.onGlobe ? (
          <p className="mt-auto pt-2 text-[length:var(--fs-etiqueta)] font-semibold" style={{ color: 'var(--almamundi-orange)' }}>
            {copy.onGlobe}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default function HistoriasCatalog() {
  const { locale } = useHomeLocale();
  const copy = COPY[locale];
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = tabFromParam(searchParams.get('formato'));
  const [stories, setStories] = useState<StoryPoint[]>([]);
  const [country, setCountry] = useState('');
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancel = false;
    void fetch('/api/historias')
      .then((res) => res.json())
      .then((data: { stories?: StoryPoint[] }) => {
        if (!cancel) setStories(Array.isArray(data.stories) ? data.stories : []);
      })
      .catch(() => {
        if (!cancel) setStories([]);
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [tab, country, order, query]);

  const featured = useMemo(
    () => stories.filter((story) => story.featured).slice(0, 3),
    [stories]
  );
  const featuredIds = useMemo(() => new Set(featured.map((story) => story.id)), [featured]);

  const inTab = useMemo(() => {
    return stories.filter((story) => !featuredIds.has(story.id) && (tab === 'todas' || formatKey(story) === tab));
  }, [stories, featuredIds, tab]);

  const countries = useMemo(() => {
    const names = new Set<string>();
    for (const story of inTab) {
      const name = (story.country ?? '').trim();
      if (name) names.add(name);
    }
    return [...names].sort((a, b) => a.localeCompare(b, locale === 'en' ? 'en' : locale === 'pt' ? 'pt' : 'es'));
  }, [inTab, locale]);

  const filtered = useMemo(() => {
    const q = foldText(query.trim());
    const rows = inTab.filter((story) => {
      if (country && (story.country ?? '').trim() !== country) return false;
      if (!q) return true;
      const title = foldText(story.title || story.label || '');
      const city = foldText(story.city ?? '');
      return title.includes(q) || city.includes(q);
    });
    rows.sort((a, b) => {
      const delta = publishedTime(a.publishedAt) - publishedTime(b.publishedAt);
      return order === 'oldest' ? delta : -delta;
    });
    return rows;
  }, [inTab, country, query, order]);

  const shown = filtered.slice(0, visible);

  const chooseTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'todas') params.delete('formato');
    else params.set('formato', next);
    const qs = params.toString();
    router.replace(qs ? `/historias?${qs}` : '/historias', { scroll: false });
    setCountry('');
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6" style={{ color: neu.textMain }}>
      {featured.length > 0 ? (
        <section className="mb-10">
          <h1 className="mb-4 text-[length:var(--fs-titular)] font-normal">{copy.featured}</h1>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {featured.map((story) => (
              <StoryCard key={story.id} story={story} large locale={locale} copy={copy} />
            ))}
          </div>
        </section>
      ) : null}

      <div role="tablist" aria-label={copy.tabs.todas} className="mb-5 flex flex-wrap gap-2">
        {(Object.keys(copy.tabs) as Tab[]).map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => chooseTab(key)}
              className="min-h-11 rounded-full px-4 py-2 text-[length:var(--fs-pequeno)] font-semibold"
              style={{
                background: active ? 'var(--almamundi-orange)' : '#E0E5EC',
                color: active ? '#fff' : neu.textMain,
                boxShadow: active
                  ? 'none'
                  : '6px 6px 14px rgba(163,177,198,0.45), -6px -6px 14px rgba(255,255,255,0.8)',
              }}
            >
              {copy.tabs[key]}
            </button>
          );
        })}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[10rem] flex-col gap-1 text-[length:var(--fs-etiqueta)] font-semibold">
          {copy.country}
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="min-h-11 rounded-xl border border-white/50 bg-[#E0E5EC] px-3 text-[length:var(--fs-pequeno)]"
          >
            <option value="">{copy.allCountries}</option>
            {countries.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[10rem] flex-col gap-1 text-[length:var(--fs-etiqueta)] font-semibold">
          {copy.order}
          <select
            value={order}
            onChange={(event) => setOrder(event.target.value === 'oldest' ? 'oldest' : 'newest')}
            className="min-h-11 rounded-xl border border-white/50 bg-[#E0E5EC] px-3 text-[length:var(--fs-pequeno)]"
          >
            <option value="newest">{copy.newest}</option>
            <option value="oldest">{copy.oldest}</option>
          </select>
        </label>
        <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-[length:var(--fs-etiqueta)] font-semibold">
          {copy.search}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
            className="min-h-11 rounded-xl border border-white/50 bg-[#E0E5EC] px-3 text-[length:var(--fs-pequeno)]"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((story) => (
          <StoryCard key={story.id} story={story} locale={locale} copy={copy} />
        ))}
      </div>

      {visible < filtered.length ? (
        <div className="mt-8 flex justify-center">
          <button type="button" className="btn-am-principal min-h-11 px-6" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
            {copy.more}
          </button>
        </div>
      ) : null}
    </main>
  );
}
