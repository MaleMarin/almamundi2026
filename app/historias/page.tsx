'use client';

/**
 * /historias — Grid masonry de las historias (las 30 del mapa).
 * Neumorfismo fuerte. Cards: video, audio, texto, foto. Badge "En el mapa".
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useStories } from '@/hooks/useStories';
import { neu } from '@/lib/historias-neumorph';
import type { StoryPoint } from '@/lib/map-data/stories';

function formatPlace(s: StoryPoint): string {
  const parts = [s.city, s.country].filter(Boolean);
  return parts.length ? parts.join(', ') : s.label || '—';
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
  if (days < 30) return `hace ${Math.floor(days / 7)} semanas`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

type FormatFilter = 'all' | 'video' | 'audio' | 'text' | 'photo';

function getFormat(s: StoryPoint): 'video' | 'audio' | 'text' | 'photo' {
  if (s.videoUrl || s.hasVideo) return 'video';
  if (s.audioUrl || s.hasAudio) return 'audio';
  if (s.imageUrl) return 'photo';
  return 'text';
}

function CardVideo({ story }: { story: StoryPoint }) {
  const place = formatPlace(story);
  return (
    <Link
      href={`/historias/${story.id}`}
      className="block break-inside-avoid mb-4 rounded-2xl overflow-hidden transition-all duration-250 hover:scale-[1.02] active:scale-[0.99]"
      style={neu.card}
    >
      <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-amber-700" style={neu.badge}>
        📍 En el mapa
      </div>
      <div className="relative w-full aspect-video bg-gradient-to-br from-slate-300 to-slate-200 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-amber-600/40 bg-white/60 shadow-inner" style={neu.cardInset}>
          <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[16px] border-l-amber-700 ml-1" />
        </div>
      </div>
      <div className="p-4">
        <div className="text-[10px] font-semibold tracking-widest uppercase text-amber-700 mb-1">{place}</div>
        <h3 className="font-serif text-lg font-medium text-gray-800 mb-2 line-clamp-2">{story.title || 'Sin título'}</h3>
        {story.description && <p className="text-sm text-gray-600 line-clamp-2 mb-2">{story.description}</p>}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Video</span>
          <span>{timeAgo(story.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function CardAudio({ story }: { story: StoryPoint }) {
  const place = formatPlace(story);
  const bars = useMemo(
    () => Array.from({ length: 18 }, (_, i) => 30 + Math.sin(i * 0.8) * 40 + ((story.id.length + i * 7) % 31)),
    [story.id]
  );
  return (
    <Link
      href={`/historias/${story.id}`}
      className="block break-inside-avoid mb-4 rounded-2xl overflow-hidden transition-all duration-250 hover:scale-[1.02] active:scale-[0.99]"
      style={neu.card}
    >
      <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-amber-700" style={neu.badge}>
        📍 En el mapa
      </div>
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={neu.cardInset}>
          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-amber-700 ml-0.5" />
        </div>
        <div className="flex-1 flex items-end gap-0.5 h-8">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-amber-600/30 min-w-[3px]" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="text-[10px] font-semibold tracking-widest uppercase text-amber-700 mb-1">{place}</div>
        <h3 className="font-serif text-lg font-medium text-gray-800 line-clamp-2">{story.title || 'Sin título'}</h3>
        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
          <span>Audio</span>
          <span>{timeAgo(story.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function CardText({ story }: { story: StoryPoint }) {
  const place = formatPlace(story);
  const quote = (story.body || story.description || '').slice(0, 120);
  return (
    <Link
      href={`/historias/${story.id}`}
      className="block break-inside-avoid mb-4 rounded-2xl overflow-hidden transition-all duration-250 hover:scale-[1.02] active:scale-[0.99]"
      style={neu.card}
    >
      <div className="p-4">
        <div className="text-[10px] font-semibold tracking-widest uppercase text-amber-700 mb-2">{place}</div>
        <div className="pl-3 py-2 border-l-2 border-amber-600/40 rounded-r-xl bg-white/50" style={neu.cardInset}>
          <p className="font-serif italic text-gray-700 text-sm line-clamp-2">&ldquo;{quote || '…'}&rdquo;</p>
        </div>
        <h3 className="font-serif text-lg font-medium text-gray-800 mt-3 line-clamp-1">{story.title || 'Sin título'}</h3>
        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
          <span>Texto</span>
          <span>{timeAgo(story.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function CardPhoto({ story }: { story: StoryPoint }) {
  const place = formatPlace(story);
  return (
    <Link
      href={`/historias/${story.id}`}
      className="block break-inside-avoid mb-4 rounded-2xl overflow-hidden transition-all duration-250 hover:scale-[1.02] active:scale-[0.99]"
      style={neu.card}
    >
      <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-amber-700" style={neu.badge}>
        📍 En el mapa
      </div>
      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-slate-300 to-slate-200 flex items-center justify-center">
        {story.imageUrl ? (
          <img src={story.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl opacity-40">📷</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-amber-200">{place}</div>
          <h3 className="font-serif text-lg font-medium line-clamp-1">{story.title || 'Sin título'}</h3>
        </div>
      </div>
      <div className="p-3 flex justify-between items-center text-xs text-gray-500">
        <span>Foto</span>
        <span>{timeAgo(story.publishedAt)}</span>
      </div>
    </Link>
  );
}

function StoryCard({ story }: { story: StoryPoint }) {
  const format = getFormat(story);
  if (format === 'video') return <CardVideo story={story} />;
  if (format === 'audio') return <CardAudio story={story} />;
  if (format === 'photo') return <CardPhoto story={story} />;
  return <CardText story={story} />;
}

export default function HistoriasPage() {
  const stories = useStories();
  const [filter, setFilter] = useState<FormatFilter>('all');
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [showRegionFilters, setShowRegionFilters] = useState(false);

  const baseList = useMemo(() => {
    return stories.filter((s) => !(s as StoryPoint & { isDemo?: boolean }).isDemo);
  }, [stories]);

  const regions = useMemo(() => {
    const countries = new Set<string>();
    baseList.forEach((s) => { if (s.country) countries.add(s.country); });
    return Array.from(countries).sort();
  }, [baseList]);

  const list = useMemo(() => {
    let out = baseList;
    if (filter !== 'all') out = out.filter((s) => getFormat(s) === filter);
    if (regionFilter) out = out.filter((s) => s.country === regionFilter);
    return out;
  }, [baseList, filter, regionFilter]);

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-gray-300/50" style={{ backgroundColor: 'rgba(224,229,236,0.95)', boxShadow: '0 4px 24px rgba(163,177,198,0.3)' }}>
        <Link href="/" className="text-lg font-light tracking-wide" style={{ color: neu.textMain }}>AlmaMundi</Link>
        <div className="flex items-center gap-2">
          <Link href="/#intro" className="px-4 py-2 rounded-full text-sm" style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/#como-funciona" className="px-4 py-2 rounded-full text-sm" style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</Link>
          <span className="px-4 py-2 rounded-full text-sm font-medium text-amber-700" style={neu.cardInset}>Historias</span>
          <Link href="/#mapa" className="px-4 py-2 rounded-full text-sm" style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <section className="px-6 md:px-12 pt-12 pb-6">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-amber-700 uppercase mb-3">Archivo vivo</p>
        <h1 className="font-serif text-4xl md:text-6xl font-light leading-tight mb-4" style={{ color: neu.textMain }}>
          Historias del <em className="italic opacity-70">mundo real</em>
        </h1>
        <p className="text-lg max-w-xl mb-8" style={{ color: neu.textBody }}>
          Cada historia aquí fue vivida, atravesada, sentida. No se estudian. Se cuentan.
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(['all', 'video', 'audio', 'text', 'photo'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-sm capitalize transition-all"
              style={
                filter === f
                  ? { ...neu.cardInset, color: neu.gold, fontWeight: 600 }
                  : { ...neu.button, color: neu.textBody }
              }
            >
              {f === 'all' ? 'Todas' : f === 'video' ? 'Video' : f === 'audio' ? 'Audio' : f === 'text' ? 'Texto' : 'Foto'}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-300/50 mx-1" aria-hidden />
          <Link
            href="/temas"
            className="px-4 py-2 rounded-full text-sm transition-all"
            style={{ ...neu.button, color: neu.textBody }}
          >
            Por tema ↓
          </Link>
          <button
            type="button"
            onClick={() => setShowRegionFilters(!showRegionFilters)}
            className="px-4 py-2 rounded-full text-sm transition-all"
            style={
              regionFilter
                ? { ...neu.cardInset, color: neu.gold, fontWeight: 600 }
                : { ...neu.button, color: neu.textBody }
            }
          >
            Por región {regionFilter ? `· ${regionFilter}` : '↓'}
          </button>
        </div>
        {showRegionFilters && (
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-300/40">
            {regions.length === 0 ? (
              <span className="text-sm text-gray-500">No hay regiones aún.</span>
            ) : (
              <>
                {regions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRegionFilter(r); setShowRegionFilters(false); }}
                    className="px-3 py-1.5 rounded-full text-xs transition-all"
                    style={
                      regionFilter === r
                        ? { ...neu.cardInset, color: neu.gold, fontWeight: 600 }
                        : { ...neu.button, color: neu.textBody }
                    }
                  >
                    {r}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setRegionFilter(null); setShowRegionFilters(false); }}
                  className="px-3 py-1.5 rounded-full text-xs"
                  style={{ ...neu.button, color: neu.textBody }}
                >
                  Todas las regiones
                </button>
              </>
            )}
          </div>
        )}

        <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-4">Esta semana en el mapa</p>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {list.length === 0 ? (
            <p className="text-gray-500 py-12">Aún no hay historias publicadas en el mapa.</p>
          ) : (
            list.map((s) => <StoryCard key={s.id} story={s} />)
          )}
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-gray-300/40 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="font-medium mb-1" style={{ color: neu.textMain }}>AlmaMundi</div>
          <div className="text-xs" style={{ color: neu.textBody }}>Una iniciativa de PRECISAR</div>
        </div>
        <div className="flex gap-6">
          <Link href="/#intro" className="text-sm" style={{ color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/temas" className="text-sm" style={{ color: neu.textBody }}>Temas</Link>
          <Link href="/#mapa" className="text-sm" style={{ color: neu.textBody }}>Mapa</Link>
          <span className="text-sm font-medium" style={{ color: neu.textMain }}>Historias</span>
        </div>
      </footer>
    </main>
  );
}
