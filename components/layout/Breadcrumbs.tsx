'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { isHomeHardNavHref } from '@/lib/home-hard-nav';
import { neu } from '@/lib/historias-neumorph';

export type BreadcrumbNavItem = { label: string; href?: string };

export type BreadcrumbsProps = {
  items: BreadcrumbNavItem[];
  /** Fondo claro neumórfico (interiores) u oscuro (mapa / archivo). */
  tone?: 'light' | 'dark';
  className?: string;
};

const linkLight =
  'shrink-0 rounded-sm font-medium text-gray-600 !no-underline transition-colors hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/70 visited:text-gray-600';

const linkDark =
  'shrink-0 rounded-sm font-medium text-white/65 !no-underline transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/70 visited:text-white/65';

const currentLight = 'min-w-0 max-w-[min(46vw,12rem)] shrink truncate font-semibold text-gray-800 sm:max-w-[18rem] md:max-w-[22rem]';
const currentDark = 'min-w-0 max-w-[min(46vw,12rem)] shrink truncate font-semibold text-white/90 sm:max-w-[18rem] md:max-w-[22rem]';

const sepLight = 'text-gray-400';
const sepDark = 'text-white/35';

export function Breadcrumbs({ items, tone = 'light', className = '' }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  const linkClass = tone === 'dark' ? linkDark : linkLight;
  const currentClass = tone === 'dark' ? currentDark : currentLight;
  const sepClass = tone === 'dark' ? sepDark : sepLight;

  const barStyle: CSSProperties =
    tone === 'light'
      ? {
          ...neu.cardInset,
          borderRadius: 14,
        }
      : {
          backgroundColor: 'rgba(255,255,255,0.06)',
          boxShadow:
            'inset 4px 4px 10px rgba(0,0,0,0.35), inset -3px -3px 8px rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
        };

  return (
    <nav aria-label="Migas de pan" className={`w-full min-w-0 ${className}`.trim()}>
      <div
        className="max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
        style={{
          ...barStyle,
          scrollbarColor:
            tone === 'dark' ? 'rgba(255,255,255,0.25) transparent' : 'rgba(148,163,184,0.45) transparent',
        }}
      >
        <ol className="m-0 flex w-max min-w-full list-none flex-nowrap items-center gap-1 px-3 py-2 text-[0.6875rem] leading-snug sm:text-[0.8125rem]">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const key = `${item.label}-${index}`;

            return (
              <li key={key} className="flex min-w-0 items-center gap-1">
                {index > 0 ? (
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 opacity-90 ${sepClass}`} aria-hidden />
                ) : null}
                {!isLast && item.href ? (
                  isHomeHardNavHref(item.href) ? (
                    <HomeHardLink href={item.href} className={linkClass}>
                      {item.label}
                    </HomeHardLink>
                  ) : (
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  )
                ) : (
                  <span className={currentClass} title={item.label} aria-current="page">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
