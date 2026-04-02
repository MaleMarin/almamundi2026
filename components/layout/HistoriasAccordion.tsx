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
};

export function HistoriasAccordion({
  variant,
  buttonStyle,
  className = '',
  footerLinkClassName = 'almamundi-footer-link font-normal transition-colors',
}: HistoriasAccordionProps) {
  const pathname = usePathname() ?? '';
  const historiasActive = isHistoriasSectionPath(pathname);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
          Historias {open ? '▼' : '▲'}
        </button>
        {open && (
          <div className="absolute bottom-full left-0 mb-2 py-2 min-w-[180px] bg-[#E0E5EC] rounded-xl shadow-lg border border-gray-200/60 z-50">
            {ITEMS.map((item) => (
              <ActiveInternalNavLink
                key={item.label}
                href={item.href}
                className={`block px-4 py-2.5 text-base hover:bg-gray-200/50 first:rounded-t-xl last:rounded-b-xl ${footerLinkClassName}`}
                activeClassName="!text-black font-semibold"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </ActiveInternalNavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  const headerWrapperClass = [className, historiasActive ? '[&_button]:!text-orange-500 [&_button]:font-semibold' : '']
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div ref={ref} className={headerWrapperClass}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-active={open ? 'true' : undefined}
        className="px-4 py-2 rounded-full text-sm transition-all"
        style={buttonStyle}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Historias {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 py-2 min-w-[160px] bg-[#E0E5EC] rounded-xl shadow-lg border border-gray-200/60 z-50">
          {ITEMS.map((item) => (
            <ActiveInternalNavLink
              key={item.label}
              href={item.href}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 first:rounded-t-xl last:rounded-b-xl"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </ActiveInternalNavLink>
          ))}
        </div>
      )}
    </div>
  );
}
