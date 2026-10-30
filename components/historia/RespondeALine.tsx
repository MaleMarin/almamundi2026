'use client';

import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { preguntaTexto, RESPONDE_A_PUBLICO } from '@/lib/pregunta-semana';
import { INTERIOR_FONT_STACK } from '@/lib/typography';

export function RespondeALine({
  questionId,
  color = '#616C7C',
  align = 'left' }: {
  questionId?: string | null;
  questionMode?: string | null;
  color?: string;
  align?: 'left' | 'center';
}) {
  const { locale } = useHomeLocale();
  const text = preguntaTexto(questionId, 'tu', locale);
  if (!text) return null;
  return (
    <p
      style={{
        fontFamily: INTERIOR_FONT_STACK,
        fontSize: 'var(--fs-etiqueta)',
        lineHeight: 1.45,
        fontWeight: 500,
        color,
        textAlign: align,
        margin: align === 'center' ? '0 auto 0.45rem' : '0 0 0.45rem',
        maxWidth: '40rem' }}
    >
      {RESPONDE_A_PUBLICO[locale]} {text}
    </p>
  );
}
