'use client';

/**
 * Selector de país con lista completa, búsqueda y panel con altura máxima + scroll
 * (evita el menú nativo que tapa el carrusel).
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getHistoriasFilterCountryNamesEs } from '@/lib/historias/historias-filter-countries';
import { foldText } from '@/lib/historias/story-filter-helpers';
import { neu } from '@/lib/historias-neumorph';

type HistoriasFilterCountrySelectProps = {
  id?: string;
  value: string;
  onChange: (country: string) => void;
};

export function HistoriasFilterCountrySelect({
  id: idProp,
  value,
  onChange,
}: HistoriasFilterCountrySelectProps) {
  const reactId = useId();
  const buttonId = idProp ?? `historias-pais-${reactId.replace(/:/g, '')}`;
  const listboxId = `${buttonId}-listbox`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const allCountries = useMemo(() => getHistoriasFilterCountryNamesEs(), []);

  const filtered = useMemo(() => {
    const q = foldText(query.trim());
    if (!q) return allCountries;
    return allCountries.filter((c) => foldText(c).includes(q));
  }, [allCountries, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const pick = useCallback(
    (country: string) => {
      onChange(country);
      close();
    },
    [onChange, close]
  );

  const labelShown = value.trim() ? value : 'Todos los países';

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        id={buttonId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[2.75rem] w-full items-center gap-1.5 rounded-xl border border-gray-300/45 bg-[#E0E5EC] px-3 py-2 text-left text-sm text-gray-800 shadow-[inset_2px_2px_6px_rgba(163,177,198,0.42),inset_-2px_-2px_6px_rgba(255,255,255,0.88)] outline-none transition focus:ring-2 focus:ring-orange-400/40"
        style={{ fontFamily: neu.APP_FONT }}
      >
        <span className="min-w-0 flex-1 truncate">{labelShown}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-[120] flex max-h-[min(20rem,45vh)] flex-col overflow-hidden rounded-2xl border border-gray-300/50 bg-[#E8ECF2] shadow-[0_12px_40px_rgba(15,23,42,0.18)]"
          role="presentation"
        >
          <div className="shrink-0 border-b border-gray-300/40 p-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar país"
              autoComplete="off"
              aria-label="Buscar en la lista de países"
              className="w-full rounded-xl border border-gray-300/35 bg-[#E0E5EC] px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-[inset_2px_2px_6px_rgba(163,177,198,0.4),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] outline-none focus:ring-2 focus:ring-orange-400/35"
              style={{ fontFamily: neu.APP_FONT }}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={buttonId}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
          >
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === ''}
                className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-white/60"
                style={{ fontFamily: neu.APP_FONT }}
                onClick={() => pick('')}
              >
                Todos los países
              </button>
            </li>
            {filtered.map((c) => (
              <li key={c} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === c}
                  className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-white/60"
                  style={{ fontFamily: neu.APP_FONT }}
                  onClick={() => pick(c)}
                >
                  {c}
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-gray-500">Sin coincidencias</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
