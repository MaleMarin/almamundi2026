'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, LayoutGrid, Video, Mic, FileText, Image as ImageIcon, X } from 'lucide-react';
import { getMuestraBySlug, type MuestraItem, type MuestraItemType } from '@/lib/muestras';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu, historiasInterior } from '@/lib/historias-neumorph';

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
        style={{ ...neu.card, fontFamily: neu.APP_FONT }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold" style={{ color: neu.textMain }}>
              {item.title}
            </h3>
            <p className="text-sm mt-1" style={{ color: neu.textBody }}>
              {item.alias} · {item.date}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/30 transition"
            style={neu.button}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" style={{ color: neu.textMain }} />
          </button>
        </div>
        {item.context && (
          <p className="text-sm mb-4" style={{ color: neu.textBody }}>
            {item.context}
          </p>
        )}

        {item.type === 'texto' && item.textBody && (
          <div className="prose prose-sm max-w-none rounded-2xl p-4" style={{ ...neu.cardInset, color: neu.textMain }}>
            <p className="whitespace-pre-wrap">{item.textBody}</p>
          </div>
        )}

        {item.type === 'foto' && item.mediaUrl && (
          <div className="rounded-2xl overflow-hidden" style={neu.cardInset}>
            <img src={item.mediaUrl} alt="" className="w-full h-auto object-contain" />
          </div>
        )}

        {item.type === 'audio' && item.mediaUrl && (
          <div className="rounded-2xl p-4" style={neu.cardInset}>
            <audio controls src={item.mediaUrl} className="w-full" />
            {item.duration != null && (
              <p className="text-xs mt-2" style={{ color: neu.textBody }}>
                {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
              </p>
            )}
          </div>
        )}

        {item.type === 'video' && (
          <div className="rounded-2xl overflow-hidden bg-black/20" style={neu.cardInset}>
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
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
        <p className="mb-4" style={{ color: neu.textBody }}>No se encontró esta muestra.</p>
        <Link href="/muestras" className="text-orange-500 font-semibold hover:underline">
          Volver al listado
        </Link>
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
          <Link href="/muestras" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>← Muestras</Link>
          <HomeHardLink href="/#intro" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</HomeHardLink>
          <HomeHardLink href="/#como-funciona" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</HomeHardLink>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className="[&_button]:btn-almamundi" />
          <HomeHardLink href="/#mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textMain }}>Mapa</HomeHardLink>
        </div>
      </nav>

      <div className="pt-10 pb-16 px-6 md:px-12 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-3" style={{ color: neu.textMain }}>
          {muestra.title}
        </h1>
        <p className="text-lg font-light mb-8" style={{ color: neu.textBody }}>
          {muestra.intro}
        </p>

        <ol className="list-none space-y-4 mb-10 pl-0">
          {muestra.items.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openViewer(item)}
                className="w-full flex items-center gap-4 py-3 px-4 rounded-2xl text-left transition hover:shadow-md active:scale-[0.99]"
                style={neu.card}
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style={{ ...neu.cardInset, color: neu.textBody }}>
                  {index + 1}
                </span>
                <ItemIcon type={item.type} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium block truncate" style={{ color: neu.textMain }}>
                    {item.title}
                  </span>
                  <span className="text-sm truncate block" style={{ color: neu.textBody }}>
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
            style={neu.button}
          >
            <LayoutGrid className="w-4 h-4" />
            Modo muestra
          </button>
          <HomeHardLink
            href="/#mapa"
            className="btn-almamundi inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-full active:scale-95"
            style={neu.button}
          >
            <MapPin className="w-4 h-4" />
            Ver en el mapa
          </HomeHardLink>
        </div>
      </div>

      <div className="border-t border-gray-400/50 pt-10 md:pt-14">
        <Footer />
      </div>

      {viewerItem && (
        <ViewerModal item={viewerItem} onClose={closeViewer} />
      )}
    </main>
  );
}
