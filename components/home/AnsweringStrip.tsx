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
      <div
        className="shrink-0 border-b border-white/50 px-5 py-3 md:px-8"
        style={{ backgroundColor: '#FBFAF8' }}
      >
        <p className="text-[length:var(--fs-pequeno)] leading-snug text-gray-700 ">{line}</p>
      </div>
    );
  }

  return (
    <p className="mx-auto mb-4 max-w-[min(100%,40rem)] shrink-0 px-1 text-center text-[length:var(--fs-pequeno)] leading-snug text-[#4A5568] md:mb-5">
      {line}
    </p>
  );
}
