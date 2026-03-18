'use client';

import { useParams, useRouter } from 'next/navigation';
import { getCameraBySlug } from '@/lib/map-data/cameras';
import { ObservatoryShell } from '@/components/observatory/ObservatoryShell';
import { CameraObservatory } from '@/components/observatory/CameraObservatory';

export default function ObservatorioCamarasModalPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const camera = getCameraBySlug(slug);

  const handleClose = () => router.back();

  if (!camera) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
        <div className="rounded-2xl bg-[#0F172A] border border-white/10 p-8 max-w-md text-center text-white/80">
          <p className="mb-6">Cámara no encontrada.</p>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 transition"
          >
            Volver al globo
          </button>
        </div>
      </div>
    );
  }

  const location = [camera.city, camera.country].filter(Boolean).join(', ');
  const badge = (
    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-semibold">
      EN VIVO
    </span>
  );

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-[#0F172A]/98 backdrop-blur-xl overflow-hidden">
      <ObservatoryShell
        title={camera.title}
        subtitleLeft={location || undefined}
        subtitleRight={camera.provider ?? undefined}
        badge={badge}
        variant="modal"
        backHref="/#mapa"
        onClose={handleClose}
      >
        <CameraObservatory camera={camera} variant="modal" contentOnly />
      </ObservatoryShell>
    </div>
  );
}
