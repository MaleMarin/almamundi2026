'use client';

import Link from 'next/link';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { PREGUNTA_COPY } from '@/lib/i18n/pregunta-messages';
import { preguntaPageHref } from '@/lib/pregunta-semana';
import type { RespuestaPublica } from '@/lib/respuestas/public';

export function RespuestaGlobeCard({
  item,
  onClose }: {
  item: RespuestaPublica;
  onClose: () => void;
}) {
  const { locale, t } = useHomeLocale();
  return (
    <div
      className="absolute bottom-4 left-1/2 z-30 w-[min(92vw,340px)] -translate-x-1/2 rounded-2xl bg-white p-4 text-[#1C1C2E] shadow-[0_12px_40px_rgba(20,29,38,0.18)]"
      style={{ fontFamily: 'var(--font-interna), sans-serif' }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="m-0 text-[15px] font-semibold">{item.alias}</p>
          <p className="m-0 text-sm text-[#4A5568]">{item.city}</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-[#4A5568]">
          {t.modalClose}
        </button>
      </div>
      {item.kind === 'texto' ? <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed">{item.contenido}</p> : null}
      {item.kind === 'voz' && item.previewUrl ? <audio controls preload="none" src={item.previewUrl} className="w-full" /> : null}
      {item.kind === 'foto' && item.previewUrl ? (
        <img src={item.previewUrl} alt={item.contenido} className="max-h-40 w-full rounded-xl object-cover" />
      ) : null}
      {item.kind === 'foto' && item.contenido ? <p className="mb-0 mt-2 text-sm leading-relaxed">{item.contenido}</p> : null}
      <Link href={preguntaPageHref(item.questionId)} className="mt-3 inline-flex text-sm font-semibold text-[#FF4A1C]">
        {PREGUNTA_COPY.seeWorld[locale]}
      </Link>
    </div>
  );
}
