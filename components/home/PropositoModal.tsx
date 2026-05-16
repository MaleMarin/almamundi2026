'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MANIFIESTO_SECTIONS,
  MANIFIESTO_TITLE,
  type ManifiestoBlock,
  type ManifiestoSection,
} from '@/lib/proposito-text';
import { SITE_FONT_STACK } from '@/lib/typography';

const soft = {
  bg: '#E0E5EC',
  textMain: '#3d4a5c',
  textBody: '#5c6b7e',
  orange: '#FF4A1C',
  card: {
    backgroundColor: '#E9ECF3',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: [
      '10px 10px 24px rgba(136, 150, 170, 0.38)',
      '-10px -10px 26px rgba(255, 255, 255, 0.92)',
      'inset 1px 1px 2px rgba(255, 255, 255, 0.7)',
    ].join(', '),
  },
  shell: {
    backgroundColor: '#E0E5EC',
    borderRadius: 32,
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: [
      '16px 16px 40px rgba(136, 150, 170, 0.42)',
      '-12px -12px 36px rgba(255, 255, 255, 0.95)',
      'inset 2px 2px 4px rgba(255, 255, 255, 0.65)',
    ].join(', '),
  },
  button: {
    backgroundColor: '#E9ECF3',
    borderRadius: 9999,
    border: '1px solid rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontFamily: SITE_FONT_STACK,
    boxShadow: [
      '8px 8px 20px rgba(136, 150, 170, 0.4)',
      '-8px -8px 20px rgba(255, 255, 255, 0.94)',
      'inset 1px 1px 2px rgba(255, 255, 255, 0.65)',
    ].join(', '),
  },
} as const;

function SectionHeader({ title, index }: { title: string; index: number }) {
  return (
    <header className="mb-5 flex items-start gap-4">
      <span
        className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums"
        style={{
          ...soft.card,
          color: soft.orange,
          fontFamily: SITE_FONT_STACK,
        }}
        aria-hidden
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3
          className="text-lg font-semibold tracking-tight md:text-xl"
          style={{ color: soft.textMain, fontFamily: SITE_FONT_STACK }}
        >
          {title}
        </h3>
        <div
          className="mt-2 h-0.5 w-14 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${soft.orange} 0%, rgba(255, 74, 28, 0.15) 100%)`,
          }}
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
        borderLeft: `4px solid ${soft.orange}`,
      }}
    >
      <span
        className="pointer-events-none absolute left-4 top-2 select-none font-serif text-5xl leading-none opacity-[0.12]"
        style={{ color: soft.orange }}
        aria-hidden
      >
        “
      </span>
      <p
        className="relative z-[1] text-base font-medium italic leading-relaxed md:text-[1.05rem] md:leading-[1.65]"
        style={{ color: soft.textMain, fontFamily: SITE_FONT_STACK }}
      >
        {text}
      </p>
    </blockquote>
  );
}

