'use client';

import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { X } from 'lucide-react';
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type LenisLock = { stop?: () => void; start?: () => void };

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1
  );
}

export function HomeDialogFrame({
  isOpen,
  onClose,
  labelledBy,
  eyebrow,
  title,
  belowTitle,
  children,
  scrollKey,
  panelClassName,
  panelStyle,
}: {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  belowTitle?: ReactNode;
  children: ReactNode;
  scrollKey?: string;
  panelClassName?: string;
  panelStyle?: CSSProperties;
}) {
  const { t } = useHomeLocale();
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  function refreshFade() {
    const el = scrollerRef.current;
    if (!el) return;
    setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 2);
  }

  useLayoutEffect(() => {
    if (!isOpen) return;
    const active = document.activeElement;
    const dialog = dialogRef.current;
    if (active instanceof HTMLElement && dialog && !dialog.contains(active)) {
      openerRef.current = active;
    }
    const lenis = window.__almamundiLenis as unknown as LenisLock | undefined;
    lenis?.stop?.();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.querySelector<HTMLElement>('[data-dialog-close]')?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const items = focusables(dialog);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lenis?.start?.();
      const back = openerRef.current;
      openerRef.current = null;
      back?.focus();
    };
  }, [isOpen, onClose]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = 0;
    refreshFade();
    const observer = new ResizeObserver(() => refreshFade());
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [isOpen, scrollKey]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99990] flex items-center justify-center"
      style={{ background: 'rgba(30, 35, 45, 0.55)', backdropFilter: 'blur(8px)' }}
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`grid h-[100svh] w-[calc(100%-32px)] min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[28px] md:h-auto md:max-h-[calc(100svh-48px)] md:w-full ${panelClassName ?? ''}`}
        style={panelStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-w-0 shrink-0 px-5 pb-3 pt-4 md:px-8 md:pt-6">
          {eyebrow}
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0 flex-1">{title}</div>
            <button
              type="button"
              data-dialog-close
              aria-label={t.modalClose}
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#3C4655] hover:bg-[rgba(60,70,85,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]"
            >
              <X size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          {belowTitle}
        </div>
        <div className="relative min-h-0 min-w-0">
          <div
            ref={scrollerRef}
            onScroll={refreshFade}
            className="h-full min-w-0 overflow-y-auto overscroll-contain px-5 py-4 md:px-8 md:py-6"
          >
            {children}
          </div>
          {moreBelow ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
              style={{
                background: 'linear-gradient(to bottom, transparent, var(--home-bg))',
              }}
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
