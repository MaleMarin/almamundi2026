import { foldLemma, hitsFromText, type LexiconHit } from '@/lib/huella/almamundi-lexicon';
import type { AlmaLocale } from '@/lib/i18n/locale';
import type { Analisis, Idioma } from '@/lib/cintas-v2/understand/schema';
import type { Emocion } from '@/lib/cintas-v2/palette';

const LEMAS: Record<string, Emocion> = {
  amor: 'amor',
  amar: 'amor',
  alegria: 'alegría',
  alegre: 'alegría',
  risa: 'alegría',
  feliz: 'alegría',
  fiesta: 'alegría',
  triste: 'tristeza',
  tristeza: 'tristeza',
  lloro: 'tristeza',
  llanto: 'tristeza',
  dolor: 'tristeza',
  soledad: 'tristeza',
  miedo: 'miedo',
  rabia: 'rabia',
  calma: 'calma',
  paz: 'calma',
  esperanza: 'esperanza',
  nostalgia: 'nostalgia',
  recuerdo: 'nostalgia',
  memoria: 'nostalgia',
  orgullo: 'orgullo',
  gracias: 'gratitud',
  gratitud: 'gratitud',
  perdida: 'pérdida',
  muerte: 'pérdida',
  ausencia: 'pérdida',
  asombro: 'asombro',
  love: 'amor',
  joy: 'alegría',
  sad: 'tristeza',
  fear: 'miedo',
  calm: 'calma',
  hope: 'esperanza',
};

function emocionDeHit(hit: LexiconHit): Emocion {
  const directa = LEMAS[hit.lemma];
  if (directa) return directa;
  const { v, a } = hit;
  if (v >= 0.62 && a >= 0.55) return 'alegría';
  if (v >= 0.62 && a < 0.4) return 'calma';
  if (v >= 0.55 && a < 0.4) return 'nostalgia';
  if (v >= 0.55) return 'esperanza';
  if (v < 0.4 && a >= 0.62) return 'miedo';
  if (v < 0.4 && a >= 0.48) return 'rabia';
  if (v < 0.42) return 'tristeza';
  if (a < 0.35) return 'calma';
  return 'asombro';
}

function media(hits: LexiconHit[]): { valencia: number; activacion: number; dominancia: number } {
  let c = 0;
  let v = 0;
  let a = 0;
  let d = 0;
  for (const h of hits) {
    v += h.v * h.count;
    a += h.a * h.count;
    d += h.d * h.count;
    c += h.count;
  }
  if (c === 0) return { valencia: 0.5, activacion: 0.35, dominancia: 0.5 };
  return { valencia: v / c, activacion: a / c, dominancia: d / c };
}

function oraciones(texto: string): string[] {
  const partes = texto
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length >= 3);
  return partes.slice(0, 8);
}

function localeDe(idioma: Idioma, preferido: AlmaLocale): AlmaLocale {
  if (idioma === 'es' || idioma === 'pt' || idioma === 'en') return idioma;
  return preferido;
}

function mejorLocale(texto: string, preferido: AlmaLocale): { locale: AlmaLocale; hits: LexiconHit[] } {
  const orden: AlmaLocale[] = [preferido, 'es', 'pt', 'en'];
  const vistos = new Set<AlmaLocale>();
  let best = { locale: preferido, hits: [] as LexiconHit[] };
  for (const locale of orden) {
    if (vistos.has(locale)) continue;
    vistos.add(locale);
    const hits = hitsFromText(texto, locale);
    const n = hits.reduce((s, h) => s + h.count, 0);
    const bn = best.hits.reduce((s, h) => s + h.count, 0);
    if (n > bn) best = { locale, hits };
  }
  return best;
}

/** Respaldo con el diccionario actual. No entiende negación, metáfora ni ironía. */
export function analisisDesdeDiccionario(texto: string, preferido: AlmaLocale = 'es'): Analisis {
  const { locale, hits } = mejorLocale(texto, preferido);
  const idioma: Idioma = hits.length === 0 ? 'otro' : locale;

  if (hits.length === 0) {
    return {
      animo: { valencia: 0.5, activacion: 0.3, dominancia: 0.5 },
      emociones: [{ emocion: 'calma', peso: 0.2 }],
      momentos: [{ resumen: 'Sin palabras del diccionario', emocion: 'calma', intensidad: 0.15 }],
      palabrasClave: [{ palabra: 'silencio', peso: 0.2 }],
      idioma,
      avisos: { contenidoSensible: false, violencia: false, menores: false },
    };
  }

  const pesos = new Map<Emocion, number>();
  for (const hit of hits) {
    const em = emocionDeHit(hit);
    pesos.set(em, (pesos.get(em) ?? 0) + hit.count);
  }
  const maxP = Math.max(...pesos.values());
  const emociones = [...pesos.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([emocion, n]) => ({ emocion, peso: Math.max(0.15, Math.min(1, n / maxP)) }));

  const frases = oraciones(texto);
  const momentos =
    frases.length > 0
      ? frases.map((frase) => {
          const h = hitsFromText(frase, localeDe(idioma, preferido));
          const em = h.length ? emocionDeHit(h[0]!) : emociones[0]!.emocion;
          const intensidad = h.length ? media(h).activacion : media(hits).activacion;
          const resumen = frase.split(/\s+/).filter(Boolean).slice(0, 8).join(' ');
          return { resumen, emocion: em, intensidad: Math.max(0, Math.min(1, intensidad)) };
        })
      : [
          {
            resumen: foldLemma(texto).split(' ').filter(Boolean).slice(0, 8).join(' ') || 'Texto breve',
            emocion: emociones[0]!.emocion,
            intensidad: media(hits).activacion,
          },
        ];

  const maxC = Math.max(...hits.map((h) => h.count));
  const palabrasClave = [...hits]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((h) => ({ palabra: h.lemma, peso: Math.max(0.15, h.count / maxC) }));

  return {
    animo: media(hits),
    emociones,
    momentos: momentos.slice(0, 8),
    palabrasClave,
    idioma,
    avisos: { contenidoSensible: false, violencia: false, menores: false },
  };
}
