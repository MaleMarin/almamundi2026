'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { ME_PREGUNTO_MAPA, ME_PREGUNTO_UI } from '@/lib/i18n/me-pregunto';
import { PREGUNTA_COPY, preguntaAlias } from '@/lib/i18n/pregunta-messages';
import { esMePreguntaId, type MePreguntaPublica } from '@/lib/me-pregunto/shared';
import type { RespuestaPublica } from '@/lib/respuestas/public';

const enlace = 'font-semibold text-[#B8340F] underline underline-offset-4 visited:text-[#B8340F]';

/** Todas las preguntas de «Me pregunto…»; con ?p=mp-… muestra una pregunta con todas sus respuestas. */
export function MePreguntoPagina() {
  const { locale } = useHomeLocale();
  const ui = ME_PREGUNTO_UI[locale];
  const copy = ME_PREGUNTO_MAPA[locale];
  const params = useSearchParams();
  const pedida = params.get('p');
  const [preguntas, setPreguntas] = useState<MePreguntaPublica[] | null>(null);
  const [respuestas, setRespuestas] = useState<RespuestaPublica[]>([]);

  useEffect(() => {
    let cancel = false;
    const json = (url: string) =>
      fetch(url)
        .then((res) => (res.ok ? res.json() : { items: [] }))
        .then((data: { items?: unknown[] }) => (Array.isArray(data.items) ? data.items : []))
        .catch(() => []);
    void Promise.all([json('/api/me-pregunto'), json('/api/respuestas/public?banco=me-pregunto')]).then(([p, r]) => {
      if (cancel) return;
      setPreguntas(p as MePreguntaPublica[]);
      setRespuestas(r as RespuestaPublica[]);
    });
    return () => {
      cancel = true;
    };
  }, []);

  const porPregunta = useMemo(() => {
    const map = new Map<string, RespuestaPublica[]>();
    for (const item of respuestas) map.set(item.questionId, [...(map.get(item.questionId) ?? []), item]);
    return map;
  }, [respuestas]);

  const una = esMePreguntaId(pedida) ? preguntas?.find((p) => p.id === pedida) ?? null : null;
  const lista = una ? porPregunta.get(una.id) ?? [] : [];

  return (
    <main className="mx-auto w-full max-w-[860px] px-6 pb-20 pt-10 text-[#1C1C2E] md:px-10">
      {una ? (
        <>
          <Link href="/me-pregunto" className={`text-[length:var(--fs-pequeno)] ${enlace}`}>
            ← {copy.todasLasPreguntas}
          </Link>
          <h1 className="mb-2 mt-6 text-[length:var(--fs-h2,28px)] font-semibold leading-tight">{una.texto}</h1>
          <p className="m-0 text-[length:var(--fs-pequeno)] text-[#4A5568]">
            {ui.loPregunta(preguntaAlias(una.alias), formatPublicPlace(una.city, una.country, locale))}
          </p>
          <HomeHardLink
            href={`/?capa=me-pregunto&mp=${encodeURIComponent(una.id)}#mapa`}
            className="btn-am-principal mt-6 inline-flex min-h-11 items-center justify-center px-6 text-[length:var(--fs-pequeno)] font-semibold"
          >
            {copy.responderEnMapa}
          </HomeHardLink>
          <ul className="m-0 mt-8 flex list-none flex-col gap-4 p-0">
            {lista.length === 0 ? <li className="text-[#4A5568]">{PREGUNTA_COPY.empty[locale]}</li> : null}
            {lista.map((item) => (
              <li key={item.id} className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="m-0 mb-3 text-[length:var(--fs-etiqueta)] font-semibold text-[#4A5568]">
                  {[preguntaAlias(item.alias), formatPublicPlace(item.city, item.country, locale)].filter(Boolean).join(' · ')}
                </p>
                {item.kind === 'voz' && item.previewUrl ? (
                  <audio controls preload="none" src={item.previewUrl} className="w-full" />
                ) : null}
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
        <>
          <h1 className="mb-2 text-[length:var(--fs-h2,28px)] font-semibold">{ui.nombre}</h1>
          <p className="m-0 mb-8 text-[length:var(--fs-texto)] text-[#4A5568]">{copy.intro}</p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {(preguntas ?? []).map((p) => (
              <li key={p.id} className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="m-0 text-[length:var(--fs-texto)] font-semibold leading-snug">{p.texto}</p>
                <p className="m-0 mt-1 text-[length:var(--fs-etiqueta)] text-[#4A5568]">
                  {ui.loPregunta(preguntaAlias(p.alias), formatPublicPlace(p.city, p.country, locale))}
                </p>
                <Link href={`/me-pregunto?p=${encodeURIComponent(p.id)}`} className={`mt-3 inline-block text-[length:var(--fs-pequeno)] ${enlace}`}>
                  {copy.verRespuestas}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
