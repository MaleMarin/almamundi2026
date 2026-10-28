'use client';

import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { preguntaTexto, type QuestionId, type QuestionMode } from '@/lib/pregunta-semana';

type ContarFormat = 'video' | 'audio' | 'texto' | 'foto';

export function AnsweringStrip({
  questionId,
  questionMode,
  format,
  variant = 'page' }: {
  questionId: QuestionId;
  questionMode: QuestionMode;
  format?: ContarFormat | null;
  variant?: 'page' | 'modal';
}) {
  const { t, locale } = useHomeLocale();
  const text = preguntaTexto(questionId, questionMode, locale);
  if (!text) return null;
  const advice =
    questionMode === 'alguien' && format
      ? format === 'texto'
        ? t.modalAskAdviceTexto
        : format === 'audio'
          ? t.modalAskAdviceAudio
          : format === 'video'
            ? t.modalAskAdviceVideo
            : t.modalAskAdviceFoto
      : null;

  if (variant === 'modal') {
    return (
      <div
        className="shrink-0 border-b border-white/50 px-5 py-3 md:px-8"
        style={{ backgroundColor: '#E8EBF2' }}
      >
        <p className="text-[length:var(--fs-pequeno)] leading-snug text-gray-700 ">
          <span className="font-semibold">{t.modalAnsweringPrefix}</span> {text}
        </p>
        {advice ? <p className="mt-1 text-[length:var(--fs-pequeno)] leading-snug text-gray-600">{advice}</p> : null}
      </div>
    );
  }

  return (
    <p className="mx-auto mb-4 max-w-[min(100%,40rem)] shrink-0 px-1 text-center text-[length:var(--fs-pequeno)] leading-snug text-gray-700 md:mb-5 ">
      <span className="font-semibold">{t.modalAnsweringPrefix}</span> {text}
    </p>
  );
}
