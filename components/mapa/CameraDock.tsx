'use client';

import { X, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { CameraPoint } from '@/lib/map-data/cameras';
import { getCameraSourceUrl } from '@/lib/map-data/cameras';

interface CameraDockProps {
  camera: CameraPoint | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CameraDock({ camera, isOpen, onClose }: CameraDockProps) {
  const [copied, setCopied] = useState(false);

  if (!camera) return null;

  const sourceUrl = getCameraSourceUrl(camera);
  const embedUrl = camera.source?.kind === 'youtube'
    ? `https://www.youtube.com/embed/${camera.source.videoId}?autoplay=1&mute=1`
    : null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(sourceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleOpenSource = () => {
    window.open(sourceUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        .camera-dock {
          animation: ${isOpen ? 'slideUp' : 'slideDown'} 0.3s ease-out forwards;
        }
      `}</style>
      <div
        className={`camera-dock fixed bottom-0 left-0 right-0 z-[200] transition-all duration-300 ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{
          maxWidth: '100vw',
          padding: '0 24px 24px',
          pointerEvents: isOpen ? 'auto' : 'none',
          height: isOpen ? '28vh' : '0',
          maxHeight: '28vh',
          minHeight: isOpen ? '320px' : '0'
        }}
      >
        <div
          className="mx-auto max-w-6xl h-full rounded-3xl border border-white/20 bg-gradient-to-b from-[rgba(15,25,45,0.95)] to-[rgba(15,25,45,0.98)] backdrop-blur-[24px] shadow-[0_-8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col overflow-hidden"
          style={{
            boxShadow: '0 -8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)'
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-4 border-b border-white/10 shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white truncate">{camera.title}</h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                {[camera.city, camera.country].filter(Boolean).join(' • ')}
                {camera.provider && <><span>•</span><span>{camera.provider}</span></>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors shrink-0"
              aria-label="Cerrar dock"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 flex flex-col p-4 overflow-y-auto">
            {embedUrl ? (
              <div className="relative w-full flex-1 min-h-0 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                <iframe
                  src={embedUrl}
                  title={camera.title}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                />
              </div>
            ) : camera.source?.kind === 'hls' ? (
              <div className="relative w-full flex-1 min-h-0 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                <div className="absolute inset-0 flex items-center justify-center text-white/60">
                  <div className="text-center">
                    <p className="text-sm mb-2">Reproductor HLS</p>
                    <p className="text-xs text-white/40">Ver en página de observatorio</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full flex-1 min-h-0 rounded-xl overflow-hidden bg-gradient-to-br from-[rgba(15,25,45,0.9)] to-[rgba(30,41,59,0.8)] border border-white/10 flex items-center justify-center p-6">
                <div className="max-w-md mx-auto text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <ExternalLink size={24} className="text-white/40" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Esta cámara se ve en su fuente oficial</h4>
                  <p className="text-sm text-white/60 mb-6">
                    Para ver la transmisión en vivo, abre el enlace en una nueva pestaña.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-4 shrink-0">
              <button
                onClick={handleOpenSource}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors text-sm font-semibold"
              >
                <ExternalLink size={16} />
                Abrir señal oficial
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-colors text-sm font-semibold"
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copiar link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
