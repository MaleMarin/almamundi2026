'use client';

/**
 * Acordeón "Historias": al hacer clic se despliegan Videos, Audios, Escritos, Fotografías.
 * Para header (neumórfico) y footer (links).
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';
import { MAP_HOME_NEU_BUTTON_STYLE } from '@/lib/map-home-neu-button';
import { isHistoriasSectionPath } from '@/lib/internal-nav-active';

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
  footerLinkClassName =
    'almamundi-footer-link text-xs font-semibold leading-snug transition-colors',
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
          className={`text-left text-xs font-semibold leading-none transition-colors hover:text-[var(--almamundi-orange)] ${historiasActive ? 'text-gray-900' : 'text-gray-600'}`}
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
                className={`block px-4 py-2.5 text-xs font-semibold leading-snug hover:bg-gray-200/50 first:rounded-t-xl last:rounded-b-xl ${footerLinkClassName}`}
                activeClassName="!text-gray-900 font-semibold"
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

  /** El compacto de mapa incluye `w-full`; aquí debe ceñirse al texto para no estirar el panel desplegable. */
  const headerBtnClass = [
    headerButtonClassName ?? 'px-4 py-2 rounded-full text-sm transition-all',
    '!w-max min-w-0 max-w-[14rem] shrink-0',
    'inline-flex items-center justify-center gap-1',
    historiasActive ? '!text-orange-500 font-semibold' : '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const headerWrapperClass = ['relative inline-flex max-w-full flex-col items-start', className]
    .filter(Boolean)
    .join(' ')
    .trim();

  /** Pastillas compactas (no reutilizar la clase mapa con `w-full` + sombras pesadas por fila). */
  const headerMenuItemClass =
    'flex h-8 w-full min-h-8 items-center justify-center rounded-full border border-white/45 bg-[#e6eaf0]/95 px-3 text-center text-xs font-semibold leading-none text-gray-600 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.75),inset_-1px_-1px_2px_rgba(160,172,192,0.22)] transition-[color,background-color,box-shadow] hover:bg-[#eef1f6] hover:text-gray-800 active:scale-[0.99]';

  return (
    <div ref={ref} className={headerWrapperClass}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-active={open ? 'true' : undefined}
        className={headerBtnClass}
        style={buttonStyle ?? MAP_HOME_NEU_BUTTON_STYLE}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>{triggerLabel}</span>
        <ChevronDown
          size={14}
          strokeWidth={2.25}
          className={`shrink-0 opacity-70 transition-transform duration-200 ${open ? '-rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 flex w-[min(22.5rem,calc(100vw-1.25rem))] min-w-[11rem] max-w-[min(22.5rem,calc(100vw-1.25rem))] flex-col gap-0.5 rounded-xl border border-white/50 bg-[#E8EBF2]/97 p-1 shadow-[0_10px_28px_rgba(90,100,120,0.14)] backdrop-blur-sm sm:min-w-[12.5rem]"
          role="menu"
        >
          {ITEMS.map((item) => (
            <ActiveInternalNavLink
              key={item.label}
              href={item.href}
              className={headerMenuItemClass}
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
