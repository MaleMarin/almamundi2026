'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, LayoutGrid, Video, Mic, FileText, Image as ImageIcon, X } from 'lucide-react';
import { getMuestraBySlug, type MuestraItem, type MuestraItemType } from '@/lib/muestras';

const APP_FONT = `'Avenir Light', Avenir, sans-serif`;

const soft = {
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  flat: {
    backgroundColor: '#E0E5EC',
    boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '40px',
  },
  inset: {
    backgroundColor: '#E0E5EC',
    boxShadow: 'inset 6px 6px 10px rgba(163,177,198,0.7), inset -6px -6px 10px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
  },
  button: {
    backgroundColor: '#E0E5EC',
    boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
    fontFamily: APP_FONT,
  },
} as const;

function ItemIcon({ type }: { type: MuestraItemType }) {
  const className = 'w-5 h-5 text-orange-500 flex-shrink-0';
  if (type === 'video') return <Video className={className} />;
  if (type === 'audio') return <Mic className={className} />;
  if (type === 'texto') return <FileText className={className} />;
  return <ImageIcon className={className} />;
}

function embedVideoUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (/youtube\.com|youtu\.be/.test(u.hostname)) {
      const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (/vimeo\.com/.test(u.hostname)) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {}
  return null;
}

function ViewerModal({
  item,
  onClose,
}: {
  item: MuestraItem;
  onClose: () => void;
}) {
  const embed = item.mediaUrl && (item.type === 'video' ? embedVideoUrl(item.mediaUrl) : null);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ver pieza"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-[40px] p-6"
        style={{ ...soft.flat, fontFamily: APP_FONT }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold" style={{ color: soft.textMain }}>
              {item.title}
            </h3>
            <p className="text-sm mt-1" style={{ color: soft.textBody }}>
              {item.alias} · {item.date}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/30 transition"
            style={soft.button}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" style={{ color: soft.textMain }} />
          </button>
        </div>
        {item.context && (
          <p className="text-sm mb-4" style={{ color: soft.textBody }}>
            {item.context}
          </p>
        )}

        {item.type === 'texto' && item.textBody && (
          <div className="prose prose-sm max-w-none rounded-2xl p-4" style={{ ...soft.inset, color: soft.textMain }}>
            <p className="whitespace-pre-wrap">{item.textBody}</p>
          </div>
        )}

        {item.type === 'foto' && item.mediaUrl && (
          <div className="rounded-2xl overflow-hidden" style={soft.inset}>
            <img src={item.mediaUrl} alt="" className="w-full h-auto object-contain" />
          </div>
        )}

        {item.type === 'audio' && item.mediaUrl && (
          <div className="rounded-2xl p-4" style={soft.inset}>
            <audio controls src={item.mediaUrl} className="w-full" />
            {item.duration != null && (
              <p className="text-xs mt-2" style={{ color: soft.textBody }}>
                {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
              </p>
            )}
          </div>
        )}

        {item.type === 'video' && (
          <div className="rounded-2xl overflow-hidden bg-black/20" style={soft.inset}>
            {embed ? (
              <iframe
                src={embed}
                title={item.title}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <a
                href={item.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 text-orange-600 font-medium hover:underline"
              >
                Ver video: {item.mediaUrl}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MuestraDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const muestra = getMuestraBySlug(slug);
  const [viewerItem, setViewerItem] = useState<MuestraItem | null>(null);

  const openViewer = useCallback((item: MuestraItem) => setViewerItem(item), []);
  const closeViewer = useCallback(() => setViewerItem(null), []);

  if (!muestra) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: soft.bg, fontFamily: APP_FONT }}>
        <p className="mb-4" style={{ color: soft.textBody }}>No se encontró esta muestra.</p>
        <Link href="/muestras" className="text-orange-500 font-semibold hover:underline">
          Volver al listado
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: soft.bg, fontFamily: APP_FONT }}>
      <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between px-6 md:px-12 h-24 bg-[#E0E5EC]/80 backdrop-blur-lg border-b border-white/20">
        <Link href="/" className="flex items-center min-h-[60px]">
          <img
            src="/logo.png"
            alt="AlmaMundi"
            className="h-20 md:h-24 w-auto object-contain select-none"
            onError={(e) => {
              const t = e.currentTarget;
              if (t.nextElementSibling) return;
              const span = document.createElement('span');
              span.className = 'text-xl font-light text-gray-600';
              span.textContent = 'AlmaMundi';
              t.style.display = 'none';
              t.parentElement?.appendChild(span);
            }}
          />
        </Link>
        <nav className="flex gap-4 text-sm font-bold text-gray-600 items-center">
          <Link href="/" className="btn-almamundi px-6 py-3 active:scale-95 rounded-full" style={soft.button}>
            Inicio
          </Link>
          <Link href="/#mapa" className="btn-almamundi px-6 py-3 active:scale-95 rounded-full" style={soft.button}>
            Mapa
          </Link>
        </nav>
      </header>

      <div className="pt-28 pb-16 px-6 md:px-12 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-3" style={{ color: soft.textMain }}>
          {muestra.title}
        </h1>
        <p className="text-lg font-light mb-8" style={{ color: soft.textBody }}>
          {muestra.intro}
        </p>

        <ol className="list-none space-y-4 mb-10 pl-0">
          {muestra.items.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openViewer(item)}
                className="w-full flex items-center gap-4 py-3 px-4 rounded-2xl text-left transition hover:shadow-md active:scale-[0.99]"
                style={soft.flat}
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style={{ ...soft.inset, color: soft.textBody }}>
                  {index + 1}
                </span>
                <ItemIcon type={item.type} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium block truncate" style={{ color: soft.textMain }}>
                    {item.title}
                  </span>
                  <span className="text-sm truncate block" style={{ color: soft.textBody }}>
                    {item.alias} · {item.date}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            className="btn-almamundi inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-full active:scale-95"
            style={soft.button}
          >
            <LayoutGrid className="w-4 h-4" />
            Modo muestra
          </button>
          <Link
            href="/#mapa"
            className="btn-almamundi inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-full active:scale-95"
            style={soft.button}
          >
            <MapPin className="w-4 h-4" />
            Ver en el mapa
          </Link>
        </div>
      </div>

      {viewerItem && (
        <ViewerModal item={viewerItem} onClose={closeViewer} />
      )}
    </main>
  );
}
