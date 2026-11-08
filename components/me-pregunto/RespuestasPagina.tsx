'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import {
  EncabezadoInterno,
  GrillaTarjetas,
  PaginaInterna,
  ResponderAqui,
  Tarjeta,
  TarjetaRespuesta,
  TextoVacio,
  enlaceInterno,
} from '@/components/me-pregunto/PaginaInterna';
import { hiloPorId, preguntaHiloPorId, preguntaParaFormulario } from '@/lib/hilos';
import { ME_PREGUNTO_UI } from '@/lib/i18n/me-pregunto';
import type { PreguntaSemana } from '@/lib/pregunta-semana';
import { ME_PREGUNTO_MAPA } from '@/lib/i18n/me-pregunto';
import type { RespuestaPublica } from '@/lib/respuestas/public';

/**
 * Respuestas a las preguntas de AlmaMundi (las de las cintas).
 * Sin ?p: las preguntas que ya tienen respuestas. Con ?p=id: todas las respuestas de esa pregunta.
 */
export function RespuestasPagina() {
  const { locale } = useHomeLocale();
  const copy = ME_PREGUNTO_MAPA[locale];
  const pregunta = preguntaHiloPorId(useSearchParams().get('p'));
  const tema = hiloPorId(pregunta?.hiloId ?? null);
  const [todas, setTodas] = useState<RespuestaPublica[] | null>(null);

  useEffect(() => {
    let cancel = false;
    void fetch('/api/respuestas/public?banco=hilos&limit=500')
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: RespuestaPublica[] }) => {
        if (!cancel) setTodas(data.items ?? []);
      })
      .catch(() => !cancel && setTodas([]));
    return () => {
      cancel = true;
    };
  }, []);

  const hayRespuestasEditoriales = (todas ?? []).some((item) => item.editorial);
  const avisoEditorial = locale === "en"
    ? "This section includes editorial sample responses created for AlmaMundi."
    : locale === "pt"
      ? "Esta seção inclui respostas de exemplo criadas pela equipe editorial do AlmaMundi."
      : "Esta sección incluye respuestas de muestra creadas por el equipo editorial de AlmaMundi.";

  const porPregunta = useMemo(() => {
    const map = new Map<string, RespuestaPublica[]>();
    for (const item of todas ?? []) map.set(item.questionId, [...(map.get(item.questionId) ?? []), item]);
    return map;
  }, [todas]);

  if (pregunta) {
    const lista = porPregunta.get(pregunta.id) ?? [];
    return (
      <PaginaInterna>
        <EncabezadoInterno
          volver={{ href: '/respuestas-a-almamundi', texto: copy.dockAlmaMundi }}
          ceja={tema?.nombre[locale]}
          titulo={pregunta.texto[locale]}
          largo
        >
          <ResponderAqui
            pregunta={preguntaParaFormulario(pregunta.id) as PreguntaSemana | null}
            texto={copy.responderEsta}
            cerrarTexto={ME_PREGUNTO_UI[locale].cancelar}
          />
        </EncabezadoInterno>
        {hayRespuestasEditoriales && lista.some((item) => item.editorial) ? <p className="mb-5 text-[length:var(--fs-pequeno)] text-[#616C7C]">{avisoEditorial}</p> : null}
        {todas && lista.length === 0 ? (
          <TextoVacio locale={locale} />
        ) : (
          <GrillaTarjetas>
            {lista.map((item) => (
              <TarjetaRespuesta key={item.id} item={item} locale={locale} />
            ))}
          </GrillaTarjetas>
        )}
      </PaginaInterna>
    );
  }

  const conRespuestas = [...porPregunta.entries()]
    .map(([id, lista]) => ({ p: preguntaHiloPorId(id), n: lista.length }))
    .filter((x): x is { p: NonNullable<ReturnType<typeof preguntaHiloPorId>>; n: number } => Boolean(x.p));

  return (
    <PaginaInterna>
      <EncabezadoInterno titulo={copy.dockAlmaMundi} bajada={copy.introRespuestas}>
        <Link href="/preguntas" className={`mt-4 inline-block text-[length:var(--fs-pequeno)] ${enlaceInterno}`}>
          {copy.verPreguntasAlmaMundi}
        </Link>
      </EncabezadoInterno>
      {hayRespuestasEditoriales ? <p className="mb-5 text-[length:var(--fs-pequeno)] text-[#616C7C]">{avisoEditorial}</p> : null}
      {todas && conRespuestas.length === 0 ? <TextoVacio locale={locale} /> : null}
      <GrillaTarjetas>
        {conRespuestas.map(({ p, n }) => (
          <Tarjeta key={p.id}>
            {hiloPorId(p.hiloId) ? (
              <p className="m-0 mb-2 text-[length:var(--fs-etiqueta)] uppercase tracking-[0.12em] text-[#B8340F]">
                {hiloPorId(p.hiloId)!.nombre[locale]}
              </p>
            ) : null}
            <p className="m-0 text-[length:var(--fs-texto)] leading-snug">{p.texto[locale]}</p>
            <Link
              href={`/respuestas-a-almamundi?p=${encodeURIComponent(p.id)}`}
              className={`mt-auto inline-block pt-4 text-[length:var(--fs-pequeno)] ${enlaceInterno}`}
            >
              {`${copy.verRespuestas} (${n})`}
            </Link>
          </Tarjeta>
        ))}
      </GrillaTarjetas>
    </PaginaInterna>
  );
}
