/**
 * Guía de la Perfección Visual: de los datos a la geometría.
 *
 * Constraint: visualización contenida en un círculo perfecto y nítido. Múltiples capas superpuestas (profundidad).
 * Geometría de precisión: bordes duros (hard-edged), sin desenfoque.
 *
 * Lógica de codificación:
 * - Paleta base → Tono emocional (nostalgia = fría: violetas/teals; acentos alineados a naranja marca donde aplica).
 * - Nivel de superposición → Complejidad narrativa (más capas + transparencia = nuevos colores donde se tocan).
 * - Capa por modo → Modo de historia (audio = tinte teal/verde; video = magenta/cyan; etc.).
 * - Core → Puntos narrativos clave (píxeles densos en el centro).
 * - Fragmentación → Subtramas y detalles (píxeles más grandes en los bordes, dentro del círculo).
 */

import type { StoryAnalysis, HuellaVisualParams, VisualBlock } from "./types";

function seeded(seed: number, i: number): number {
  const h = Math.imul(seed, i + 1) >>> 0;
  return (h / 0xffffffff) * 2 - 1;
}

function seedFromAnalysis(a: StoryAnalysis): number {
  let h = 2166136261;
  for (const t of a.themes) for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  for (const e of a.emotions) for (let i = 0; i < e.length; i++) h = Math.imul(h ^ e.charCodeAt(i), 16777619);
  return (h >>> 0) || 1;
}

/** Paleta fría: nostálgico/profundo (image_12/15). Base cerulean/violeta; core cyan/magenta/naranja denso; fragmentación verde/amarillo. */
const COLD = {
  base: [
    "rgba(30, 95, 116, 0.48)",   // deep cerulean
    "rgba(88, 28, 135, 0.45)",   // violet
    "rgba(185, 47, 0, 0.42)",    // deep orange (marca)
    "rgba(20, 94, 97, 0.44)",    // teal
  ],
  core: [
    "rgba(255, 120, 60, 0.68)",  // naranja vivo
    "rgba(219, 39, 119, 0.70)",  // magenta
    "rgba(234, 88, 12, 0.66)",   // deep orange
    "rgba(88, 28, 135, 0.70)",   // deep purple
  ],
  frag: [
    "rgba(34, 197, 94, 0.72)",   // vivid green
    "rgba(250, 204, 21, 0.70)",  // yellow
  ],
};

/** Paleta cálida: energético, complejo (image_12 style). Base rojo/naranja, core magenta/amarillo denso, fragmentación verde/azul/teal. */
const WARM = {
  base: [
    "rgba(185, 28, 28, 0.44)",   // deep red
    "rgba(234, 88, 12, 0.46)",   // orange
    "rgba(194, 65, 12, 0.42)",   // deep orange
    "rgba(239, 68, 68, 0.40)",   // red
  ],
  core: [
    "rgba(219, 39, 119, 0.74)",  // magenta
    "rgba(250, 204, 21, 0.72)",  // yellow
    "rgba(244, 114, 182, 0.70)", // pink
  ],
  frag: [
    "rgba(34, 197, 94, 0.72)",   // green
    "rgba(255, 107, 53, 0.68)",  // naranja medio
    "rgba(20, 184, 166, 0.70)",  // teal
  ],
};

/** Selección de paleta según tono (0 = fría, 1 = cálida). */
function getPalette(tone: number) {
  return tone >= 0.5 ? WARM : COLD;
}

/** BASE: bloques grandes, bordes limpios, translúcidos. Complejidad (depth) afecta cantidad y tamaño. */
function buildBase(analysis: StoryAnalysis): VisualBlock[] {
  const seed = seedFromAnalysis(analysis);
  const palette = getPalette(analysis.tone);
  const radius = 0.5;
  const depthScale = 0.4 + analysis.depth * 0.5;
  const n = Math.min(8, Math.max(4, Math.floor(4 + analysis.themes.length + analysis.depth * 2)));
  const blocks: VisualBlock[] = [];
  for (let i = 0; i < n; i++) {
    const r = radius * (0.32 + (Math.abs(seeded(seed, i * 11)) * 0.5 + 0.08));
    const th = (seeded(seed, i * 7) * 2 + i * 0.7) * Math.PI;
    const x = 0.5 + Math.cos(th) * r;
    const y = 0.5 + Math.sin(th) * r;
    const scale = (0.12 + (1 - analysis.depth) * 0.08) * depthScale;
    const w = scale * (0.85 + Math.abs(seeded(seed, i * 13)) * 0.5);
    const h = scale * (0.55 + Math.abs(seeded(seed, i * 17)) * 0.4);
    blocks.push({
      x: x - w / 2,
      y: y - h / 2,
      w,
      h,
      color: palette.base[i % palette.base.length]!,
      rot: seeded(seed, i * 19) * 0.22,
    });
  }
  return blocks;
}