function StoryGrid({ items }: { items: string[] }) {
  return (
    <ul className="my-5 grid gap-3 sm:grid-cols-2" role="list">
      {items.map((story, i) => (
        <li
          key={i}
          className="rounded-2xl px-4 py-3.5 text-sm leading-snug md:text-[0.9375rem] md:leading-relaxed"
          style={{
            ...soft.card,
            color: soft.textBody,
            fontFamily: SITE_FONT_STACK,
          }}
        >
          <span
            className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: soft.orange }}
          >
            Historia real
          </span>
          {story}
        </li>
      ))}
    </ul>
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
            className="text-sm leading-relaxed md:text-[0.9375rem] md:leading-[1.7]"
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
        background: 'linear-gradient(145deg, rgba(255, 74, 28, 0.08) 0%, rgba(233, 236, 243, 0.95) 48%, #E9ECF3 100%)',
        border: '1px solid rgba(255, 140, 90, 0.25)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 28px rgba(255, 74, 28, 0.08)',
      }}
    >
      {lines.map((line, i) => (
        <p
          key={i}
          className={
            i === 0 || i === 1
              ? 'text-xl font-semibold leading-tight md:text-2xl'
              : i >= lines.length - 2
                ? 'mt-4 text-sm font-medium md:text-base'
                : 'mt-3 text-sm leading-relaxed md:text-[0.9375rem]'
          }
          style={{
            color: i < 2 ? soft.textMain : soft.textBody,
            fontFamily: SITE_FONT_STACK,
          }}
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
                  ? 'text-2xl font-light leading-tight md:text-3xl'
                  : 'text-2xl font-bold leading-tight md:text-3xl'
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
          className="mb-4 text-sm leading-relaxed last:mb-0 md:text-[0.9375rem] md:leading-[1.75]"
          style={{ color: soft.textBody, fontFamily: SITE_FONT_STACK }}
        >
          {block.text}
        </p>
      );
    case 'quote':
      return <PullQuote key={key} text={block.text} />;
    case 'stories':
      return <StoryGrid key={key} items={block.items} />;
    case 'beliefs':
      return <BeliefsList key={key} items={block.items} />;
    case 'emphasis':
      return (
        <p
          key={key}
          className="my-5 text-center text-base font-semibold md:text-lg"
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
      id={`manifiesto-${section.id}`}
      className={isClosing ? 'pt-2' : 'border-t border-white/40 pt-10 first:border-t-0 first:pt-0'}
      aria-labelledby={`manifiesto-heading-${section.id}`}
    >
      {!isClosing ? <SectionHeader title={section.title} index={index} /> : null}
      {isClosing ? (
        <h3 id={`manifiesto-heading-${section.id}`} className="sr-only">
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

export function PropositoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99990] flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6"
      style={{ background: 'rgba(30, 38, 52, 0.58)', backdropFilter: 'blur(10px)' }}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="proposito-titulo"
        className="flex max-h-[min(94dvh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] sm:rounded-[32px]"
        style={{
          ...soft.shell,
          fontFamily: SITE_FONT_STACK,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera fija */}
        <div
          className="shrink-0 border-b border-white/35 px-6 pb-4 pt-6 md:px-10 md:pt-8"
          style={{ background: 'linear-gradient(180deg, #E8EBF2 0%, #E0E5EC 100%)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: soft.orange }}
              >
                AlmaMundi
              </p>
              <h2
                id="proposito-titulo"
                className="text-2xl font-semibold tracking-tight md:text-3xl"
                style={{ color: soft.textMain }}
              >
                {MANIFIESTO_TITLE}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition active:scale-[0.97]"
              style={{ ...soft.button, color: soft.textMain }}
              aria-label="Cerrar manifiesto"
            >
              Cerrar
            </button>
          </div>
          {/* Índice de secciones */}
          <nav
            className="mt-4 flex flex-wrap gap-2"
            aria-label="Secciones del manifiesto"
          >
            {MANIFIESTO_SECTIONS.filter((s) => s.id !== 'cierre').map((s) => (
              <a
                key={s.id}
                href={`#manifiesto-${s.id}`}
                className="rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide transition hover:opacity-90"
                style={{
                  ...soft.card,
                  color: soft.textBody,
                  fontSize: '0.65rem',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`manifiesto-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {s.title}
              </a>
            ))}
          </nav>
        </div>

        {/* Cuerpo con scroll */}
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-8 md:px-10 md:py-10"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,74,28,0.35) transparent' }}
        >
          {MANIFIESTO_SECTIONS.map((section, index) => (
            <ManifiestoSectionView key={section.id} section={section} index={index} />
          ))}
        </div>

        <div
          className="shrink-0 border-t border-white/35 px-6 py-4 md:px-10"
          style={{ background: '#E0E5EC' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-almamundi w-full rounded-full py-3.5 text-sm font-semibold transition active:scale-[0.99] sm:w-auto sm:px-10"
            style={{
              background: `linear-gradient(180deg, rgba(255, 88, 28, 0.9) 0%, ${soft.orange} 100%)`,
              color: '#fff',
              border: '1px solid rgba(255, 160, 100, 0.6)',
              boxShadow: '0 6px 20px rgba(255, 74, 28, 0.35), inset 0 1px 0 rgba(255,220,180,0.4)',
              fontFamily: SITE_FONT_STACK,
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
