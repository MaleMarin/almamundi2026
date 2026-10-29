'use client';

import Link from 'next/link';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { PREGUNTA_COPY } from '@/lib/i18n/pregunta-messages';
import {
  PREGUNTA_UI,
  preguntaPageHref,
  preguntasDeLaSemana,
  type PreguntaSemana,
  type QuestionMode } from '@/lib/pregunta-semana';
import type { AlmaLocale } from '@/lib/i18n/locale';
import { SITE_FONT_STACK } from '@/lib/typography';

function PreguntaCard({
  pregunta,
  mode,
  locale }: {
  pregunta: PreguntaSemana;
  mode: QuestionMode;
  locale: AlmaLocale;
}) {
  const title = mode === 'tu' ? PREGUNTA_UI.tu[locale] : PREGUNTA_UI.alguien[locale];
  return (
    <div
      style={{
        padding: '14px 14px 12px',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.16)' }}
    >
      <p style={{ margin: '0 0 6px', fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: 'var(--fs-pequeno)', lineHeight: 1.45, color: 'rgba(255,255,255,0.78)' }}>
        {pregunta[mode][locale]}
      </p>
      <Link
        href={preguntaPageHref(pregunta.id, mode)}
        className="btn-am-principal"
        style={{
          display: 'inline-flex',
          marginTop: 12,
          padding: '8px 14px',
          fontWeight: 700,
          fontSize: 'var(--fs-etiqueta)',
          fontFamily: SITE_FONT_STACK }}
      >
        {PREGUNTA_UI.responder[locale]}
      </Link>
    </div>
  );
}

function SemanaBlock({
  pregunta,
  locale,
  linkTema = false }: {
  pregunta: PreguntaSemana;
  locale: AlmaLocale;
  linkTema?: boolean;
}) {
  const title = (
    <h3 style={{ margin: 0, fontSize: 'var(--fs-texto)', fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
      {linkTema ? (
        <Link href={`/pregunta/${pregunta.id}`} style={{ color: 'inherit' }}>
          {pregunta.tema[locale]}
        </Link>
      ) : (
        pregunta.tema[locale]
      )}
    </h3>
  );
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {title}
      <PreguntaCard pregunta={pregunta} mode="tu" locale={locale} />
      <PreguntaCard pregunta={pregunta} mode="alguien" locale={locale} />
    </section>
  );
}

export function PreguntaPanel() {
  const { locale } = useHomeLocale();
  const { vigente, anteriores } = preguntasDeLaSemana();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        fontFamily: SITE_FONT_STACK,
        paddingBottom: 8 }}
    >
      <p style={{ margin: 0, fontSize: 'var(--fs-pequeno)', lineHeight: 1.5, color: 'rgba(255,255,255,0.78)' }}>
        {PREGUNTA_COPY.intro[locale]}
      </p>
      <SemanaBlock pregunta={vigente} locale={locale} />
      {anteriores.length > 0 ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--fs-etiqueta)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)' }}
          >
            {PREGUNTA_UI.anteriores[locale]}
          </h3>
          {anteriores.map((pregunta) => (
            <SemanaBlock key={pregunta.id} pregunta={pregunta} locale={locale} linkTema />
          ))}
        </section>
      ) : null}
      <Link
        href={`/pregunta/${vigente.id}`}
        style={{
          alignSelf: 'flex-start',
          fontWeight: 700,
          fontSize: 'var(--fs-pequeno)',
          color: '#FF6E49',
          fontFamily: SITE_FONT_STACK,
        }}
      >
        {PREGUNTA_COPY.seeAll[locale]}
      </Link>
    </div>
  );
}
