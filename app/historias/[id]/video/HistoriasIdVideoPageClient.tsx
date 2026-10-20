'use client';

/**
 * /historias/[id]/video — Cine Personal.
 * La existencia y el video se resuelven en el Server Component.
 */
import VideoPlayer, { type Historia } from '@/components/historia/VideoPlayer';
import { neu, historiasInterior } from '@/lib/historias-neumorph';

export default function HistoriasIdVideoPageClient({ historia }: { historia: Historia }) {
  return (
    <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <div className={`${historiasInterior.contentWrapClassName} flex w-full flex-1 flex-col min-h-0`}>
        <section className="flex w-full min-h-0 flex-1 flex-col">
          <VideoPlayer historia={historia} siteLayout />
        </section>
      </div>
    </main>
  );
}
