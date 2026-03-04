'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, X } from 'lucide-react';
import type { CameraPoint } from '@/lib/map-data/cameras';
import { getCameraSourceUrl } from '@/lib/map-data/cameras';
import { HlsPlayer } from '@/components/HlsPlayer';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';

interface CameraObservatoryProps {
  camera: CameraPoint;
  variant: 'page' | 'modal';
  onClose?: () => void;
  /** Cuando true, solo se renderiza el contenido (player + acciones); el header va en ObservatoryShell. */
  contentOnly?: boolean;
}

const CTA_LABEL = 'Abrir señal';

export function CameraObservatory({ camera, variant, onClose, contentOnly = false }: CameraObservatoryProps) {
  const sourceUrl = getCameraSourceUrl(camera);
  const location = [camera.city, camera.country].filter(Boolean).join(', ');
  const isPage = !camera.source || camera.source.kind === 'page';
  const isYoutube = camera.source?.kind === 'youtube';
  const isHls = camera.source?.kind === 'hls';

  const backHref = '/mapa?view=cameras';
  const isModal = variant === 'modal';

  const playerBlock = (
    <div className={`w-full ${isModal ? 'max-w-3xl' : 'max-w-4xl'}`}>
      {isHls && camera.source?.kind === 'hls' && (
        <HlsPlayer url={camera.source.url} className="w-full" />
      )}
      {isYoutube && camera.source?.kind === 'youtube' && (
        <YouTubeEmbed videoId={camera.source.videoId} title={camera.title} className="w-full" />
      )}
      {isPage && (
        <div
          className={
            isModal
              ? 'rounded-2xl border border-white/10 bg-white/5 p-6 text-center'
              : 'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-12 text-center'
          }
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <ExternalLink size={28} className="text-white/40" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Ver en la fuente oficial</h2>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/40 hover:bg-orange-500/30 transition font-semibold text-sm"
          >
            <ExternalLink size={18} />
            {CTA_LABEL}
          </a>
          <p className="mt-4 max-w-md mx-auto text-[12px] text-white/55">
            Esta transmisión se reproduce en la plataforma oficial del proveedor. Para respetar sus políticas de emisión y mantener la estabilidad del servicio, se abre en una nueva pestaña.
          </p>
        </div>
      )}
    </div>
  );

  if (contentOnly) {
    return (
      <div className="flex flex-col items-center justify-center w-full">
        {playerBlock}
        {!isPage && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/40 hover:bg-orange-500/30 transition font-semibold px-4 py-2.5 text-sm"
          >
            <ExternalLink size={18} />
            {CTA_LABEL}
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      <header
        className={
          isModal
            ? 'shrink-0 flex items-center justify-between gap-4 p-4 border-b border-white/10'
            : 'shrink-0 flex items-center justify-between gap-4 p-6 border-b border-white/10 backdrop-blur-xl bg-[#0F172A]/90 sticky top-0 z-10'
        }
      >
        <div className="flex items-center gap-3 min-w-0">
          {isModal && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
              aria-label="Cerrar"
            >
              <X size={22} strokeWidth={2} />
            </button>
          ) : (
            <Link
              href={backHref}
              className="shrink-0 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
              aria-label="Volver al globo"
            >
              <ArrowLeft size={isModal ? 20 : 24} strokeWidth={2} />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className={`font-bold text-white truncate ${isModal ? 'text-lg' : 'text-xl md:text-2xl'}`}>
              {camera.title}
            </h1>
            {location && (
              <p className={`text-white/60 truncate ${isModal ? 'text-xs' : 'text-sm'}`}>{location}</p>
            )}
            {camera.provider && (
              <p className={`text-white/50 truncate ${isModal ? 'text-[10px]' : 'text-xs'}`}>{camera.provider}</p>
            )}
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-semibold">
            EN VIVO
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/40 hover:bg-orange-500/30 transition font-semibold ${isModal ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'}`}
          >
            <ExternalLink size={isModal ? 14 : 18} />
            {CTA_LABEL}
          </a>
        </div>
      </header>

      <section
        className={
          isModal
            ? 'flex-1 min-h-0 flex flex-col items-center justify-center p-4 overflow-auto'
            : 'flex-1 flex flex-col items-center justify-center p-6 md:p-10'
        }
      >
        {playerBlock}
        {!isModal && (
          <div className="mt-8 flex justify-center">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 transition font-medium"
            >
              <ArrowLeft size={18} />
              Volver al globo
            </Link>
          </div>
        )}
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 transition text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Volver al globo
          </button>
        )}
      </section>
    </>
  );
}
