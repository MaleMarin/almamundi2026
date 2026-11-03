'use client';

/**
 * Explicación del sitio + acceso a privacidad (copy acordado con el equipo editorial).
 */
import Link from 'next/link';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HomeDialogFrame } from '@/components/home/HomeDialogFrame';
import { COMO_FUNCIONA } from '@/lib/i18n/como-funciona';
import { SITE_FONT_STACK } from '@/lib/typography';
const soft = {
  bg: 'var(--home-bg)',
  textMain: '#4A5568',
  textBody: '#616C7C',
  button: {
    backgroundColor: '#FBFAF8',
    borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontFamily: SITE_FONT_STACK,
    boxShadow: [
      '11px 11px 26px rgba(136, 150, 170, 0.45)',
      '-11px -11px 26px rgba(255, 255, 255, 0.96)',
      'inset 1px 1px 3px rgba(255, 255, 255, 0.65)',
      'inset -2px -2px 6px rgba(120,110,100,0.18)',
    ].join(', ') } } as const;

export function ComoFuncionaModal({
  isOpen,
  onClose }: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { locale } = useHomeLocale();
  const copy = COMO_FUNCIONA[locale];

  return (
    <HomeDialogFrame
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="como-funciona-titulo"
      scrollKey={locale}
      panelClassName="md:max-w-lg"
      panelStyle={{
        ...soft.button,
        backgroundColor: soft.bg,
        borderRadius: 28,
        fontFamily: SITE_FONT_STACK,
      }}
      title={
        <h2
          id="como-funciona-titulo"
          className="text-[length:var(--fs-subtitulo)] font-semibold"
          style={{ color: soft.textMain }}
        >
          {copy.title}
        </h2>
      }
    >
        <ComoFuncionaContenido onClose={onClose} />
    </HomeDialogFrame>
  );
}

/** Pasos y reglas de «¿Cómo funciona?». También va dentro de Propósito. */
export function ComoFuncionaContenido({ onClose }: { onClose: () => void }) {
  const { locale } = useHomeLocale();
  const copy = COMO_FUNCIONA[locale];
  return (
    <>
        <div
          className="space-y-3 text-[length:var(--fs-pequeno)] leading-relaxed md:space-y-3.5"
          style={{ color: soft.textBody }}
        >
          <p>{copy.intro}</p>
          <ol className="list-decimal space-y-3 pl-5">
            {copy.steps.map((step) => (
              <li key={step.lead}>
                <strong style={{ color: soft.textMain }}>{step.lead}</strong> {step.rest}
              </li>
            ))}
          </ol>
          <h3 className="pt-1 text-[length:var(--fs-pequeno)] font-semibold" style={{ color: soft.textMain }}>
            {copy.safeTitle}
          </h3>
          <ul className="list-disc space-y-3 pl-5">
            {copy.safe.map((item) =>
              item.kind === 'text' ? (
                <li key={item.text}>{item.text}</li>
              ) : (
                <li key={item.link}>
                  {item.before}
                  <Link href="/mis-datos-personales" className="underline" style={{ color: soft.textMain }} onClick={onClose}>
                    {item.link}
                  </Link>
                  {item.after}
                </li>
              )
            )}
          </ul>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <Link
            href="/privacidad"
            className="btn-almamundi inline-flex justify-center rounded-full px-6 py-3 text-center text-[length:var(--fs-pequeno)] font-semibold transition active:scale-[0.98]"
            style={{ ...soft.button, color: soft.textMain }}
            onClick={onClose}
          >
            {copy.privacy}
          </Link>
        </div>
    </>
  );
}
