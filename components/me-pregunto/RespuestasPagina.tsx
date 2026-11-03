'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { hiloPorId, preguntaHiloPorId } from '@/lib/hilos';
import { ME_PREGUNTO_MAPA } from '@/lib/i18n/me-pregunto';
import { PREGUNTA_COPY, preguntaAlias } from '@/lib/i18n/pregunta-messages';
import type { RespuestaPublica } from '@/lib/respuestas/public';

const enlace = 'font-semibold text-[#B8340F] underline underline-offset-4 visited:text-[#B8340F]';

/** Todas las respuestas publicadas a una pregunta de AlmaMundi. */
export function RespuestasPagina() {
  const { locale } = useHomeLocale();
  const copy = ME_PREGUNTO_MAPA[locale];
  const id = useSearchParams().get('p');
  const pregunta = preguntaHiloPorId(id);
  const tema = hiloPorId(pregunta?.hiloId ?? null);
  const [lista, setLista] = useState<RespuestaPublica[] | null>(null);

  useEffect(() => {
    if (!pregunta) return;
    let cancel = false;
    void fetch('/api/respuestas/public?banco=hilos&limit=500')
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: RespuestaPublica[] }) => {
        if (!cancel) setLista((data.items ?? []).filter((r) => r.questionId === pregunta.id));
      })
      .catch(() => !cancel && setLista([]));
    return () => {
      cancel = true;
    };
  }, [pregunta]);

  return (
    <main className="mx-auto w-full max-w-[860px] px-6 pb-20 pt-10 text-[#1C1C2E] md:px-10">
      <Link href="/#cintas" className={`text-[length:var(--fs-pequeno)] ${enlace}`}>
        ← {copy.verPreguntasAlmaMundi}
      </Link>
      {pregunta ? (
        <>
          {tema ? (
            <p className="mb-0 mt-6 text-[length:var(--fs-etiqueta)] font-semibold uppercase tracking-[0.12em] text-[#B8340F]">
              {tema.nombre[locale]}
            </p>
          ) : null}
          <h1 className="mb-2 mt-2 text-[length:var(--fs-h2,28px)] font-semibold leading-tight">{pregunta.texto[locale]}</h1>
          <a
            href={`/preguntas?p=${encodeURIComponent(pregunta.id)}`}
            className="btn-am-principal mt-6 inline-flex min-h-11 items-center justify-center px-6 text-[length:var(--fs-pequeno)] font-semibold"
          >
            {copy.responderEsta}
          </a>
          <ul className="m-0 mt-8 flex list-none flex-col gap-4 p-0">
            {lista && lista.length === 0 ? <li className="text-[#4A5568]">{PREGUNTA_COPY.empty[locale]}</li> : null}
            {(lista ?? []).map((item) => (
              <li key={item.id} className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="m-0 mb-3 text-[length:var(--fs-etiqueta)] font-semibold text-[#4A5568]">
                  {[preguntaAlias(item.alias), formatPublicPlace(item.city, item.country, locale)].filter(Boolean).join(' · ')}
                </p>
                {item.kind === 'voz' && item.previewUrl ? <audio controls preload="none" src={item.previewUrl} className="w-full" /> : null}
                {item.kind === 'foto' && item.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.previewUrl} alt="" className="mb-3 max-h-96 w-full rounded-xl object-contain" />
                ) : null}
                {item.contenido && item.kind !== 'voz' ? (
                  <p className="m-0 whitespace-pre-line text-[length:var(--fs-texto)] leading-relaxed">{item.contenido}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-8 text-[#4A5568]">{PREGUNTA_COPY.empty[locale]}</p>
      )}
    </main>
  );
}
