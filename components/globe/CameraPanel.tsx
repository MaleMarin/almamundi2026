"use client";

import { X } from "lucide-react";
import type { LiveCamera } from "./types";

type Props = {
  camera: LiveCamera | null;
  onClose: () => void;
};

export function CameraPanel({ camera, onClose }: Props) {
  if (!camera) return null;

  const renderStream = () => {
    switch (camera.type) {
      case "youtube":
        return (
          <iframe
            src={camera.url}
            title={camera.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            className="w-full h-full border-0"
          />
        );
      case "iframe":
        return (
          <iframe
            src={camera.url}
            title={camera.title}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media"
          />
        );
      case "hls":
        return (
          <video
            src={camera.url}
            controls
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        );
      case "link":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 p-6">
            <p className="text-white/80 text-sm mb-4 text-center">
              {camera.title} está disponible en:
            </p>
            <a
              href={camera.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
            >
              Abrir en nueva ventana
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[420px] max-w-[92vw] z-[100] bg-[rgba(10,18,35,0.95)] backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-semibold text-base truncate">{camera.title}</h3>
          <p className="text-white/60 text-xs mt-0.5">{camera.source} · {camera.country}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 rounded-full grid place-items-center text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-colors shrink-0"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Stream container */}
      <div className="flex-1 min-h-0 relative bg-black">
        <div className="absolute inset-0 w-full h-full">
          {renderStream()}
        </div>
      </div>
    </div>
  );
}
