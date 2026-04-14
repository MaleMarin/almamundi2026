/**
 * Interacción magnética bits + giro terrestre (GlobeV2 / GlobeBitsLayer).
 * Todos los valores son ajustables desde aquí.
 */

/** Estado compartido (refs) entre GlobeScene y GlobeBitsLayer para el giro terrestre. */
export type GlobeBitInteractionStore = {
  pointerOnCanvas: boolean;
  /** Bit elegido por hover magnético (pantalla + histéresis); null si ninguno. */
  magneticHoverId: number | null;
  /**
   * Distancia normalizada del puntero al centro del canvas del globo (0 = centro del lienzo,
   * ~1.4 ≈ esquina). Sirve para ralentizar el giro cuando el ratón se acerca al disco.
   */
  pointerGlobeCenterDist: number;
};

/** Radio en píxeles (canvas): candidatos a hover si el proy. del bit cae dentro. */
export const PICK_RADIUS_PX = 24;

/** Histéresis: evita saltos entre bits; suelta más tarde; cambio solo si el nuevo es claramente más cercano. */
export const HOVER_HYSTERESIS_PX = 10;

/** Multiplicador de avance del reloj de escena (1 = ritmo normal según earthVisualTimeScale). */
export const AUTO_ROTATE_IDLE_SPEED = 1;

/** Puntero en canvas, sin bit magnético: ~20 % del giro. */
export const AUTO_ROTATE_POINTER_SPEED = 0.2;

/**
 * Con el puntero cerca del centro del canvas (encima del globo): giro más lento que en el borde.
 * Se interpola linealmente hasta `AUTO_ROTATE_POINTER_SPEED` según `pointerGlobeCenterDist`.
 */
export const AUTO_ROTATE_NEAR_GLOBE_CENTER_SPEED = 0.07;

/**
 * A esta distancia normalizada desde el centro (véase `pointerGlobeCenterDist`) ya se usa
 * toda la franja hasta `AUTO_ROTATE_POINTER_SPEED` (comportamiento “borde del lienzo”).
 */
export const AUTO_ROTATE_PROXIMITY_BLEND_DIST = 1.02;

/** Bit magnético activo: pausa total del giro terrestre. */
export const AUTO_ROTATE_HOVER_SPEED = 0;

/** Panel UI (p. ej. drawer bits abierto): pausa total. */
export const AUTO_ROTATE_PANEL_SPEED = 0;

/** Escala visual extra del destello cuando el bit es candidato magnético (no el picking). */
export const ACTIVE_BIT_SCALE = 1.09;

/** Radio de la esfera invisible de picking (unidades de escena Three.js), independiente del dibujo. */
export const PICKING_SPHERE_RADIUS = 0.048;

/** Suavizado del multiplicador de giro hacia el objetivo (mayor = transición más rápida). */
export const MAGNETIC_SPIN_RATE_SMOOTH = 5;

/** Máximo arrastre en px para contar un “clic” frente a rotación de cámara. */
export const CLICK_MAX_DRAG_PX = 10;

/**
 * Mínimo dot(normal tierra→bit, dir bit→cámara) para considerar el bit en cara visible.
 * >0 excluye traseros; un poco >0 recorta el limbo.
 */
export const FRONT_HEMISPHERE_MIN_DOT = 0.02;
