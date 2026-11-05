'use client';

/**
 * Piezas comunes de las páginas internas de preguntas y respuestas (5 nov 2026):
 * mismo encabezado, ancho y tarjetas que /historias, sin negritas.
 */
import type { ReactNode } from 'react';
import Link from 'next/link';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { neu } from '@/lib/historias-neumorph';
import { PREGUNTA_COPY, preguntaAlias } from '@/lib/i18n/pregunta-messages';
import type { AlmaLocale } from '@/lib/i18n/locale';
import type { RespuestaPublica } from '@/lib/respuestas/public';

export const enlaceInterno = 'text-[#B8340F] underline underline-offset-4 visited:text-[#B8340F]';

export function PaginaInterna({ children }: { children: ReactNode }) {
  return (
    <main className="w-full flex-1 px-4 pb-24 pt-6 md:px-6 md:pt-10 lg:px-10" style={{ color: neu.textMain }}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </main>
  );
}

export function EncabezadoInterno({
  volver,
  ceja,
  titulo,
  bajada,
  largo = false,
  children,
}: {
  volver?: { href: string; texto: string };
  ceja?: string;
  titulo: string;
  bajada?: string;
  /** Títulos largos (una pregunta): un poco más chicos y con ancho de lectura. */
  largo?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className="mb-10">
      {volver ? (
        <Link href={volver.href} className={`mb-6 inline-block text-[length:var(--fs-pequeno)] ${enlaceInterno}`}>
          ← {volver.texto}
        </Link>
      ) : null}
      {ceja ? (
        <p className="m-0 mb-2 text-[length:var(--fs-etiqueta)] uppercase tracking-[0.12em] text-[#B8340F]">{ceja}</p>
      ) : null}
      <h1
        className={`m-0 font-normal leading-tight ${largo ? 'max-w-4xl text-[length:var(--fs-subtitulo)]' : 'text-[length:var(--fs-titular)]'}`}
      >
        {titulo}
      </h1>
      {bajada ? <p className="m-0 mt-2 text-[length:var(--fs-pequeno)] text-[#616C7C]">{bajada}</p> : null}
      {children}
    </header>
  );
}

export function GrillaTarjetas({ children }: { children: ReactNode }) {
  return <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">{children}</ul>;
}

export function Tarjeta({ children }: { children: ReactNode }) {
  return (
    <li className="flex flex-col p-6" style={{ ...neu.card, borderRadius: 22 }}>
      {children}
    </li>
  );
}

export function TextoVacio({ locale }: { locale: AlmaLocale }) {
  return <p className="m-0 text-[length:var(--fs-texto)] text-[#616C7C]">{PREGUNTA_COPY.empty[locale]}</p>;
}

/** Una respuesta publicada: quién y desde dónde, y su texto, voz o foto. */
export function TarjetaRespuesta({ item, locale }: { item: RespuestaPublica; locale: AlmaLocale }) {
  return (
    <Tarjeta>
      <p className="m-0 mb-3 text-[length:var(--fs-etiqueta)] text-[#616C7C]">
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
    </Tarjeta>
  );
}
