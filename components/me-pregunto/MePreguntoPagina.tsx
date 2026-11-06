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
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { ME_PREGUNTO_MAPA, ME_PREGUNTO_UI } from '@/lib/i18n/me-pregunto';
import { preguntaAlias } from '@/lib/i18n/pregunta-messages';
import { comoFormulario, DejarPregunta } from '@/components/hilos/MePreguntoPanel';
import { esMePreguntaId, type MePreguntaPublica } from '@/lib/me-pregunto/shared';
import type { RespuestaPublica } from '@/lib/respuestas/public';

/** Preguntas de las personas; con ?p=mp-… muestra una pregunta con todas sus respuestas. */
export function MePreguntoPagina() {
  const { locale } = useHomeLocale();
  const ui = ME_PREGUNTO_UI[locale];
  const copy = ME_PREGUNTO_MAPA[locale];
  const params = useSearchParams();
  const pedida = params.get('p');
  const responder = params.get('responder') === '1';
  const [preguntas, setPreguntas] = useState<MePreguntaPublica[] | null>(null);
  const [respuestas, setRespuestas] = useState<RespuestaPublica[]>([]);
  const [dejando, setDejando] = useState(false);

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

  if (una) {
    const lista = porPregunta.get(una.id) ?? [];
    return (
      <PaginaInterna>
        <EncabezadoInterno
          volver={{ href: '/me-pregunto', texto: copy.todasLasPreguntas }}
          ceja={copy.titulo}
          titulo={una.texto}
          bajada={ui.loPregunta(preguntaAlias(una.alias), formatPublicPlace(una.city, una.country, locale))}
          largo
        >
          <ResponderAqui
            pregunta={comoFormulario(una, locale)}
            texto={copy.responderEsta}
            cerrarTexto={ui.cancelar}
            abiertoInicial={responder}
          />
        </EncabezadoInterno>
        {lista.length === 0 ? (
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

  return (
    <PaginaInterna>
      <EncabezadoInterno titulo={copy.titulo} bajada={copy.intro}>
        {/* Dejar una pregunta también se hace aquí (antes solo en el panel de la home). */}
        {dejando ? (
          <div
            className="relative mt-6 max-w-3xl rounded-2xl bg-[#F4F2EE] p-5 md:p-8"
            style={{ ['--cortina-texto' as string]: '#3C4655', ['--cortina-fondo' as string]: '#F4F2EE', boxShadow: '0 10px 30px rgba(60,70,85,0.12)' }}
          >
            <DejarPregunta
              locale={locale}
              onCancel={() => setDejando(false)}
              onVolver={() => {
                window.location.href = '/#cintas';
              }}
            />
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <p className="m-0 text-[length:var(--fs-pequeno)] text-[#616C7C]">{ui.invitaDejar}</p>
            <button type="button" onClick={() => setDejando(true)} className="btn-am-principal inline-flex min-h-11 items-center justify-center px-6">
              {ui.dejar}
            </button>
          </div>
        )}
      </EncabezadoInterno>
      {preguntas && preguntas.length === 0 ? <TextoVacio locale={locale} /> : null}
      <GrillaTarjetas>
        {(preguntas ?? []).map((p) => {
          const n = porPregunta.get(p.id)?.length ?? 0;
          return (
            <Tarjeta key={p.id}>
              <p className="m-0 text-[length:var(--fs-texto)] leading-snug">{p.texto}</p>
              <p className="m-0 mt-2 text-[length:var(--fs-etiqueta)] text-[#616C7C]">
                {ui.loPregunta(preguntaAlias(p.alias), formatPublicPlace(p.city, p.country, locale))}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-4">
                <Link
                  href={`/me-pregunto?p=${encodeURIComponent(p.id)}&responder=1`}
                  className="btn-am-principal inline-flex min-h-11 items-center justify-center px-5 no-underline"
                >
                  {copy.respondele(preguntaAlias(p.alias))}
                </Link>
                <Link
                  href={`/me-pregunto?p=${encodeURIComponent(p.id)}`}
                  className={`inline-block text-[length:var(--fs-pequeno)] ${enlaceInterno}`}
                >
                  {n > 0 ? `${copy.verRespuestas} (${n})` : copy.verRespuestas}
                </Link>
              </div>
            </Tarjeta>
          );
        })}
      </GrillaTarjetas>
    </PaginaInterna>
  );
}
