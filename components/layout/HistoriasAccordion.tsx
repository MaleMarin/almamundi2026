'use client';

/**
 * Acordeón "Historias": al hacer clic se despliegan Videos, Audios, Escritos, Fotografías.
 * Para header (neumórfico) y footer (links).
 */
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';
import { ACTIVE_NAV_CLASS, isHistoriasSectionPath } from '@/lib/internal-nav-active';

const ITEMS = [
  { label: 'Mi colección', href: '/historias/mi-coleccion' },
  { label: 'Videos', href: '/historias/videos' },
  { label: 'Audios', href: '/historias/audios' },
  { label: 'Escritos', href: '/historias/escrito' },
  { label: 'Fotografías', href: '/historias/fotos' },
] as const;

type Variant = 'header' | 'footer';

type HistoriasAccordionProps = {
  variant: Variant;
  /** Estilos inline para el botón (header neumórfico) */
  buttonStyle?: React.CSSProperties;
  className?: string;
  /** Enlaces del desplegable (footer): clase con `almamundi-footer-link` para color negro forzado */
  footerLinkClassName?: string;
  /** Texto del botón desplegable (p. ej. i18n en la home). Por defecto «Historias». */
  triggerLabel?: string;
  /** Tras elegir un enlace del menú (p. ej. cerrar nav móvil en la home). */
  onItemNavigate?: () => void;
  /**
   * Clases del `<button>` en variant `header`. Si no se pasa, se usa el tamaño compacto de interiores.
   * En la home, pasar `MAP_HOME_NEU_BUTTON_CLASS` para igualar `PillNavButton`.
   */
  headerButtonClassName?: string;
};

export function HistoriasAccordion({
  variant,
  buttonStyle,
  className = '',
  footerLinkClassName = 'almamundi-footer-link font-normal transition-colors',
  triggerLabel = 'Historias',
  onItemNavigate,
  headerButtonClassName,
}: HistoriasAccordionProps) {
  const pathname = usePathname() ?? '';
  const historiasActive = isHistoriasSectionPath(pathname);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const afterNavigate = () => {
    setOpen(false);
    onItemNavigate?.();
  };

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  if (variant === 'footer') {
    return (
      <div ref={ref} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`text-black hover:text-gray-800 transition-colors ${historiasActive ? 'font-semibold' : 'font-normal'}`}
          aria-expanded={open}
          aria-haspopup="true"
        >
          {triggerLabel} {open ? '▼' : '▲'}
        </button>
        {open && (
          <div className="absolute bottom-full left-0 mb-2 py-2 min-w-[180px] bg-[#E0E5EC] rounded-xl shadow-lg border border-gray-200/60 z-50">
            {ITEMS.map((item) => (
              <ActiveInternalNavLink
                key={item.label}
                href={item.href}
                className={`block px-4 py-2.5 text-base hover:bg-gray-200/50 first:rounded-t-xl last:rounded-b-xl ${footerLinkClassName}`}
                activeClassName="!text-black font-semibold"
                onClick={afterNavigate}
              >
                {item.label}
              </ActiveInternalNavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  const headerBtnClass = [
    headerButtonClassName ?? 'px-4 py-2 rounded-full text-sm transition-all',
    historiasActive ? '!text-orange-500 font-semibold' : '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const headerWrapperClass = ['relative', className].filter(Boolean).join(' ').trim();

  return (
    <div ref={ref} className={headerWrapperClass}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-active={open ? 'true' : undefined}
        className={headerBtnClass}
        style={buttonStyle}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {triggerLabel} {open ? '▲' : '▼'}
      </button>
      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1.5 w-max min-w-[9.25rem] max-w-[13rem] rounded-[14px] border border-white/55 bg-[#E8EBF2] py-1 shadow-[6px_8px_18px_rgba(136,150,170,0.28),-3px_-4px_14px_rgba(255,255,255,0.92)]"
          role="menu"
        >
          {ITEMS.map((item) => (
            <ActiveInternalNavLink
              key={item.label}
              href={item.href}
              className="block whitespace-nowrap px-3 py-1.5 text-[0.8125rem] font-normal leading-snug tracking-wide text-[#b45309] transition-colors hover:bg-white/45 hover:text-[#9a3412] first:rounded-t-[12px] last:rounded-b-[12px] md:px-3.5 md:py-2 md:text-sm"
              onClick={afterNavigate}
            >
              {item.label}
            </ActiveInternalNavLink>
          ))}
        </div>
      )}
    </div>
  );
}
