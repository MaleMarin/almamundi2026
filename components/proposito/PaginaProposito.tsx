import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import { CapituloHome } from '@/components/home/CapituloHome';
import { HOME_MESSAGES } from '@/lib/i18n/home-messages';
import { PropositoLocaleSync } from '@/components/proposito/PropositoLocaleSync';
import { ALMA_LOCALES, type AlmaLocale } from '@/lib/i18n/locale';
import { CintaMini } from '@/components/hilos/CintaMini';
import { HILOS, preguntasDelTema } from '@/lib/hilos';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';
import { mapChrome } from '@/lib/i18n/map-chrome';
import { ME_PREGUNTO_MAPA } from '@/lib/i18n/me-pregunto';
import { PROPOSITO_GUIA } from '@/lib/i18n/proposito-guia';
import { PROPOSITO_PAGINA, PROPOSITO_RUTAS, type PropositoSeccion } from '@/lib/i18n/proposito-pagina';
import { cortinaSitioCss } from '@/lib/cortina-sitio';
import { SUBIR_AV_MAX_MINUTES, SUBIR_PHOTO_MAX, SUBIR_TEXT_MAX_CHARS } from '@/lib/subir-limits';
import css from '@/components/proposito/PaginaProposito.module.css';
import { PUBLIC_OG_LOCALE } from '@/lib/i18n/public-meta';
import { PUBLIC_SITE_ORIGIN } from '@/lib/site-origin';
import { SITE_FONT_STACK } from '@/lib/typography';

/**
 * Página institucional «Propósito». Se renderiza en el servidor: todo el texto
 * está en el HTML inicial, sin depender del modal ni de JavaScript.
 */

const TEXT_MAIN = '#3d4a5c';
const TEXT_BODY = '#5c6b7e';
const ORANGE = 'var(--almamundi-orange)';
const LANG_HTML: Record<AlmaLocale, string> = { es: 'es', pt: 'pt-BR', en: 'en' };
const LANG_LABEL: Record<AlmaLocale, string> = { es: 'Español', pt: 'Português', en: 'English' };

export function metadataProposito(locale: AlmaLocale): Metadata {
  const c = PROPOSITO_PAGINA[locale];
  const url = `${PUBLIC_SITE_ORIGIN}${PROPOSITO_RUTAS[locale]}`;
  return {
    title: { absolute: c.metaTitulo },
    description: c.metaDescripcion,
    alternates: {
      canonical: url,
      languages: {
        es: `${PUBLIC_SITE_ORIGIN}${PROPOSITO_RUTAS.es}`,
        'pt-BR': `${PUBLIC_SITE_ORIGIN}${PROPOSITO_RUTAS.pt}`,
        en: `${PUBLIC_SITE_ORIGIN}${PROPOSITO_RUTAS.en}`,
        'x-default': `${PUBLIC_SITE_ORIGIN}${PROPOSITO_RUTAS.es}`,
      },
    },
    openGraph: {
      title: c.metaTitulo,
      description: c.metaDescripcion,
      url,
      type: 'website',
      locale: PUBLIC_OG_LOCALE[locale],
      siteName: 'AlmaMundi',
    },
    robots: { index: true, follow: true },
  };
}

/** **texto** → destacado. */
function conDestacados(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} style={{ fontWeight: 600, color: TEXT_MAIN }}>
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

const ENLACE: CSSProperties = { color: TEXT_MAIN, textDecoration: 'underline', textUnderlineOffset: '0.2em' };

function jsonLd(locale: AlmaLocale) {
  const c = PROPOSITO_PAGINA[locale];
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: c.metaTitulo,
    description: c.metaDescripcion,
    url: `${PUBLIC_SITE_ORIGIN}${PROPOSITO_RUTAS[locale]}`,
    inLanguage: LANG_HTML[locale],
    isPartOf: { '@type': 'WebSite', name: 'AlmaMundi', url: `${PUBLIC_SITE_ORIGIN}/` },
    publisher: {
      '@type': 'Organization',
      name: 'Fundación Democracia Abierta',
      alternateName: 'Precisar',
      url: 'https://precisar.net',
      address: { '@type': 'PostalAddress', addressLocality: 'Santiago', addressCountry: 'CL' },
    },
  };
}

