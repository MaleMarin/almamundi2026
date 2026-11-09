'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search } from 'lucide-react';
import { recordarMapa } from '@/components/map/recordarMapa';
import { SITE_FONT_STACK } from '@/lib/typography';
import { ME_PREGUNTO_MAPA, ME_PREGUNTO_UI } from '@/lib/i18n/me-pregunto';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { conAnio } from '@/lib/anio-publico';
import { preguntaAlias } from '@/lib/i18n/pregunta-messages';
import type { MePreguntaPublica } from '@/lib/me-pregunto/shared';
import type { RespuestaPublica } from '@/lib/respuestas/public';
import type { AlmaLocale } from '@/lib/i18n/locale';

const POR_PAGINA = 10;

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Panel del mapa: preguntas de las personas y, al desplegar cada una, sus respuestas. Se responde en su página. */
export function MePreguntoMapPanel({
  locale,
  respuestas,
  openId,
  onOpen,
  preguntas,
  abrirId = null,
}: {
  locale: AlmaLocale;
  respuestas: RespuestaPublica[];
  openId: string | null;
  onOpen: (item: RespuestaPublica) => void;
  /** Preguntas publicadas (las carga el mapa, que también las dibuja en el globo). */
  preguntas: MePreguntaPublica[];
  /** Pregunta tocada en el globo: se despliega y se muestra. */
  abrirId?: string | null;
}) {
  const ui = ME_PREGUNTO_UI[locale];
  const copy = ME_PREGUNTO_MAPA[locale];
  const [query, setQuery] = useState('');
  const [abierta, setAbierta] = useState<string | null>(abrirId);
  const [limite, setLimite] = useState(POR_PAGINA);
  /** Celular: la hoja es baja; se muestra la pregunta más reciente completa y el botón para ver todas. */
  const [enCel] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  const [abrirVisto, setAbrirVisto] = useState<string | null>(null);

  // Al tocar un punto multicolor: se despliega su pregunta (patrón de estado derivado, sin efecto).
  if (abrirId && abrirId !== abrirVisto) {
    setAbrirVisto(abrirId);
    setAbierta(abrirId);
    setQuery('');
  }

  useEffect(() => {
    if (!abrirId) return;
    document.getElementById(`mp-card-${abrirId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [abrirId, preguntas.length]);

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
    // Búsqueda por palabras, sin importar tildes ni mayúsculas: en la pregunta, en sus respuestas y en los lugares.
    const palabras = normalizar(query).split(/\s+/).filter(Boolean);
    if (!palabras.length) return orden;
    return orden.filter((g) => {
      const texto = normalizar(
        [
          g.pregunta.texto,
          g.pregunta.city,
          g.pregunta.country,
          ...g.respuestas.map((r) => `${r.contenido} ${r.city} ${r.country}`),
        ].join(' ')
      );
      return palabras.every((palabra) => texto.includes(palabra));
    });
  }, [respuestas, preguntas, query]);

  const visibles = useMemo(() => {
    // Tocada en el globo: solo esa pregunta.
    if (abrirId) {
      const sola = grupos.find((g) => g.pregunta.id === abrirId);
      if (sola) return [sola];
    }
    const page = grupos.slice(0, enCel && !query.trim() ? 1 : limite);
    // La pregunta tocada en el globo siempre se ve, aunque esté más abajo en la lista.
    if (abierta && !page.some((g) => g.pregunta.id === abierta)) {
      const extra = grupos.find((g) => g.pregunta.id === abierta);
      if (extra) return [extra, ...page];
    }
    return page;
  }, [grupos, limite, abierta, abrirId, enCel, query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: SITE_FONT_STACK }}>
      <p className="m-0 text-[length:var(--fs-etiqueta)] leading-snug text-white/90">{copy.intro}</p>
      {abrirId || (grupos.length === 0 && !query.trim()) ? null : (
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
      )}
      {query.trim() && grupos.length === 0 ? (
        <p className="m-0 text-center text-[length:var(--fs-etiqueta)] text-white/75">{copy.sinResultados}</p>
      ) : null}
      {grupos.length === 0 && !query.trim() ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-5 text-center">
          <p className="m-0 text-[length:var(--fs-pequeno)] leading-snug text-white/85">{copy.vacio}</p>
          <Link
            href="/preguntas-de-las-personas"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-[length:var(--fs-etiqueta)] font-semibold text-[#3C4655] no-underline"
          >
            {copy.ir}
          </Link>
        </div>
      ) : null}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {visibles.map(({ pregunta, respuestas: lista }) => {
          const open = abierta === pregunta.id;
          const lugar = conAnio(formatPublicPlace(pregunta.city, pregunta.country, locale), pregunta.anio);
          return (
            <li
              key={pregunta.id}
              id={`mp-card-${pregunta.id}`}
              className={`rounded-2xl border bg-white/5 ${open ? 'border-white/40' : 'border-white/15'}`}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setAbierta(open ? null : pregunta.id)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left text-white"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[length:var(--fs-pequeno)] font-semibold leading-snug">{pregunta.texto}</span>
                  <span className="mt-1 block text-[length:var(--fs-etiqueta)] text-white/85">
                    {ui.loPregunta(preguntaAlias(pregunta.alias), lugar)} · {copy.cuantas(lista.length)}
                  </span>
                </span>
                <ChevronDown size={18} className={`mt-1 shrink-0 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {open && lista.length > 0 ? (
                <div className="flex flex-col gap-2 px-4 pb-4">
                  {lista.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onOpen(item)}
                        className={`rounded-xl px-3 py-2 text-left text-white ${
                          openId === item.id ? 'bg-[#FF4A1C]/30' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="block text-[length:var(--fs-etiqueta)] font-semibold">
                          {[preguntaAlias(item.alias), conAnio(formatPublicPlace(item.city, item.country, locale), item.anio)].filter(Boolean).join(' · ')}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-[length:var(--fs-etiqueta)] text-white/90">
                          {item.kind === 'texto' ? item.contenido : item.kind === 'voz' ? copy.voz : item.contenido || copy.foto}
                        </span>
                      </button>
                  ))}
                </div>
              ) : null}
              {/* Sobre el mapa no se responde: «Ver y responder» lleva a la página de la pregunta (Ana, 5 nov 2026). */}
              <div className="px-4 pb-4">
                <Link
                  href={`/preguntas-de-las-personas?p=${encodeURIComponent(pregunta.id)}`}
                  onClick={() => recordarMapa(`/?capa=me-pregunto&mp=${encodeURIComponent(pregunta.id)}#mapa`)}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/40 px-4 text-[length:var(--fs-etiqueta)] text-white no-underline visited:text-white"
                >
                  {copy.verYResponder}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      {preguntas.length > 0 ? (
        <Link
          href="/preguntas-de-las-personas"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white px-5 text-[length:var(--fs-etiqueta)] font-semibold text-[#3C4655] no-underline visited:text-[#3C4655]"
        >
          {abrirId ? copy.verOtras : copy.verPreguntas}
        </Link>
      ) : null}
      {!abrirId && !(enCel && !query.trim()) && grupos.length > limite ? (
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
