import type { AlmaLocale } from '@/lib/i18n/locale';
import type { VadTriple } from '@/lib/huella/vad-color';
import esLex from '@/lib/huella/lexicon/es.json';
import ptLex from '@/lib/huella/lexicon/pt.json';
import enLex from '@/lib/huella/lexicon/en.json';

export const ALMAMUNDI_LEXICON_VERSION = '1.0.0';

type LexiconFile = {
  version: string;
  lang: string;
  dims: string[];
  n: number;
  e: Record<string, [number, number, number]>;
};

const FILES: Record<AlmaLocale, LexiconFile> = {
  es: esLex as unknown as LexiconFile,
  pt: ptLex as unknown as LexiconFile,
  en: enLex as unknown as LexiconFile,
};

export function foldLemma(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/ñ/g, '\u0000')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0000/g, 'ñ')
    .replace(/ç/g, 'c')
    .replace(/[^a-zñ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const INDEX: Record<AlmaLocale, Map<string, VadTriple>> = {
  es: new Map(),
  pt: new Map(),
  en: new Map(),
};

function ensureIndex(lang: AlmaLocale): Map<string, VadTriple> {
  const map = INDEX[lang];
  if (map.size > 0) return map;
  for (const [lemma, triple] of Object.entries(FILES[lang].e)) {
    const [v, a, d] = triple;
    map.set(lemma, { v, a, d });
  }
  return map;
}

const LOCALE_ORDER: Record<AlmaLocale, AlmaLocale[]> = {
  es: ['es', 'pt', 'en'],
  pt: ['pt', 'es', 'en'],
  en: ['en', 'es', 'pt'],
};

export function lookupLemma(token: string, locale: AlmaLocale): (VadTriple & { lemma: string; lang: AlmaLocale }) | null {
  const folded = foldLemma(token);
  if (!folded) return null;
  for (const lang of LOCALE_ORDER[locale]) {
    const hit = ensureIndex(lang).get(folded);
    if (hit) return { ...hit, lemma: folded, lang };
  }
  return null;
}

const STOP = new Set([
  'de', 'la', 'el', 'en', 'y', 'a', 'que', 'los', 'las', 'un', 'una', 'con', 'por', 'del', 'al',
  'su', 'se', 'le', 'lo', 'me', 'te', 'nos', 'les', 'mi', 'tu', 'mis', 'tus', 'sus',
  'es', 'son', 'era', 'fue', 'ser', 'si', 'no', 'ya', 'muy', 'mas', 'pero', 'como',
  'este', 'esta', 'esto', 'estos', 'estas', 'para', 'todo', 'toda', 'hay', 'han',
  'sin', 'cuando', 'donde', 'cada', 'desde', 'hasta', 'sobre', 'entre', 'o', 'e', 'u',
  'the', 'of', 'to', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'with', 'from',
  'o', 'os', 'as', 'um', 'uma', 'do', 'da', 'em', 'no', 'na',
]);

export type LexiconHit = VadTriple & { lemma: string; lang: AlmaLocale; count: number };

export function hitsFromText(text: string, locale: AlmaLocale): LexiconHit[] {
  const folded = foldLemma(text);
  if (!folded) return [];
  const tokens = folded.split(' ').filter((w) => w.length > 1 && !STOP.has(w));
  const order: string[] = [];
  const counts = new Map<string, LexiconHit>();
  for (const token of tokens) {
    const found = lookupLemma(token, locale);
    if (!found) continue;
    const prev = counts.get(found.lemma);
    if (prev) {
      prev.count += 1;
      continue;
    }
    const row: LexiconHit = { ...found, count: 1 };
    counts.set(found.lemma, row);
    order.push(found.lemma);
  }
  return order.map((lemma) => counts.get(lemma)!);
}
