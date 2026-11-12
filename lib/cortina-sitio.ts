/**
 * Cortina de cintas del sitio: la misma secuencia de colores y anchos que usa la
 * tarjeta para compartir AlmaMundi (app/og/sitio) y la franja que cierra el pie.
 * Una sola fuente para que ambas se vean idénticas.
 */
export const CORTINA_SITIO_COLORES = [
  '#FFD000',
  '#FF6200',
  '#FF1A1A',
  '#FF7EB6',
  '#A8E000',
  '#00B140',
  '#0047FF',
  '#7A12E0',
  '#B07CFF',
  '#FF0A8A',
  '#00C2D6',
  '#A0003C',
] as const;

export type CintaCortina = { color: string; w: number };

/** Cintas necesarias para cubrir `ancho` px; la última queda entera (puede pasarse del ancho). */
export function cintasCortinaSitio(ancho: number): CintaCortina[] {
  const cintas: CintaCortina[] = [];
  let x = 0;
  let i = 0;
  while (x < ancho) {
    const w = 14 + ((i * 37) % 23);
    cintas.push({ color: CORTINA_SITIO_COLORES[(i * 7) % CORTINA_SITIO_COLORES.length]!, w });
    x += w;
    i += 1;
  }
  return cintas;
}

/**
 * La cortina como fondo CSS repetible en horizontal: cortes duros, sin degradados.
 * `periodo` es el ancho en px de una repetición completa.
 */
export function cortinaSitioCss(anchoMinimo = 1200): { backgroundImage: string; periodo: number } {
  const cintas = cintasCortinaSitio(anchoMinimo);
  // Evita que el final de una repetición y el inicio de la siguiente compartan color.
  while (cintas.length > 1 && cintas[cintas.length - 1]!.color === cintas[0]!.color) cintas.pop();
  const paradas: string[] = [];
  let x = 0;
  for (const c of cintas) {
    paradas.push(`${c.color} ${x}px ${x + c.w}px`);
    x += c.w;
  }
  return { backgroundImage: `linear-gradient(90deg, ${paradas.join(', ')})`, periodo: x };
}
