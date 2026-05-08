/**
 * Tipos para el flujo: análisis semántico/emocional (GPT) → parámetros visuales de la huella.
 * Coordenadas normalizadas en círculo unidad (centro 0.5, 0.5; radio 0.5).
 */

/** Formato editorial para anclar la paleta de cintas (huella v2). */
export type HuellaV2Format = 'video' | 'audio' | 'texto' | 'foto';

/** Bloque geométrico: posición y tamaño normalizados (0–1), color rgba, rotación en radianes. */
export interface VisualBlock {
  x: number; // centro, 0–1
  y: number;
  w: number; // ancho/alto normalizados
  h: number;
  color: string; // "rgba(r,g,b,a)"
  rot: number;
}

/** Parámetros visuales de la huella: base, core, fragmentación y capa por modo. */
export interface HuellaVisualParams {
  base: VisualBlock[];
  core: VisualBlock[];
  fragmentation: VisualBlock[];
  /** Capa específica por modo: tinte translúcido sobre toda la composición (ej. audio = teal/verde). rgba. */
  modeOverlay?: string;
}

/** JSON que devuelve GPT para análisis semántico/emocional. */
export interface StoryAnalysis {
  themes: string[];
  emotions: string[];
  /** 0–1: intensidad emocional o dramática. */
  intensity: number;
  /** 0–1: ritmo (0=lento/pausado, 1=rápido/frenético). Controla densidad y fragmentación del core. */
  rhythm: number;
  /** 0–1: profundidad/complejidad narrativa o volumen. Controla capas y superposición. */
  depth: number;
  /** 0–1: tono de voz/emoción (0=grave/calma → paleta fría, 1=agudo/energía → paleta cálida). */
  tone: number;
}

/**
 * Parámetros serializables de la huella v2 (cintas de memoria).
 * Pensado para persistir junto a la historia sin reanalizar el texto.
 */
export interface HuellaV2VisualParams {
  version: 1;
  seed: number;
  format: HuellaV2Format;
  /** HSL css, hasta 5 colores principales. */
  palette: string[];
  /** Palabras que influyeron en la elección de matices (interpretación visual). */
  wordHints: string[];
  ribbonCount: number;
  anguloBase: number;
  charCount: number;
  submitHour: number;
}
