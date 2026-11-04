'use client';

import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { ComoFuncionaContenido } from '@/components/home/ComoFuncionaModal';
import { COMO_FUNCIONA } from '@/lib/i18n/como-funciona';
import { HomeDialogFrame } from '@/components/home/HomeDialogFrame';
import {
  propositoFor,
  type ManifiestoBlock,
  type ManifiestoSection } from '@/lib/i18n/proposito';
import { SITE_FONT_STACK } from '@/lib/typography';

const soft = {
  bg: 'var(--home-bg)',
  textMain: '#3d4a5c',
  textBody: '#5c6b7e',
  orange: '#FF4A1C',
  card: {
    backgroundColor: '#FBFAF8',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: [
      '10px 10px 24px rgba(136, 150, 170, 0.38)',
      '-10px -10px 26px rgba(255, 255, 255, 0.92)',
      'inset 1px 1px 2px rgba(255, 255, 255, 0.7)',
    ].join(', ') },
  shell: {
    backgroundColor: 'var(--home-bg)',
    borderRadius: 32,
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: [
      '16px 16px 40px rgba(136, 150, 170, 0.42)',
      '-12px -12px 36px rgba(255, 255, 255, 0.95)',
      'inset 2px 2px 4px rgba(255, 255, 255, 0.65)',
    ].join(', ') },
  button: {
    backgroundColor: '#FBFAF8',
    borderRadius: 9999,
    border: '1px solid rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontFamily: SITE_FONT_STACK,
    boxShadow: [
      '8px 8px 20px rgba(136, 150, 170, 0.4)',
      '-8px -8px 20px rgba(255, 255, 255, 0.94)',
      'inset 1px 1px 2px rgba(255, 255, 255, 0.65)',
    ].join(', ') } } as const;

function SectionHeader({ title, index }: { title: string; index: number }) {
  return (
    <header className="mb-5 flex items-start gap-4">
      <span
        className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[length:var(--fs-pequeno)] font-semibold tabular-nums"
        style={{
          ...soft.card,
          color: soft.orange,
          fontFamily: SITE_FONT_STACK }}
        aria-hidden
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3
          className="text-[length:var(--fs-texto)] font-semibold "
          style={{ color: soft.textMain, fontFamily: SITE_FONT_STACK }}
        >
          {title}
        </h3>
        <div
          className="mt-2 h-0.5 w-14 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${soft.orange} 0%, rgba(255, 74, 28, 0.15) 100%)` }}
          aria-hidden
        />
      </div>
    </header>
  );
}

function PullQuote({ text }: { text: string }) {
  return (
    <blockquote
      className="relative my-6 rounded-2xl px-5 py-5 md:px-6 md:py-6"
      style={{
        ...soft.card,
        borderLeft: `4px solid ${soft.orange}` }}
    >
      <span
        className="pointer-events-none absolute left-4 top-2 select-none font-serif text-[length:var(--fs-titular)] leading-none opacity-[0.12]"
        style={{ color: soft.orange }}
        aria-hidden
      >
        “
      </span>
      <p
        className="relative z-[1] text-[length:var(--fs-pequeno)] font-medium italic leading-relaxed md:leading-[1.65]"
        style={{ color: soft.textMain, fontFamily: SITE_FONT_STACK }}
      >
        {text}
      </p>
    </blockquote>
  );
}

function BeliefsList({ items }: { items: string[] }) {
  return (
    <ul className="my-4 space-y-4" role="list">
      {items.map((belief, i) => (
        <li key={i} className="flex gap-3">
          <span
            className="mt-2 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: soft.orange, boxShadow: '0 0 8px rgba(255, 74, 28, 0.45)' }}
            aria-hidden
          />
          <p
            className="text-[length:var(--fs-pequeno)] leading-relaxed md:leading-[1.7]"
            style={{ color: soft.textBody, fontFamily: SITE_FONT_STACK }}
          >
            {belief}
          </p>
        </li>
      ))}
    </ul>
  );
}

