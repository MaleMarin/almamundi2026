'use client';

import type { ReactNode } from 'react';
import { MAP_HOME_NEU_BUTTON_CLASS, MAP_HOME_NEU_BUTTON_STYLE } from '@/lib/map-home-neu-button';

export type PillNavButtonProps = {
  children: ReactNode;
  /** Estado activo (dock): solo color/borde vía `.btn-almamundi[data-active]` */
  active?: boolean;
  /** Etiqueta larga en una sola línea: tipografía más compacta (misma caja que el resto). */
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
  active,
  longSingleLine,
  title,
  href,
  onClick,
  onAfterClick,
  type = 'button',
}: PillNavButtonProps) {
  const inner =
    longSingleLine === true ? (
      <span className="pill-nav-long-line block min-w-0 max-w-full">{children}</span>
    ) : (
      children
    );

  const tip = title ?? (typeof children === 'string' ? children : undefined);

  if (href != null && href !== '') {
    return (
      <a
        href={href}
        className={MAP_HOME_NEU_BUTTON_CLASS}
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
      className={MAP_HOME_NEU_BUTTON_CLASS}
      style={MAP_HOME_NEU_BUTTON_STYLE}
      data-active={active ? 'true' : undefined}
      title={tip}
    >
      {inner}
    </button>
  );
}
