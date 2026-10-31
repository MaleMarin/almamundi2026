'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HILOS, preguntaAlAzar, type Hilo } from '@/lib/hilos';
import { HILOS_UI, tituloHiloPartes } from '@/lib/i18n/hilos-messages';
import type { AlmaLocale } from '@/lib/i18n/locale';

const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#FF4A1C]';

const ALTOS = [214, 252, 228, 276, 206, 264, 198, 248, 220, 268, 210, 240];

function hrefTema(id: string) {
  return `/preguntas?tema=${encodeURIComponent(id)}`;
}

function CintaTema({
  index,
  nombre,
  imagen,
  aspecto,
  href,
  selected = false,
  onPick,
}: {
  index: number;
  nombre: string;
  imagen: string;
  aspecto: number;
  href?: string;
  selected?: boolean;
  onPick?: () => void;
}) {
  const alto = ALTOS[index] ?? 220;
  const ancho = Math.round(alto * aspecto) + 16;
  const className = `flex w-[6.4rem] shrink-0 flex-col items-center border-0 bg-transparent px-0.5 pt-0 text-center no-underline md:w-[7.6rem] ${FOCUS}`;
  const cuerpo = (
    <>
      <span className="cinta-tela-eje">
        <span
          className="cinta-tela-caja"
          style={{ '--cinta-alto': `${alto}px`, '--cinta-ancho': `${ancho}px` } as CSSProperties}
        >
          <img src={imagen} alt="" draggable={false} decoding="async" className="cinta-tela-img" />
        </span>
      </span>
      <span className="mt-2 text-[12px] font-semibold leading-tight text-[#4A5568] md:text-[13px]">{nombre}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-current={selected ? 'true' : undefined}>
        {cuerpo}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onPick} aria-pressed={selected}>
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
    <div className="overflow-x-auto pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="w-max min-w-full px-1">
        <div className="h-[3px] rounded-full bg-[#B8C0CC]" />
        <div className="flex items-start justify-between gap-2 md:gap-3">
          {HILOS.map((item, index) => (
            <CintaTema
              key={item.id}
              index={index}
              nombre={item.nombre[locale]}
              imagen={item.imagen}
              aspecto={item.aspecto}
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
    router.push(`/preguntas?p=${encodeURIComponent(tema.id)}`);
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
