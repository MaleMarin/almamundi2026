'use client';

/**
 * Acordeón "Historias": al hacer clic se despliegan Videos, Audio, Escrito, Fotografía.
 * Para header (neumórfico) y footer (links).
 */
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const ITEMS = [
  { label: 'Videos', href: '/historias/videos' },
  { label: 'Audio', href: '/historias/videos' },
  { label: 'Escrito', href: '/historias/videos' },
  { label: 'Fotografía', href: '/historias/videos' },
] as const;

type Variant = 'header' | 'footer';

type HistoriasAccordionProps = {
  variant: Variant;
  /** Estilos inline para el botón (header neumórfico) */
  buttonStyle?: React.CSSProperties;
  className?: string;
};

export function HistoriasAccordion({ variant, buttonStyle, className = '' }: HistoriasAccordionProps) {
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
          className="hover:text-gray-900 transition-colors font-normal"
          aria-expanded={open}
          aria-haspopup="true"
        >
          Historias {open ? '▼' : '▲'}
        </button>
        {open && (
          <div className="absolute bottom-full left-0 mb-2 py-2 min-w-[180px] bg-[#E0E5EC] rounded-xl shadow-lg border border-gray-200/60 z-50">
            {ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block px-4 py-2.5 text-base text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 first:rounded-t-xl last:rounded-b-xl"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
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
            <Link
              key={item.label}
              href={item.href}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 first:rounded-t-xl last:rounded-b-xl"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
