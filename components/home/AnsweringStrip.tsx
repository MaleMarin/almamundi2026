'use client';

import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';
import { preguntaTexto, type QuestionId, type QuestionMode } from '@/lib/pregunta-semana';

type ContarFormat = 'video' | 'audio' | 'texto' | 'foto';

export function AnsweringStrip({
  questionId,
  questionMode,
  variant = 'page' }: {
  questionId: QuestionId;
  questionMode: QuestionMode;
  format?: ContarFormat | null;
  variant?: 'page' | 'modal';
}) {
  const { locale } = useHomeLocale();
  const text = preguntaTexto(questionId, questionMode, locale);
  if (!text) return null;
  const line = (
    <>
      <span className="font-semibold">{HILOS_UI[locale].respondes}</span> {text}
    </>
  );

  if (variant === 'modal') {
    return (
      <p className="mb-3 text-[length:var(--fs-pequeno)] leading-snug text-[#4A5568]">{line}</p>
    );
  }

  return (
    <p className="mx-auto mb-4 max-w-[min(100%,40rem)] shrink-0 px-1 text-center text-[length:var(--fs-pequeno)] leading-snug text-[#4A5568] md:mb-5">
      {line}
    </p>
  );
}
