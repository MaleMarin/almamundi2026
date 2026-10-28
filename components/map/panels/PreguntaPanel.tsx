'use client';

import Link from 'next/link';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { contarIndexHref } from '@/lib/contar-routes';
import {
  PREGUNTA_UI,
  preguntasDeLaSemana,
  type PreguntaSemana,
  type QuestionMode,
} from '@/lib/pregunta-semana';
import type { AlmaLocale } from '@/lib/i18n/locale';
import { SITE_FONT_STACK } from '@/lib/typography';

function PreguntaCard({
  pregunta,
  mode,
  locale,
}: {
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
        border: '1px solid rgba(255,255,255,0.16)',
      }}
    >
      <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: 'rgba(255,255,255,0.78)' }}>
        {pregunta[mode][locale]}
      </p>
      <Link
        href={contarIndexHref({ id: pregunta.id, mode })}
        style={{
          display: 'inline-flex',
          marginTop: 12,
          padding: '8px 14px',
          borderRadius: 999,
          background: 'rgba(249,115,22,0.88)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 13,
          textDecoration: 'none',
          fontFamily: SITE_FONT_STACK,
        }}
      >
        {PREGUNTA_UI.responder[locale]}
      </Link>
    </div>
  );
}

function SemanaBlock({
  pregunta,
  locale,
}: {
  pregunta: PreguntaSemana;
  locale: AlmaLocale;
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
        {pregunta.tema[locale]}
      </h3>
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
        paddingBottom: 8,
      }}
    >
      <SemanaBlock pregunta={vigente} locale={locale} />
      {anteriores.length > 0 ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {PREGUNTA_UI.anteriores[locale]}
          </h3>
          {anteriores.map((pregunta) => (
            <SemanaBlock key={pregunta.id} pregunta={pregunta} locale={locale} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
