'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search } from 'lucide-react';
import { SITE_FONT_STACK } from '@/lib/typography';
import { ME_PREGUNTO_MAPA, ME_PREGUNTO_UI } from '@/lib/i18n/me-pregunto';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { preguntaAlias } from '@/lib/i18n/pregunta-messages';
import type { MePreguntaPublica } from '@/lib/me-pregunto/shared';
import type { RespuestaPublica } from '@/lib/respuestas/public';
import type { AlmaLocale } from '@/lib/i18n/locale';

const POR_PAGINA = 10;

/** Panel del mapa: las preguntas de «Me pregunto…» y, al desplegar cada una, sus respuestas. */
export function MePreguntoMapPanel({
  locale,
  respuestas,
  openId,
  onOpen,
}: {
  locale: AlmaLocale;
  respuestas: RespuestaPublica[];
  openId: string | null;
  onOpen: (item: RespuestaPublica) => void;
}) {
  const ui = ME_PREGUNTO_UI[locale];
  const copy = ME_PREGUNTO_MAPA[locale];
  const [preguntas, setPreguntas] = useState<MePreguntaPublica[]>([]);
  const [query, setQuery] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);
  const [limite, setLimite] = useState(POR_PAGINA);

  useEffect(() => {
    let cancel = false;
    void fetch('/api/me-pregunto')
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: MePreguntaPublica[] }) => {
        if (!cancel) setPreguntas(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, []);

  const grupos = useMemo(() => {
    const porPregunta = new Map<string, RespuestaPublica[]>();
    for (const item of respuestas) {
      const lista = porPregunta.get(item.questionId) ?? [];
      lista.push(item);
      porPregunta.set(item.questionId, lista);
    }
    const conocidas = new Map(preguntas.map((p) => [p.id, p]));
    // Primero las que tienen respuestas (las respuestas llegan de la más nueva a la más antigua).
    const orden: { pregunta: MePreguntaPublica; respuestas: RespuestaPublica[] }[] = [];
    for (const [id, lista] of porPregunta) {
      const p = conocidas.get(id) ?? {
        id,
        texto: lista[0]?.questionText ?? '',
        alias: lista[0]?.askerAlias ?? '',
        city: lista[0]?.askerCity ?? '',
        country: lista[0]?.askerCountry ?? '',
      };
      orden.push({ pregunta: p, respuestas: lista });
    }
    for (const p of preguntas) if (!porPregunta.has(p.id)) orden.push({ pregunta: p, respuestas: [] });
    const q = query.trim().toLowerCase();
    return q ? orden.filter((g) => g.pregunta.texto.toLowerCase().includes(q)) : orden;
  }, [respuestas, preguntas, query]);

  const visibles = grupos.slice(0, limite);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: SITE_FONT_STACK }}>
      <label className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2">
        <Search size={16} className="text-[#FF6E49]" aria-hidden />
        <span className="sr-only">{copy.buscar}</span>
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setLimite(POR_PAGINA);
          }}
          placeholder={copy.buscar}
          className="w-full bg-transparent text-[length:var(--fs-pequeno)] text-white outline-none placeholder:text-white/50"
        />
      </label>
      {grupos.length === 0 ? (
        <p className="m-0 rounded-2xl border border-white/15 bg-white/5 p-5 text-center text-[length:var(--fs-pequeno)] text-white/80">
          {ui.vacio}
        </p>
      ) : null}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {visibles.map(({ pregunta, respuestas: lista }) => {
          const open = abierta === pregunta.id;
          const lugar = formatPublicPlace(pregunta.city, pregunta.country, locale);
          return (
            <li key={pregunta.id} className="rounded-2xl border border-white/15 bg-white/5">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setAbierta(open ? null : pregunta.id)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left text-white"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[length:var(--fs-pequeno)] font-semibold leading-snug">{pregunta.texto}</span>
                  <span className="mt-1 block text-[length:var(--fs-etiqueta)] text-white/65">
                    {ui.loPregunta(preguntaAlias(pregunta.alias), lugar)} · {copy.cuantas(lista.length)}
                  </span>
                </span>
                <ChevronDown size={18} className={`mt-1 shrink-0 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {open ? (
                <div className="flex flex-col gap-2 px-4 pb-4">
                  {lista.length === 0 ? (
                    <Link
                      href={`/preguntas?p=${encodeURIComponent(pregunta.id)}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/40 px-4 text-[length:var(--fs-etiqueta)] font-semibold text-white no-underline"
                    >
                      {copy.primera}
                    </Link>
                  ) : (
                    lista.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onOpen(item)}
                        className={`rounded-xl px-3 py-2 text-left text-white ${
                          openId === item.id ? 'bg-[#FF4A1C]/30' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="block text-[length:var(--fs-etiqueta)] font-semibold">
                          {[preguntaAlias(item.alias), formatPublicPlace(item.city, item.country, locale)].filter(Boolean).join(' · ')}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-[length:var(--fs-etiqueta)] text-white/75">
                          {item.kind === 'texto' ? item.contenido : item.kind === 'voz' ? copy.voz : item.contenido || copy.foto}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {grupos.length > limite ? (
        <button
          type="button"
          onClick={() => setLimite((n) => n + POR_PAGINA)}
          className="min-h-11 rounded-full border border-white/30 text-[length:var(--fs-etiqueta)] font-semibold text-white"
        >
          {copy.mas}
        </button>
      ) : null}
    </div>
  );
}
