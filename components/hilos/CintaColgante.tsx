'use client';

import { useState, type CSSProperties, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HILOS, preguntaAlAzar, type Hilo } from '@/lib/hilos';
import { HILOS_UI, tituloHiloPartes } from '@/lib/i18n/hilos-messages';
import type { AlmaLocale } from '@/lib/i18n/locale';

const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#FF4A1C]';

const LARGOS = [168, 214, 186, 252, 198, 276, 162, 238, 190, 264, 174, 228];

const SATIN = [
  { base: '#FF4A1C', brillo: '#FF8A66', pliegue: '#C4320E' },
  { base: '#E5A100', brillo: '#F6C14A', pliegue: '#A87400' },
  { base: '#D94F8C', brillo: '#F09AC0', pliegue: '#A33368' },
  { base: '#4C8C3A', brillo: '#7CB86A', pliegue: '#2F5C24' },
  { base: '#8E4FD6', brillo: '#C09AE8', pliegue: '#62349A' },
] as const;

const TEMBLOR = [3.1, 4.4, 2.8, 5.1, 3.6, 4.8, 2.6, 4.1, 3.4, 5.4, 3.8, 4.6];
const BRILLO = [4.2, 3.3, 5.6, 3.8, 4.9, 3.1, 5.2, 4.4, 3.6, 5.8, 4.0, 3.5];
const PUNTAS: Array<[number, number]> = [
  [0, 0],
  [0, 7],
  [6, 0],
  [0, 0],
  [8, 0],
  [0, 5],
  [0, 0],
  [7, 0],
  [0, 6],
  [0, 0],
  [5, 0],
  [0, 8],
];

const TIRON_MS = 420;

function sinMovimiento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function hrefTema(id: string): string {
  return `/preguntas?p=${encodeURIComponent(id)}`;
}

export function CintaTema({
  index,
  nombre,
  href,
  selected = false,
  onPick,
}: {
  index: number;
  nombre: string;
  href?: string;
  selected?: boolean;
  onPick?: () => void;
}) {
  const router = useRouter();
  const [tirando, setTirando] = useState(false);
  const largo = LARGOS[index] ?? 180;
  const satin = SATIN[index % SATIN.length] ?? SATIN[0];
  const [puntaIzquierda, puntaDerecha] = PUNTAS[index] ?? [0, 0];

  function ir() {
    if (href) router.push(href);
    else onPick?.();
  }

  function activar(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (sinMovimiento()) {
      if (!href) ir();
      return;
    }
    event.preventDefault();
    if (tirando) return;
    setTirando(true);
    window.setTimeout(ir, TIRON_MS);
  }

  const className = `flex w-[4.75rem] shrink-0 flex-col items-center border-0 bg-transparent px-0.5 pt-0 text-center no-underline motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out hover:motion-safe:translate-y-2 md:w-[6.25rem] ${FOCUS}`;
  const cuerpo = (
    <>
      <span
        className={`cinta-hoja-eje${tirando ? ' is-tiron' : ''}`}
        style={tirando ? undefined : { animationDelay: `${index * 0.14}s` }}
      >
        <span
          className="cinta-hoja"
          aria-hidden
          style={
            {
              height: largo,
              '--cinta-base': satin.base,
              '--cinta-brillo': satin.brillo,
              '--cinta-pliegue': satin.pliegue,
              '--punta-i': `${puntaIzquierda}px`,
              '--punta-d': `${puntaDerecha}px`,
              '--temblor': `${TEMBLOR[index] ?? 3.5}s`,
              '--brillo': `${BRILLO[index] ?? 4}s`,
              '--temblor-retraso': `${index * 0.27}s`,
              '--brillo-retraso': `${index * 0.19}s`,
            } as CSSProperties
          }
        />
      </span>
      <span className="mt-2 text-[12px] font-semibold leading-tight text-[#4A5568] md:text-[13px]">{nombre}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={activar} aria-current={selected ? 'true' : undefined}>
        {cuerpo}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={activar} aria-pressed={selected}>
      {cuerpo}
    </button>
  );
}

export function FilaCintas({
  locale,
  selectedId = null,
  enlazar = false,
  onPick,
}: {
  locale: AlmaLocale;
  selectedId?: string | null;
  enlazar?: boolean;
  onPick?: (hilo: Hilo) => void;
}) {
  return (
    <div className="overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="w-max min-w-full px-1">
        <div className="h-[3px] rounded-full bg-[#B8C0CC]" />
        <div className="flex items-start justify-between gap-2 md:gap-0">
          {HILOS.map((item, index) => (
            <CintaTema
              key={item.id}
              index={index}
              nombre={item.nombre[locale]}
              href={enlazar ? hrefTema(item.id) : undefined}
              selected={selectedId === item.id}
              onPick={onPick ? () => onPick(item) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BloqueCintasHome({ locale }: { locale: AlmaLocale }) {
  const router = useRouter();
  const copy = HILOS_UI[locale];
  const titulo = tituloHiloPartes(copy.bloqueTitulo);

  function alAzar() {
    const tema = preguntaAlAzar(null);
    if (!tema) return;
    router.push(hrefTema(tema.id));
  }

  return (
    <section className="relative z-20 mx-auto mt-10 mb-16 w-full max-w-[80rem] scroll-mt-[10.5rem] px-4 sm:px-6 md:mb-24 md:mt-14 md:scroll-mt-[13rem] lg:scroll-mt-[14.75rem]">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF4A1C]">{copy.ceja}</p>
        <h2 className="mx-auto mt-4 max-w-[22ch] text-[length:var(--fs-titular)] font-normal leading-[1.2] text-[#4A5568] md:max-w-none">
          {titulo.antes} <strong className="font-bold">{titulo.cierre}</strong>
        </h2>
      </header>
      <div className="mt-10">
        <FilaCintas locale={locale} enlazar />
      </div>
      <p className="mx-auto mt-6 text-center">
        <button
          type="button"
          onClick={alAzar}
          className={`inline-flex min-h-11 items-center text-[length:var(--fs-pequeno)] font-medium text-[#4A5568] underline decoration-[#FF4A1C]/40 underline-offset-4 hover:text-[#FF4A1C] ${FOCUS}`}
        >
          {copy.azar}
        </button>
      </p>
    </section>
  );
}