const CORTINA = cortinaSitioCss();
const NUMERO: Record<AlmaLocale, string> = { es: 'es-CL', pt: 'pt-BR', en: 'en-US' };

function Parrafos({ textos }: { textos: string[] }) {
  return (
    <>
      {textos.map((t) => (
        <p key={t} className={css.p}>
          {conDestacados(t)}
        </p>
      ))}
    </>
  );
}

/** Bloque en dos columnas: ceja y título a la izquierda, texto a la derecha. */
function Bloque({
  id,
  ceja,
  titulo,
  tituloFuerte,
  children,
  grande = false,
}: {
  id: string;
  ceja?: string;
  titulo: string;
  tituloFuerte?: string;
  children: ReactNode;
  grande?: boolean;
}) {
  return (
    <section id={id} aria-labelledby={`proposito-${id}`} className={css.bloque}>
      <div className={css.bloqueCabeza}>
        {ceja ? <p className={css.ceja}>{ceja}</p> : null}
        <h2 id={`proposito-${id}`} className={grande ? css.h2Grande : css.h2}>
          {titulo}
          {tituloFuerte ? <span className={css.naranja}> {tituloFuerte}</span> : null}
        </h2>
      </div>
      <div className={css.bloqueCuerpo}>{children}</div>
    </section>
  );
}

