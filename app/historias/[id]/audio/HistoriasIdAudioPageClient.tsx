'use client';

/**
 * /historias/[id]/audio — Reproductor de audio (AudioPlayer).
 * La existencia y el audio se resuelven en el Server Component.
 */
import AudioPlayer, { type HistoriaAudio } from '@/components/historia/AudioPlayer';
import { neu, historiasInterior } from '@/lib/historias-neumorph';

export default function HistoriasIdAudioPageClient({ historia }: { historia: HistoriaAudio }) {
  return (
    <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <div className={`${historiasInterior.contentWrapClassName} flex w-full flex-1 flex-col min-h-0`}>
        <section className="flex w-full flex-1 flex-col items-center justify-center px-4 pb-12 pt-6 md:px-10 md:pb-16 md:pt-10 min-h-0">
          <AudioPlayer historia={historia} presentation="embed" />
        </section>
      </div>
    </main>
  );
}
