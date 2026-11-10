import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { PropositoLocaleSync } from '@/components/proposito/PropositoLocaleSync';
import { ALMA_LOCALES, type AlmaLocale } from '@/lib/i18n/locale';
import { PROPOSITO_PAGINA, PROPOSITO_RUTAS } from '@/lib/i18n/proposito-pagina';
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

const P: CSSProperties = { margin: '0 0 1.05rem', fontSize: 'var(--fs-texto)', lineHeight: 1.7, color: TEXT_BODY };
const H2: CSSProperties = {
  margin: '0 0 1rem',
  fontSize: 'var(--fs-subtitulo)',
  fontWeight: 400,
  lineHeight: 1.3,
  color: TEXT_MAIN,
};
const BOTON: CSSProperties = {
  display: 'inline-block',
  padding: '0.8rem 1.6rem',
  fontSize: 'var(--fs-pequeno)',
  textDecoration: 'none',
};
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

export function PaginaProposito({ locale }: { locale: AlmaLocale }) {
  const c = PROPOSITO_PAGINA[locale];

  return (
    <main style={{ minHeight: '100vh', background: 'var(--home-bg)', padding: '2rem 1rem 4rem', fontFamily: SITE_FONT_STACK }}>
      <PropositoLocaleSync locale={locale} />
      <script
        type="application/ld+json"
        // Datos fijos del propio sitio, sin contenido de terceros.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale)).replace(/</g, '\\u003c') }}
      />
      <article lang={LANG_HTML[locale]} style={{ maxWidth: 680, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '2.5rem',
          }}
        >
          <HomeHardLink href="/" className="btn-am-neutro" style={{ ...BOTON, padding: '0.45rem 0.9rem' }}>
            {c.volver}
          </HomeHardLink>
          <nav aria-label={c.idiomasAria} style={{ display: 'flex', gap: '0.9rem', fontSize: 'var(--fs-pequeno)' }}>
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
        </div>

        <header style={{ marginBottom: '3rem' }}>
          <p
            style={{
              margin: '0 0 0.5rem',
              fontSize: 'var(--fs-etiqueta)',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: ORANGE,
            }}
          >
            {c.marca}
          </p>
          <h1 style={{ margin: '0 0 1.25rem', fontSize: 'var(--fs-titular)', fontWeight: 400, lineHeight: 1.15, color: TEXT_MAIN }}>
            {c.titulo}
          </h1>
          <p style={{ ...P, fontSize: 'var(--fs-subtitulo)', fontStyle: 'italic', color: ORANGE, lineHeight: 1.4 }}>{c.bajadaLema}</p>
          {c.bajada.map((t) => (
            <p key={t} style={P}>
              {t}
            </p>
          ))}
        </header>

        {c.secciones.map((s) => (
          <section key={s.id} aria-labelledby={`proposito-${s.id}`} style={{ marginBottom: '2.75rem' }}>
            <h2 id={`proposito-${s.id}`} style={H2}>
              {s.titulo}
            </h2>
            {s.parrafos.map((t) => (
              <p key={t} style={P}>
                {conDestacados(t)}
              </p>
            ))}
            {s.formatos ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.05rem' }}>
                {s.formatos.map((f) => (
                  <li key={f.nombre} style={{ ...P, margin: '0 0 0.6rem' }}>
                    <strong style={{ fontWeight: 600, color: TEXT_MAIN }}>{f.nombre}</strong> {f.texto}
                  </li>
                ))}
              </ul>
            ) : null}
            {s.parrafosFinales?.map((t) => (
              <p key={t} style={P}>
                {conDestacados(t)}
              </p>
            ))}
            {s.id === 'quienes' ? (
              <nav aria-label={c.enlacesTitulo}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.4rem', fontSize: 'var(--fs-pequeno)' }}>
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
            ) : null}
          </section>
        ))}

        <section
          aria-labelledby="proposito-cierre"
          style={{ marginTop: '3.5rem', paddingTop: '2.5rem', borderTop: '1px solid rgba(60,70,85,0.15)', textAlign: 'center' }}
        >
          <h2 id="proposito-cierre" style={{ ...H2, fontSize: 'var(--fs-titular)' }}>
            {c.cierreTitulo}
          </h2>
          <p style={P}>{c.cierreTexto}</p>
          <p style={{ ...P, fontStyle: 'italic', color: ORANGE }}>{c.cierreLema}</p>
        </section>
      </article>
    </main>
  );
}
