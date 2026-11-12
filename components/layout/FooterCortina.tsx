import { cortinaSitioCss } from '@/lib/cortina-sitio';

const CORTINA = cortinaSitioCss();

/**
 * Franja de cintas que cierra el pie: los mismos colores de la tarjeta que aparece
 * al compartir el sitio. El pie termina en esquinas redondeadas y la cortina asoma debajo.
 */
export function FooterCortina() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-11 md:h-14"
      style={{
        backgroundImage: CORTINA.backgroundImage,
        backgroundSize: `${CORTINA.periodo}px 100%`,
        backgroundRepeat: 'repeat-x',
      }}
    >
      <div className="h-5 rounded-b-[20px] bg-[var(--home-bg)] md:h-6 md:rounded-b-[24px]" />
    </div>
  );
}
