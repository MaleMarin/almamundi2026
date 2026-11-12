import { cortinaSitioCss } from '@/lib/cortina-sitio';

const CORTINA = cortinaSitioCss();

/**
 * Franja de cintas que cierra el pie: los mismos colores de la tarjeta que aparece
 * al compartir el sitio. Banda recta, de lado a lado, pegada al borde inferior.
 */
export function FooterCortina() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-6 md:h-8"
      style={{
        backgroundImage: CORTINA.backgroundImage,
        backgroundSize: `${CORTINA.periodo}px 100%`,
        backgroundRepeat: 'repeat-x',
      }}
    />
  );
}