/**
 * CORE: densidad y superposición según ritmo.
 * Ritmo bajo (lento): bloques más grandes, poca superposición, baja densidad.
 * Ritmo alto (rápido): bloques muy pequeños (píxeles), muy densos, alta superposición.
 */
function buildCore(analysis: StoryAnalysis): VisualBlock[] {
  const seed = seedFromAnalysis(analysis);
  const palette = getPalette(analysis.tone);
  const rhythm = analysis.rhythm;
  const depth = analysis.depth;
  const blocks: VisualBlock[] = [];
  const n = Math.floor(12 + rhythm * 28 + depth * 12);
  const rMax = rhythm < 0.5
    ? 0.12 + 0.36 * (1 - rhythm * 0.8)
    : 0.06 + 0.22 * (1 - rhythm);
  const sizeMin = rhythm < 0.5 ? 0.045 : 0.012;
  const sizeMax = rhythm < 0.5 ? 0.11 : 0.035;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const r = Math.sqrt(Math.abs(seeded(seed, i * 23)) * 0.5 + 0.5) * rMax;
    const th = (seeded(seed, i * 29) * 0.5 + 0.5) * Math.PI * 2;
    const x = 0.5 + Math.cos(th) * r;
    const y = 0.5 + Math.sin(th) * r;
    const sizeScale = 1 - r / (rMax * 0.9);
    const w = sizeMin + sizeScale * (sizeMax - sizeMin) + Math.abs(seeded(seed, i * 31)) * (sizeMax - sizeMin) * 0.5;
    const h = sizeMin * 0.7 + sizeScale * (sizeMax - sizeMin) * 0.8 + Math.abs(seeded(seed, i * 37)) * (sizeMax - sizeMin) * 0.4;
    blocks.push({
      x: x - w / 2,
      y: y - h / 2,
      w,
      h,
      color: palette.core[Math.floor((Math.abs(seeded(seed, i * 41)) * 0.5 + 0.5) * palette.core.length) % palette.core.length]!,
      rot: seeded(seed, i * 43) * 0.35,
    });
  }
  return blocks;
}

/**
 * FRAGMENTACIÓN: pequeños bloques en la periferia. Complejidad (depth) afecta cantidad y dispersión.
 * Fría: naranja/verde en racimos controlados en el borde exterior.
 * Cálida: verde/azul/teal en racimos densos en toda la periferia.
 */
function buildFragmentation(analysis: StoryAnalysis): VisualBlock[] {
  const seed = seedFromAnalysis(analysis);
  const palette = getPalette(analysis.tone);
  const depth = analysis.depth;
  const n = Math.floor(18 + depth * 36 + analysis.rhythm * 12);
  const blocks: VisualBlock[] = [];
  const rMin = analysis.tone >= 0.5 ? 0.38 : 0.44;
  const rSpan = analysis.tone >= 0.5 ? 0.5 : 0.4;
  for (let i = 0; i < n; i++) {
    const r = 0.5 * (rMin + (Math.abs(seeded(seed, i * 47)) * 0.5 + 0.1) * rSpan);
    const th = (seeded(seed, i * 53) * 0.5 + 0.5) * Math.PI * 2;
    const x = 0.5 + Math.cos(th) * r;
    const y = 0.5 + Math.sin(th) * r;
    const w = 0.015 + Math.abs(seeded(seed, i * 59)) * 0.045;
    const h = 0.01 + Math.abs(seeded(seed, i * 61)) * 0.035;
    blocks.push({
      x: x - w / 2,
      y: y - h / 2,
      w,
      h,
      color: palette.frag[i % palette.frag.length]!,
      rot: seeded(seed, i * 67) * 0.5,
    });
  }
  return blocks;
}

/** Capa por modo: tinte translúcido que diferencia el tipo de historia (audio = más verde/teal, etc.). */
function getModeOverlay(format: string): string | undefined {
  switch (format) {
    case "audio":
      return "rgba(20, 184, 166, 0.14)";   // teal/green cast
    case "video":
      return "rgba(219, 39, 119, 0.08)";    // magenta/cyan hint
    case "image":
      return "rgba(234, 179, 8, 0.06)";    // warm tint
    case "text":
      return "rgba(30, 95, 116, 0.06)";    // soft cerulean
    default:
      return undefined;
  }
}

/** Convierte análisis + formato en parámetros visuales (incluye capa por modo). */
export function analysisToVisualParams(analysis: StoryAnalysis, format?: string): HuellaVisualParams {
  const out: HuellaVisualParams = {
    base: buildBase(analysis),
    core: buildCore(analysis),
    fragmentation: buildFragmentation(analysis),
  };
  if (format) out.modeOverlay = getModeOverlay(format);
  return out;
}
