/**
 * Color del punto de una historia en el globo, a partir del texto (VAD).
 * Si no hay texto suficiente o no hay coincidencias en el léxico, el globo
 * sigue usando el naranja de historias (material compartido).
 */

import type { AlmaLocale } from "@/lib/i18n/locale";
import { hitsFromText } from "@/lib/huella/almamundi-lexicon";
import { hslCss, storyCenterHue, vadToHsl } from "@/lib/huella/vad-color";

/** Mismo umbral que `analyzeStory` (texto demasiado corto para analizar). */
export const STORY_GLOBE_COLOR_MIN_CHARS = 10;

export function pickStoryGlobeColorSeed(args: {
  antecedentes?: string;
  context?: string;
  textBody?: string;
  body?: string;
  transcription?: string;
}): string {
  const candidates = [
    args.antecedentes,
    args.context,
    args.textBody,
    args.body,
    args.transcription,
  ];
  for (const raw of candidates) {
    const t = typeof raw === "string" ? raw.trim() : "";
    if (t.length >= STORY_GLOBE_COLOR_MIN_CHARS) return t;
  }
  return "";
}

export function storyGlobeMarkerColor(args: {
  antecedentes?: string;
  context?: string;
  textBody?: string;
  body?: string;
  transcription?: string;
  locale: AlmaLocale;
}): string | undefined {
  const text = pickStoryGlobeColorSeed(args);
  if (!text) return undefined;
  const hits = hitsFromText(text, args.locale);
  if (hits.length === 0) return undefined;

  let weight = 0;
  let vSum = 0;
  let aSum = 0;
  let dSum = 0;
  for (const hit of hits) {
    const w = Math.max(1, hit.count);
    vSum += hit.v * w;
    aSum += hit.a * w;
    dSum += hit.d * w;
    weight += w;
  }
  const vMean = vSum / weight;
  const aMean = aSum / weight;
  const dMean = dSum / weight;
  const center = storyCenterHue(vMean, aMean);
  const hsl = vadToHsl(0.5, aMean, dMean, aMean, center);
  return hslCss(hsl.h, hsl.s, hsl.l);
}
