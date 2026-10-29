'use client';

/**
 * Explicación del sitio + acceso a privacidad (copy acordado con el equipo editorial).
 */
import Link from 'next/link';
import { useEffect } from 'react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { SITE_FONT_STACK } from '@/lib/typography';

const soft = {
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  button: {
    backgroundColor: '#E9ECF3',
    borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontFamily: SITE_FONT_STACK,
    boxShadow: [
      '11px 11px 26px rgba(136, 150, 170, 0.45)',
      '-11px -11px 26px rgba(255, 255, 255, 0.96)',
      'inset 1px 1px 3px rgba(255, 255, 255, 0.65)',
      'inset -2px -2px 6px rgba(163, 177, 198, 0.18)',
    ].join(', ') } } as const;

export function ComoFuncionaModal({
  isOpen,
  onClose }: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { locale } = useHomeLocale();
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copy =
    locale === 'pt'
      ? {
          title: 'Como funciona?',
          p1: 'O AlmaMundi é um mapa vivo de histórias humanas.',
          formats: 'vídeo, áudio, texto ou foto',
          p2: 'Você pode compartilhar seu relato em',
          p2b: '. O envio em qualquer um desses formatos é para pessoas maiores de 18 anos, ou para um adulto responsável ou representante de uma instituição com autorização expressa de quem aparece. Cada história passa por revisão editorial:',
          auto: 'nada é publicado automaticamente',
          p3: 'Só publicamos relatos que respeitem a dignidade humana, a privacidade, os direitos autorais e os direitos humanos. Não aceitamos conteúdos com',
          banned:
            'insultos, injúrias, calúnias, discriminação, racismo, xenofobia, homofobia, ameaças, violência, abuso, exploração, exposição indevida de terceiros, violação de direitos de crianças e adolescentes, plágio ou uso não autorizado de material de outra pessoa',
          p4: 'Para cuidar de cada história, revisamos o conteúdo, a autoria, o consentimento e os possíveis riscos para outras pessoas. Podemos pedir ajustes, não publicar ou retirar relatos quando for necessário.',
          p5: 'Não pedimos dados sensíveis para identificar a autoria. Usamos só a informação necessária para revisar o envio e proteger quem participa.',
          privacy: 'Ver política de privacidade',
          close: 'Fechar',
        }
      : locale === 'en'
        ? {
            title: 'How it works?',
            p1: 'AlmaMundi is a living map of human stories.',
            formats: 'video, audio, text, or photo',
            p2: 'You can share your story in',
            p2b: '. Sending in any of these formats is for people 18 or older, or for a responsible adult or institutional representative with express permission from the people who appear. Each story goes through editorial review:',
            auto: 'nothing is published automatically',
            p3: 'We only publish stories that respect human dignity, privacy, copyright, and human rights. We do not accept content with',
            banned:
              'insults, defamation, slander, discrimination, racism, xenophobia, homophobia, threats, violence, abuse, exploitation, improper exposure of others, violations of the rights of children and adolescents, plagiarism, or unauthorized use of material that belongs to someone else',
            p4: 'To take care of each story, we review its content, authorship, consent, and possible risks to other people. We may ask for changes, decline to publish, or remove stories when needed.',
            p5: 'We do not ask for sensitive data to identify authorship. We use only the information needed to review the submission and protect the people who take part.',
            privacy: 'See the privacy policy',
            close: 'Close',
          }
        : {
            title: '¿Cómo funciona?',
            p1: 'AlmaMundi es un mapa vivo de historias humanas.',
            formats: 'video, audio, texto o fotografía',
            p2: 'Puedes compartir tu relato en',
            p2b: '. El envío en cualquiera de estos formatos es para personas mayores de 18 años, o para un adulto responsable o representante de una institución con autorización expresa de quien aparece. Cada historia pasa por revisión editorial:',
            auto: 'nada se publica automáticamente',
            p3: 'Solo publicamos relatos que respeten la dignidad humana, la privacidad, los derechos de autor y los derechos humanos. No se aceptan contenidos con',
            banned:
              'insultos, injurias, calumnias, discriminación, racismo, xenofobia, homofobia, amenazas, violencia, abuso, explotación, exposición indebida de terceros, vulneración de derechos de niños, niñas y adolescentes, plagio o uso no autorizado de material ajeno',
            p4: 'Para cuidar cada historia, revisamos su contenido, autoría, consentimiento y posibles riesgos para otras personas. Podemos pedir ajustes, no publicar o retirar relatos cuando sea necesario.',
            p5: 'No pedimos datos sensibles para identificar la autoría. Usamos solo la información necesaria para revisar el envío y proteger a quienes participan.',
            privacy: 'Ver política de privacidad',
            close: 'Cerrar',
          };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(30, 35, 45, 0.55)', backdropFilter: 'blur(8px)' }}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="como-funciona-titulo"
        className="max-h-[min(90vh,680px)] w-full max-w-lg overflow-y-auto rounded-[28px] p-6 shadow-2xl md:p-8"
        style={{
          ...soft.button,
          backgroundColor: soft.bg,
          borderRadius: 28,
          fontFamily: SITE_FONT_STACK }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="como-funciona-titulo"
          className="text-[length:var(--fs-subtitulo)] font-semibold "
          style={{ color: soft.textMain }}
        >
          {copy.title}
        </h2>
        <div
          className="mt-5 space-y-3 text-[length:var(--fs-pequeno)] leading-relaxed md:space-y-3.5 "
          style={{ color: soft.textBody }}
        >
          <p>{copy.p1}</p>
          <p>
            {copy.p2}{' '}
            <strong style={{ color: soft.textMain }}>{copy.formats}</strong>
            {copy.p2b}{' '}
            <strong style={{ color: soft.textMain }}>{copy.auto}</strong>.
          </p>
          <p>
            {copy.p3}{' '}
            <strong style={{ color: soft.textMain }}>{copy.banned}</strong>.
          </p>
          <p>{copy.p4}</p>
          <p>{copy.p5}</p>
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
          <button
            type="button"
            onClick={onClose}
            className="btn-almamundi rounded-full px-6 py-3 text-[length:var(--fs-pequeno)] font-semibold transition active:scale-[0.98]"
            style={{ ...soft.button, color: soft.textMain }}
          >
            {copy.close}
          </button>
        </div>
      </div>
    </div>
  );
}