function ClosingBlock({ lines }: { lines: string[] }) {
  return (
    <div
      className="rounded-3xl px-6 py-8 text-center md:px-10 md:py-10"
      style={{
        background: 'linear-gradient(145deg, rgba(255, 74, 28, 0.08) 0%, rgba(251,250,248,0.95) 48%, #FBFAF8 100%)',
        border: '1px solid rgba(255, 140, 90, 0.25)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 28px rgba(255, 74, 28, 0.08)' }}
    >
      {lines.map((line, i) => (
        <p
          key={i}
          className={
            lines.length === 1
              ? 'text-[length:var(--fs-texto)] font-medium leading-relaxed md:leading-[1.65]'
              : i === 0 || i === 1
                ? 'text-[length:var(--fs-subtitulo)] font-semibold leading-tight '
                : i >= lines.length - 2
                  ? 'mt-4 text-[length:var(--fs-pequeno)] font-medium '
                  : 'mt-3 text-[length:var(--fs-pequeno)] leading-relaxed '
          }
          style={{
            color: lines.length === 1 ? soft.textMain : i < 2 ? soft.textMain : soft.textBody,
            fontFamily: SITE_FONT_STACK }}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

function renderBlock(block: ManifiestoBlock, key: string) {
  switch (block.type) {
    case 'lead':
      return (
        <div key={key} className="mb-5 space-y-1">
          {block.lines.map((line, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? 'text-[length:var(--fs-titular)] font-normal leading-tight '
                  : 'text-[length:var(--fs-titular)] font-semibold leading-tight '
              }
              style={{ color: i === 0 ? soft.textBody : soft.textMain, fontFamily: SITE_FONT_STACK }}
            >
              {line}
            </p>
          ))}
        </div>
      );
    case 'p':
      return (
        <p
          key={key}
          className="mb-4 text-[length:var(--fs-pequeno)] leading-relaxed last:mb-0 md:leading-[1.75]"
          style={{ color: soft.textBody, fontFamily: SITE_FONT_STACK }}
        >
          {block.text}
        </p>
      );
    case 'quote':
      return <PullQuote key={key} text={block.text} />;
    case 'beliefs':
      return <BeliefsList key={key} items={block.items} />;
    case 'emphasis':
      return (
        <p
          key={key}
          className="my-5 text-center text-[length:var(--fs-texto)] font-semibold "
          style={{ color: soft.orange, fontFamily: SITE_FONT_STACK }}
        >
          {block.text}
        </p>
      );
    case 'closing':
      return <ClosingBlock key={key} lines={block.lines} />;
    default:
      return null;
  }
}

function ManifiestoSectionView({ section, index }: { section: ManifiestoSection; index: number }) {
  const isClosing = section.id === 'cierre';
  return (
    <section
      key={section.id}
      aria-labelledby={`manifiesto-heading-${section.id}`}
      className="min-h-0"
    >
      {!isClosing ? <SectionHeader title={section.title} index={index} /> : null}
      {isClosing ? (
        <h3
          id={`manifiesto-heading-${section.id}`}
          className="sr-only"
        >
          {section.title}
        </h3>
      ) : (
        <span id={`manifiesto-heading-${section.id}`} className="sr-only">
          {section.title}
        </span>
      )}
      {section.blocks.map((block, i) => renderBlock(block, `${section.id}-${i}`))}
    </section>
  );
}

function HistoriasCtaButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-almamundi w-full rounded-full py-3.5 text-[length:var(--fs-pequeno)] font-semibold transition active:scale-[0.99] sm:w-auto sm:min-w-[min(100%,320px)] sm:px-10"
      style={{
        background: `linear-gradient(180deg, rgba(255, 88, 28, 0.9) 0%, ${soft.orange} 100%)`,
        color: '#fff',
        border: '1px solid rgba(255, 160, 100, 0.6)',
        boxShadow: '0 6px 20px rgba(255, 74, 28, 0.35), inset 0 1px 0 rgba(255,220,180,0.4)',
        fontFamily: SITE_FONT_STACK }}
    >
      {label}
    </button>
  );
}

/** Quién está detrás de AlmaMundi. */
const QUIEN: Record<'es' | 'pt' | 'en', string> = {
  es: 'AlmaMundi es una iniciativa sin fines de lucro de Fundación Democracia Abierta, desarrollada por Precisar.',
  pt: 'O AlmaMundi é uma iniciativa sem fins lucrativos da Fundación Democracia Abierta, desenvolvida pela Precisar.',
  en: 'AlmaMundi is a nonprofit initiative of Fundación Democracia Abierta, developed by Precisar.',
};

export function PropositoModal({
  isOpen,
  onClose,
  onGoToHistorias }: {
  isOpen: boolean;
  onClose: () => void;
  onGoToHistorias?: () => void;
}) {
  const { locale } = useHomeLocale();
  const copy = propositoFor(locale);
  const manifiestoSections = copy.sections;
  const cierre = manifiestoSections.find((s) => s.id === 'cierre');
  const cuerpo = manifiestoSections.filter((s) => s.id !== 'cierre');

  return (
    <HomeDialogFrame
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="proposito-titulo"
      scrollKey={locale}
      panelClassName="md:max-w-3xl"
      panelStyle={{ ...soft.shell, fontFamily: SITE_FONT_STACK }}
      eyebrow={
        <p
          className="mb-1 text-[length:var(--fs-etiqueta)] font-semibold uppercase tracking-[0.12em]"
          style={{ color: soft.orange }}
        >
          {copy.brand}
        </p>
      }
      title={
        <h2
          id="proposito-titulo"
          className="text-[length:var(--fs-titular)] font-semibold"
          style={{ color: soft.textMain }}
        >
          {copy.title}
        </h2>
      }
    >
      {/* Un solo texto que se lee bajando; la frase de cierre y el botón van al final. */}
      <div className="space-y-10">
        {cuerpo.map((section, index) => (
          <ManifiestoSectionView key={section.id} section={section} index={index} />
        ))}
        {cierre ? (
          <div className="flex flex-col items-center gap-6">
            <ManifiestoSectionView section={cierre} index={cuerpo.length} />
            {onGoToHistorias ? <HistoriasCtaButton label={copy.cta} onClick={onGoToHistorias} /> : null}
          </div>
        ) : null}
        <p className="text-center text-[length:var(--fs-pequeno)] leading-relaxed" style={{ color: soft.textBody }}>
          {QUIEN[locale]}
        </p>
        {/* Propósito primero; debajo, cómo funciona (un solo ítem en el menú). */}
        <section aria-labelledby="proposito-como-funciona" className="border-t pt-8" style={{ borderColor: 'rgba(60,70,85,0.15)' }}>
          <h3 id="proposito-como-funciona" className="mb-4 text-[length:var(--fs-subtitulo)] font-semibold" style={{ color: soft.textMain }}>
            {COMO_FUNCIONA[locale].title}
          </h3>
          <ComoFuncionaContenido onClose={onClose} />
        </section>
      </div>
    </HomeDialogFrame>
  );
}