export function PaginaProposito({ locale }: { locale: AlmaLocale }) {
  const c = PROPOSITO_PAGINA[locale];
  const g = PROPOSITO_GUIA[locale];
  const hero = HOME_MESSAGES[locale];
  const menu = mapChrome(locale);
  const nombres = {
    cuenta: hero.navTellStory,
    inspirate: hero.cejaInspira,
    descubre: hero.cejaDescubre,
    historias: hero.navStories,
    paraTi: HILOS_UI[locale].nav,
    personas: ME_PREGUNTO_MAPA[locale].titulo,
  };
  const seccion = (id: string): PropositoSeccion => c.secciones.find((s) => s.id === id)!;
  const scroll = seccion('scroll');
  const todas = seccion('todas');
  const formatos = seccion('formatos');
  const pregunta = seccion('pregunta');
  const conoce = seccion('conoce');
  const memorias = seccion('memorias');
  const quienes = seccion('quienes');
  const n = (valor: number) => valor.toLocaleString(NUMERO[locale]);
  // Orden de los textos aprobados de «Elige cómo contarlo»: texto, audio, video, fotografía.
  const tarjetas = [
    { nombre: g.cuenta.formatos.video, texto: formatos.formatos![2]!.texto, limite: g.cuenta.limites.minutos.replace('{n}', n(SUBIR_AV_MAX_MINUTES)) },
    { nombre: g.cuenta.formatos.audio, texto: formatos.formatos![1]!.texto, limite: g.cuenta.limites.minutos.replace('{n}', n(SUBIR_AV_MAX_MINUTES)) },
    { nombre: g.cuenta.formatos.texto, texto: formatos.formatos![0]!.texto, limite: g.cuenta.limites.caracteres.replace('{n}', n(SUBIR_TEXT_MAX_CHARS)) },
    { nombre: g.cuenta.formatos.foto, texto: formatos.formatos![3]!.texto, limite: g.cuenta.limites.fotos.replace('{n}', n(SUBIR_PHOTO_MAX)) },
  ];
  const primerTema = HILOS[0]!;
  const preguntaEjemplo = preguntasDelTema(primerTema.id)[0]!;
  const opcionesMenu = [
    menu.stories,
    ME_PREGUNTO_MAPA[locale].dockAlmaMundi,
    nombres.personas,
    menu.bits,
    menu.search,
  ];
  const navegacion = [
    { href: '#cuenta', texto: nombres.cuenta },
    { href: '#inspirate', texto: nombres.inspirate },
    { href: '#descubre', texto: nombres.descubre },
    { href: '#historias-contadas', texto: nombres.historias },
  ];
  // La imagen de cintas se genera con el algoritmo del sitio a partir de un texto aprobado de esta página.
  const textoCintas = todas.parrafos.join(' ');

  return (
    <main className={css.pagina} style={{ fontFamily: SITE_FONT_STACK }}>
      <PropositoLocaleSync locale={locale} />
      <script
        type="application/ld+json"
        // Datos fijos del propio sitio, sin contenido de terceros.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale)).replace(/</g, '\\u003c') }}
      />
      <article lang={LANG_HTML[locale]} className={css.contenido}>
        <nav aria-label={c.idiomasAria} className={css.idiomas}>
          {ALMA_LOCALES.map((code) =>
            code === locale ? (
              <span key={code} aria-current="page" lang={LANG_HTML[code]} style={{ color: ORANGE }}>
                {LANG_LABEL[code]}
              </span>
            ) : (
              <Link key={code} href={PROPOSITO_RUTAS[code]} hrefLang={LANG_HTML[code]} lang={LANG_HTML[code]} style={{ color: TEXT_BODY }}>
                {LANG_LABEL[code]}
              </Link>
            )
          )}
        </nav>

        <header className={css.cabecera}>
          <div>
            <p className={css.ceja}>{g.ceja}</p>
            <h1 className={css.h1} aria-label={c.titulo}>
              {g.tituloAntes} <span className={css.naranja}>{g.tituloMarca}</span>
            </h1>
            <p className={css.lema}>{c.bajadaLema}</p>
            <Parrafos textos={c.bajada} />
            <nav aria-label={g.navAria}>
              <ol className={css.indice}>
                {navegacion.map((item, i) => (
                  <li key={item.href}>
                    <a href={item.href} className={css.pastilla}>
                      <span className={css.pastillaNumero}>0{i + 1}</span> {item.texto}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <div className={`${css.tarjeta} ${css.tarjetaInicio}`}>
            <p className={css.tarjetaTitulo}>{g.tarjeta.titulo}</p>
            <p className={css.pChico}>{g.tarjeta.texto}</p>
            <div
              aria-hidden
              className={css.franja}
              style={{ backgroundImage: CORTINA.backgroundImage, backgroundSize: `${CORTINA.periodo}px 100%` }}
            />
          </div>
        </header>

        <Bloque id={scroll.id} titulo={scroll.titulo}>
          <Parrafos textos={scroll.parrafos} />
        </Bloque>

        <Bloque id={todas.id} titulo={todas.titulo}>
          <Parrafos textos={todas.parrafos} />
        </Bloque>

        {/* 01 · Cuenta tu historia */}
        <Bloque id="cuenta" ceja={g.cuenta.ceja} titulo={nombres.cuenta} grande>
          <p className={css.p}>{g.cuenta.intro}</p>
        </Bloque>
        <div className={css.cuentaGrilla}>
          <ul className={css.formatos}>
            {tarjetas.map((t) => (
              <li key={t.nombre} className={`${css.tarjeta} ${css.formato}`}>
                <h3 className={css.h3}>{t.nombre}</h3>
                <p className={css.pChico}>{t.texto}</p>
                <p className={css.limite}>{t.limite}</p>
              </li>
            ))}
          </ul>
          <div className={`${css.tarjeta} ${css.cintas}`}>
            <div className={css.cintasImagen} role="img" aria-label={g.cuenta.cintas.alt}>
              <CintaMini storyId="proposito-ejemplo" text={textoCintas} locale={locale} className={css.cintasLienzo} width={640} height={640} />
            </div>
            <div>
              <p className={css.ceja}>{g.cuenta.cintas.ceja}</p>
              <h3 className={css.h3Grande}>{g.cuenta.cintas.titulo}</h3>
              {g.cuenta.cintas.parrafos.map((t) => (
                <p key={t} className={css.pChico}>
                  {conDestacados(t)}
                </p>
              ))}
              <p className={css.nota}>{g.cuenta.cintas.nota}</p>
            </div>
          </div>
        </div>
        <ol className={css.pasos} aria-label={g.cuenta.pasosAria}>
          {g.cuenta.pasos.map((paso) => (
            <li key={paso}>{paso}</li>
          ))}
        </ol>
        <p className={css.nota}>{g.cuenta.pasosNota}</p>
        <div className={css.lectura}>
          <Parrafos textos={formatos.parrafosFinales ?? []} />
        </div>

        {/* 02 · Inspírate */}
        <Bloque id="inspirate" ceja={g.inspirate.ceja} titulo={nombres.inspirate} grande>
          <Parrafos textos={pregunta.parrafos.slice(0, 2)} />
        </Bloque>
        <div className={css.inspirateGrilla}>
          <div className={`${css.tarjeta} ${css.cortina}`}>
            <ul className={css.cortinaCintas}>
              {HILOS.map((hilo) => (
                <li key={hilo.id}>
                  <Link href={`/preguntas?tema=${hilo.id}`} className={css.cinta}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={hilo.imagen} alt="" loading="lazy" className={css.cintaImagen} />
                    <span className={css.cintaNombre}>{hilo.nombre[locale]}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className={css.nota} style={{ textAlign: 'center' }}>
              {g.inspirate.cintasAyuda}
            </p>
          </div>
          <div>
            <p className={css.ceja}>{g.inspirate.dosCeja}</p>
            <h3 className={css.h3Grande}>{g.inspirate.dosTitulo}</h3>
            <blockquote className={css.cita} style={{ borderColor: primerTema.color }}>
              <span className={css.citaTema}>
                {g.inspirate.tema} · {primerTema.nombre[locale]}
              </span>
              {preguntaEjemplo.texto[locale]}
            </blockquote>
            <div className={css.recorridos}>
              <div className={`${css.tarjeta} ${css.recorrido}`}>
                <p className={css.ceja}>{g.inspirate.recorridos[0]!.ceja}</p>
                <h4 className={css.h3}>{nombres.paraTi}</h4>
                <p className={css.pChico}>{g.inspirate.recorridos[0]!.texto}</p>
                <Link href="/#cintas" className={css.enlace}>
                  {g.inspirate.recorridos[0]!.enlace}
                </Link>
              </div>
              <div className={`${css.tarjeta} ${css.recorrido}`}>
                <p className={css.ceja}>{g.inspirate.recorridos[1]!.ceja}</p>
                <h4 className={css.h3}>{nombres.personas}</h4>
                <p className={css.pChico}>{g.inspirate.recorridos[1]!.texto}</p>
                <Link href="/preguntas-de-las-personas" className={css.enlace}>
                  {g.inspirate.recorridos[1]!.enlace}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className={css.lectura}>
          <Parrafos textos={[...g.inspirate.notas, ...pregunta.parrafos.slice(4)]} />
        </div>

        {/* 03 · Descubre */}
        <Bloque id="descubre" ceja={g.descubre.ceja} titulo={nombres.descubre} grande>
          <Parrafos textos={[...conoce.parrafos.slice(0, 2), g.descubre.intro]} />
        </Bloque>
        <div className={css.universo}>
          <p className={css.universoCeja}>{g.descubre.capturaCeja}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/proposito/globo.webp" alt={g.descubre.capturaAlt} width={1800} height={846} loading="lazy" className={css.universoImagen} />
          <dl className={css.opciones}>
            {opcionesMenu.map((nombre, i) => (
              <div key={nombre} className={css.opcion}>
                <dt>{nombre}</dt>
                <dd>{g.descubre.opciones[i]}</dd>
              </div>
            ))}
          </dl>
          <div className={css.universoPie}>
            <p>
              {menu.sounds} {g.descubre.sonidos}
            </p>
            <Link href="/mapa" className={css.botonVidrio}>
              {g.descubre.enlace}
            </Link>
          </div>
        </div>
        <ol className={css.tresPasos}>
          {g.descubre.pasos.map((paso, i) => (
            <li key={paso.titulo} className={`${css.tarjeta} ${css.tresPaso}`}>
              <span className={css.pasoNumero}>0{i + 1}</span>
              <div>
                <p className={css.pasoTitulo}>{paso.titulo}</p>
                <p className={css.pChico}>{paso.texto}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* 04 · Historias contadas */}
        <Bloque id="historias-contadas" ceja={g.historias.ceja} titulo={nombres.historias} grande>
          <p className={css.p}>{g.historias.intro}</p>
          <div className={`${css.tarjeta} ${css.catalogo}`} role="group" aria-label={g.historias.filtrosAria}>
            <ul className={css.filtros}>
              {g.historias.filtros.map((f, i) => (
                <li key={f} className={i === 0 ? css.filtroActivo : css.filtro}>
                  {f}
                </li>
              ))}
            </ul>
            <p className={css.buscador}>{menu.searchTitle}</p>
          </div>
          <Parrafos textos={conoce.parrafos.slice(2)} />
          <p className={css.nota}>{g.historias.nota}</p>
          <Link href="/historias" className={css.boton}>
            {g.historias.enlace}
          </Link>
        </Bloque>

        {/* 05 · Por qué importan estas historias */}
        <Bloque id="algoritmo" ceja={g.algoritmo.ceja} titulo={g.algoritmo.titulo} tituloFuerte={g.algoritmo.tituloFuerte} grande>
          <Parrafos textos={g.algoritmo.parrafos} />
          <p className={css.destacado}>{g.algoritmo.destacado}</p>
        </Bloque>

        <Bloque id={memorias.id} titulo={memorias.titulo}>
          <Parrafos textos={memorias.parrafos} />
        </Bloque>

        <Bloque id="construir" ceja={g.construir.ceja} titulo={g.construir.titulo}>
          <Parrafos textos={g.construir.parrafos} />
        </Bloque>

        {/* Sonder */}
        <section aria-labelledby="proposito-sonder" className={`${css.tarjeta} ${css.sonder}`}>
          <div>
            <p className={css.ceja}>{g.sonder.ceja}</p>
            <h2 id="proposito-sonder" className={css.h2}>
              {g.sonder.titulo}
            </h2>
            <p className={css.p}>{g.sonder.texto}</p>
            <p className={css.nota}>{g.sonder.nota}</p>
          </div>
          <Link href="/#sonder" className={css.botonNaranja}>
            {g.sonder.boton}
          </Link>
        </section>

        {/* Quiénes estamos detrás */}
        <Bloque id={quienes.id} ceja={g.quienesCeja} titulo={quienes.titulo}>
          <Parrafos textos={quienes.parrafos} />
          <nav aria-label={c.enlacesTitulo}>
            <ul className={css.documentos}>
              <li>
                <a href="https://precisar.net" style={ENLACE}>
                  {c.enlaces.precisar}
                </a>
              </li>
              <li>
                <Link href="/terminos" style={ENLACE}>
                  {c.enlaces.terminos}
                </Link>
              </li>
              <li>
                <Link href="/privacidad" style={ENLACE}>
                  {c.enlaces.privacidad}
                </Link>
              </li>
              <li>
                <Link href="/contacto" style={ENLACE}>
                  {c.enlaces.contacto}
                </Link>
              </li>
            </ul>
          </nav>
        </Bloque>
      </article>
      {/* Cierre: la misma frase de la hero, con su mismo ancho y estilo (reglas de #intro en globals.css). */}
      <section className="proposito-cierre home-intro-avenir" style={{ margin: '3.5rem -1rem 0', padding: '2.5rem 0 0' }}>
        <CapituloHome ceja="" titulo={hero.heroBeforeBold} tituloFuerte={`${hero.heroBold},`} cita={hero.citaCuenta} />
      </section>
      <style>{'.proposito-cierre .home-capitulo{display:flex;flex-direction:column;align-items:center;width:100%;max-width:100%;margin-inline:auto;text-align:center}.proposito-cierre .home-capitulo-ceja,.proposito-cierre .home-capitulo-cita{width:fit-content;max-width:100%;margin-inline:auto;text-align:center}.proposito-cierre .home-capitulo-titulo{width:100%;max-width:100%;margin-inline:auto;text-align:center;text-wrap:balance}@media (min-width:768px) and (min-height:600px){.proposito-cierre .home-capitulo-titulo{margin-top:14px;max-width:34em;font-size:clamp(22px,1.5vw + 0.8vh,34px);line-height:1.32}.proposito-cierre .home-capitulo-cita{font-size:clamp(28px,1.4vw + 1.2vh,38px);line-height:1.15}}.proposito-cierre .home-capitulo-cita{margin-top:4px}.proposito-cierre .home-capitulo-titulo-salto{height:clamp(10px,1.8vh,22px)}.proposito-cierre .home-capitulo-ceja{display:none}.almamundi-footer{padding-top:2.5rem!important}'}</style>
    </main>
  );
}
