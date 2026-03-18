import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCameraBySlug } from '@/lib/map-data/cameras';
import { ObservatoryShell } from '@/components/observatory/ObservatoryShell';
import { CameraObservatory } from '@/components/observatory/CameraObservatory';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ObservatorioPage({ params }: PageProps) {
  const { slug } = await params;
  const camera = getCameraBySlug(slug);
  if (!camera) notFound();

  const location = [camera.city, camera.country].filter(Boolean).join(', ');
  const badge = (
    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-semibold">
      EN VIVO
    </span>
  );

  return (
    <main className="min-h-screen bg-[#0F172A] flex flex-col">
      <ObservatoryShell
        title={camera.title}
        subtitleLeft={location || undefined}
        subtitleRight={camera.provider ?? undefined}
        badge={badge}
        variant="page"
        backHref="/#mapa"
      >
        <CameraObservatory camera={camera} variant="page" contentOnly />
        <div className="mt-8 flex justify-center">
          <Link
            href="/#mapa"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 transition font-medium"
          >
            Volver al globo
          </Link>
        </div>
      </ObservatoryShell>
    </main>
  );
}
