'use client';

import Link from 'next/link';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';
import { preguntasDeLaSemana } from '@/lib/pregunta-semana';
import { SITE_FONT_STACK } from '@/lib/typography';

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]';

/** Panel del globo: el hilo de la semana, en lugar de la respuesta breve. */
export function PreguntaPanel() {
  const { locale } = useHomeLocale();
  const copy = HILOS_UI[locale];
  const semana = preguntasDeLaSemana().vigente;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: SITE_FONT_STACK,
        color: 'rgba(255,255,255,0.92)',
        paddingBottom: 8,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 'var(--fs-etiqueta)',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#FF4A1C',
        }}
      >
        {copy.semana}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--fs-texto)',
          fontWeight: 700,
          lineHeight: 1.35,
          color: 'rgba(255,255,255,0.95)',
        }}
      >
        {semana.tu[locale]}
      </p>
      <Link
        href={`/preguntas?p=${encodeURIComponent(semana.id)}`}
        className={`btn-am-principal inline-flex min-h-11 items-center justify-center px-5 ${FOCUS}`}
        style={{ alignSelf: 'flex-start', textDecoration: 'none' }}
      >
        {copy.cuentala}
      </Link>
      <Link
        href="/preguntas"
        className={FOCUS}
        style={{
          alignSelf: 'flex-start',
          minHeight: 44,
          display: 'inline-flex',
          alignItems: 'center',
          fontWeight: 700,
          color: '#FF6E49',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        {copy.tirar}
      </Link>
    </div>
  );
}
