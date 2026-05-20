'use client';

import type { ReactNode } from 'react';
import {
  MAP_HOME_NEU_BUTTON_CLASS,
  MAP_HOME_NEU_BUTTON_CLASS_COMPACT,
  MAP_HOME_NEU_BUTTON_CLASS_COMPACT_INLINE,
  MAP_HOME_NEU_BUTTON_STYLE,
} from '@/lib/map-home-neu-button';

export type PillNavButtonProps = {
  children: ReactNode;
  /** Home header: píldora un poco más pequeña (`MAP_HOME_NEU_BUTTON_CLASS_COMPACT`). */
  compact?: boolean;
  /**
   * Solo con `compact`: ancho al texto (`inline-flex` + `w-auto`), p. ej. fila flex del header `/historias/*`.
   * La home usa grid con celdas 1fr; allí no activar esto.
   */
  compactInline?: boolean;
  /** Estado activo (dock): solo color/borde vía `.btn-almamundi[data-active]` */
  active?: boolean;
  /** Etiqueta larga en una sola línea: misma tipografía; solo ellipsis si no cabe. */
  longSingleLine?: boolean;
  /** Tooltip / accesibilidad cuando el texto puede quedar recortado visualmente */
  title?: string;
  /** Si existe, se renderiza `<a>`; si no, `<button>`. */
  href?: string;
  onClick?: () => void;
  /** Tras la acción nativa (p. ej. cerrar menú móvil del header). */
  onAfterClick?: () => void;
  type?: 'button' | 'submit';
};

/**
 * Única píldora del header y del dock bajo «Mapa de AlmaMundi».
 * Sin `className` ni `style` externos: paridad estricta (solo `longSingleLine` para el copy largo).
 */
export function PillNavButton({
  children,
  compact,
  compactInline,
  active,
  longSingleLine,
  title,
  href,
  onClick,
  onAfterClick,
  type = 'button',
}: PillNavButtonProps) {
  const pillClass =
    compact === true
      ? compactInline === true
        ? MAP_HOME_NEU_BUTTON_CLASS_COMPACT_INLINE
        : MAP_HOME_NEU_BUTTON_CLASS_COMPACT
      : MAP_HOME_NEU_BUTTON_CLASS;
  const inner =
    compact === true ? (
      children
    ) : (
      <span
        className={[
          'pill-nav-dock-label',
          longSingleLine === true ? 'pill-nav-dock-label--clip min-w-0 max-w-full' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </span>
    );

  const tip = title ?? (typeof children === 'string' ? children : undefined);

  if (href != null && href !== '') {
    return (
      <a
        href={href}
        className={pillClass}
        style={MAP_HOME_NEU_BUTTON_STYLE}
        data-active={active ? 'true' : undefined}
        title={tip}
        onClick={() => onAfterClick?.()}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={() => {
        onClick?.();
        onAfterClick?.();
      }}
      className={pillClass}
      style={MAP_HOME_NEU_BUTTON_STYLE}
      data-active={active ? 'true' : undefined}
      title={tip}
    >
      {inner}
    </button>
  );
}
