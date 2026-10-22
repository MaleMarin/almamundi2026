import { foldLemma, hitsFromText } from '@/lib/huella/almamundi-lexicon';
import type { AlmaLocale } from '@/lib/i18n/locale';
import {
  armonizar,
  colorDeEmocion,
  colorDePalabra,
  CREMA,
  type Emocion,
} from '@/lib/cintas-v2/palette';
import { rngDeId } from '@/lib/cintas-v2/seed';
import type { Analisis } from '@/lib/cintas-v2/understand/schema';

export const ANCHO = 1080;

export type Modo = 'intensa' | 'triste' | 'calma' | 'poco';
export type Clase = 'hilo' | 'fina' | 'mediana' | 'campo' | 'pausa';

export type Banda = {
  x: number;
  ancho: number;
  hex: string;
  clase: Clase;
  motivo: string;
};

export type SilencioVoz = { momento: number; segundos: number };

export type PlanCintas = {
  modo: Modo;
  bandas: Banda[];
  ancho: number;
};

type Draft = {
  kind: 'hilo' | 'fina' | 'mediana' | 'campo';
  cream: boolean;
  hex: string;
  motivo: string;
  momento: number;
  width: number;
};

const RANGO: Record<Draft['kind'], [number, number]> = {
  hilo: [Math.round(ANCHO * 0.003), Math.round(ANCHO * 0.01)],
  fina: [Math.round(ANCHO * 0.01) + 1, Math.round(ANCHO * 0.03)],
  mediana: [Math.round(ANCHO * 0.04), Math.round(ANCHO * 0.08)],
  campo: [Math.round(ANCHO * 0.12), Math.round(ANCHO * 0.4)],
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function anchoEn(kind: Draft['kind'], t: number): number {
  const [lo, hi] = RANGO[kind];
  return lo + Math.floor(clamp01(t) * (hi - lo + 1) * 0.999);
}

function suma(bands: Draft[]): number {
  return bands.reduce((s, b) => s + b.width, 0);
}

function tokensDe(texto: string): string[] {
  return foldLemma(texto)
    .split(' ')
    .filter((w) => w.length > 1);
}

export function esPocoContenido(texto: string, locale: AlmaLocale): boolean {
  const palabras = texto.trim().split(/\s+/).filter(Boolean).length;
  if (palabras < 30) return true;
  const tokens = tokensDe(texto);
  if (tokens.length < 8) return true;
  const hits = hitsFromText(texto, locale);
  const conocidos = hits.reduce((s, h) => s + h.count, 0);
  return conocidos / tokens.length < 0.12;
}

export function modoDe(analisis: Analisis, poco: boolean): Modo {
  if (poco) return 'poco';
  const { valencia, activacion } = analisis.animo;
  if (activacion >= 0.62) return 'intensa';
  if (activacion <= 0.4 && valencia >= 0.45) return 'calma';
  if (valencia < 0.48) return 'triste';
  if (activacion < 0.5) return 'calma';
  return 'intensa';
}

function ordenarEmociones(analisis: Analisis) {
  return [...analisis.emociones].sort((a, b) => b.peso - a.peso);
}

function ordenarClaves(analisis: Analisis) {
  return [...analisis.palabrasClave].sort((a, b) => b.peso - a.peso);
}

function colorEmocion(emocion: Emocion, analisis: Analisis, rango: number, peso?: number): string {
  const fila = analisis.emociones.find((e) => e.emocion === emocion);
  return colorDeEmocion(emocion, analisis.animo, peso ?? fila?.peso ?? 0.4, rango);
}

function pausa(rng: () => number, momento: number, segundos = 0): Draft {
  const fina = segundos >= 2 || rng() > 0.45;
  const kind = fina ? 'fina' : 'hilo';
  return {
    kind,
    cream: true,
    hex: CREMA,
    motivo: segundos > 0 ? 'silencio' : 'pausa',
    momento,
    width: anchoEn(kind, rng()),
  };
}

function franja(
  kind: Draft['kind'],
  hex: string,
  motivo: string,
  momento: number,
  rng: () => number,
  t?: number
): Draft {
  return { kind, cream: false, hex, motivo, momento, width: anchoEn(kind, t ?? rng()) };
}

function planificar(analisis: Analisis, modo: Modo, rng: () => number, silencios: SilencioVoz[]): Draft[] {
  const emos = ordenarEmociones(analisis);
  const claves = ordenarClaves(analisis);
  const momentos = analisis.momentos.length > 0 ? analisis.momentos.slice(0, 6) : [];
  const principal = emos[0]?.emocion ?? momentos[0]?.emocion ?? 'calma';
  const bands: Draft[] = [];
  let claveI = 0;
  const siguienteClave = () => {
    const c = claves[claveI % Math.max(1, claves.length)];
    claveI += 1;
    return c;
  };

  if (modo === 'poco') {
    bands.push(pausa(rng, 0));
    bands.push(franja('campo', colorEmocion(principal, analisis, 0), principal, 0, rng, 0.35 + rng() * 0.4));
    const c0 = siguienteClave();
    if (c0) {
      bands.push(
        franja(
          'hilo',
          colorDePalabra(c0.palabra, analisis.animo.valencia, analisis.animo.activacion, c0.peso),
          c0.palabra,
          0,
          rng
        )
      );
    }
    bands.push(pausa(rng, 0));
    const segunda = emos[1]?.emocion ?? momentos[0]?.emocion ?? principal;
    const hexSegunda = colorEmocion(segunda, analisis, 1);
    const hexOtra =
      hexSegunda === bands.find((b) => b.kind === 'campo')?.hex
        ? colorDePalabra(`${segunda}-campo`, analisis.animo.valencia, analisis.animo.activacion, 0.4)
        : hexSegunda;
    bands.push(franja('campo', hexOtra, segunda, 0, rng, 0.22 + rng() * 0.35));
    bands.push(franja('hilo', colorEmocion(principal, analisis, 2, 0.3), `${principal}-acento`, 0, rng));
    bands.push(pausa(rng, 0));
    bands.push(franja('fina', colorEmocion(segunda, analisis, 3, 0.25), `${segunda}-fino`, 0, rng));
    bands.push(franja('hilo', colorEmocion(principal, analisis, 4, 0.2), `${principal}-hilo`, 0, rng));
  } else if (modo === 'triste') {
    bands.push(franja('campo', colorEmocion(principal, analisis, 0), principal, 0, rng, 0.62 + rng() * 0.3));
    bands.push(pausa(rng, 0));
    const n = 5 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      const momento = momentos[Math.min(momentos.length - 1, i % Math.max(1, momentos.length))];
      const em = momento?.emocion ?? emos[i % emos.length]?.emocion ?? principal;
      const kind = i % 2 === 0 ? 'hilo' : 'fina';
      bands.push(franja(kind, colorEmocion(em, analisis, i + 1), em, momento ? momentos.indexOf(momento) : 0, rng));
    }
    bands.push(pausa(rng, 0));
    const segunda = emos[1];
    if (segunda && segunda.peso >= 0.22) {
      bands.push(franja('campo', colorEmocion(segunda.emocion, analisis, 1, segunda.peso), segunda.emocion, 1, rng, 0.28 + rng() * 0.35));
    } else {
      bands.push(franja('mediana', colorEmocion(principal, analisis, 1, 0.4), principal, 0, rng));
    }
  } else if (modo === 'calma') {
    const lista = momentos.length > 0 ? momentos.slice(0, 5) : [{ emocion: principal, intensidad: 0.3, resumen: principal }];
    let i = 0;
    while (suma(bands) < 1000 && i < 16) {
      const m = lista[i % lista.length]!;
      const momento = i % lista.length;
      bands.push(franja('hilo', colorEmocion(m.emocion, analisis, i + 1), m.emocion, momento, rng));
      const c = siguienteClave();
      if (c) {
        bands.push(
          franja(
            'fina',
            colorDePalabra(c.palabra, analisis.animo.valencia, analisis.animo.activacion, c.peso),
            c.palabra,
            momento,
            rng
          )
        );
      } else {
        bands.push(franja('hilo', colorEmocion(principal, analisis, i + 2, 0.3), principal, momento, rng));
      }
      if (i % 4 === 0) {
        bands.push(franja('mediana', colorEmocion(m.emocion, analisis, 0, 0.4), m.emocion, momento, rng, 0.15 + rng() * 0.25));
      }
      bands.push(pausa(rng, momento));
      i += 1;
    }
  } else {
    const lista = momentos.length > 0 ? momentos.slice(0, 6) : [{ emocion: principal, intensidad: 0.7, resumen: principal }];
    lista.forEach((m, i) => {
      const n = 3 + Math.floor(rng() * 3);
      for (let k = 0; k < n; k++) {
        const kind = rng() < 0.58 ? 'hilo' : 'fina';
        if (k % 2 === 0) {
          const em = emos[(i + k) % emos.length]?.emocion ?? m.emocion;
          bands.push(franja(kind, colorEmocion(em, analisis, k + 1), em, i, rng));
        } else {
          const c = siguienteClave();
          const hex = c
            ? colorDePalabra(c.palabra, analisis.animo.valencia, analisis.animo.activacion, c.peso)
            : colorEmocion(m.emocion, analisis, k, 0.3);
          bands.push(franja(kind, hex, c?.palabra ?? m.emocion, i, rng));
        }
      }
      const campos = bands.filter((b) => b.kind === 'campo').length;
      if ((m.intensidad >= 0.5 || i % 2 === 0) && campos < 3) {
        const campo = franja('campo', colorEmocion(m.emocion, analisis, 0), m.emocion, i, rng, 0.08 + m.intensidad * 0.2);
        campo.width = Math.min(campo.width, Math.round(ANCHO * 0.18));
        bands.push(campo);
      } else {
        bands.push(franja('mediana', colorEmocion(m.emocion, analisis, 1), m.emocion, i, rng));
      }
      if (i < lista.length - 1) bands.push(pausa(rng, i));
    });
    const topClave = claves[0];
    if (topClave && topClave.peso >= 0.55 && bands.filter((b) => b.kind === 'campo').length < 3) {
      bands.push(
        franja(
          'campo',
          colorDePalabra(topClave.palabra, analisis.animo.valencia, analisis.animo.activacion, topClave.peso),
          topClave.palabra,
          lista.length - 1,
          rng,
          0.15
        )
      );
    }
  }

  for (const silencio of silencios) {
    let idx = -1;
    for (let i = bands.length - 1; i >= 0; i--) {
      if (bands[i]?.momento === silencio.momento) {
        idx = i;
        break;
      }
    }
    const pausaSilencio = pausa(rng, silencio.momento, silencio.segundos);
    if (idx >= 0) bands.splice(idx + 1, 0, pausaSilencio);
    else bands.push(pausaSilencio);
  }

  const meta = modo === 'intensa' ? 980 : modo === 'triste' ? 900 : modo === 'calma' ? 1040 : 0;
  let extra = 0;
  while (suma(bands) < meta && bands.length < 48 && extra < 28) {
    const kind = modo === 'intensa' ? (rng() < 0.55 ? 'hilo' : 'fina') : 'fina';
    const em = emos[extra % emos.length]?.emocion ?? principal;
    const pieza = franja(kind, colorEmocion(em, analisis, extra + 2), em, extra % Math.max(1, momentos.length), rng);
    const idx = bands.length < 2 ? bands.length : 1 + Math.floor(rng() * (bands.length - 1));
    bands.splice(idx, 0, pieza);
    extra += 1;
  }

  if (analisis.animo.dominancia >= 0.68) {
    const fina = bands.find((b) => b.kind === 'fina' && !b.cream);
    if (fina) {
      fina.kind = 'mediana';
      fina.width = anchoEn('mediana', 0.35);
    }
  } else if (analisis.animo.dominancia <= 0.32) {
    const med = bands.find((b) => b.kind === 'mediana' && !b.cream);
    if (med) {
      med.kind = 'hilo';
      med.width = anchoEn('hilo', 0.7);
    }
  }

  return bands;
}

function techo(b: Draft, modo: Modo): number {
  const hi = RANGO[b.kind][1];
  if (b.cream) return hi;
  if (b.kind === 'campo' && modo === 'intensa') return Math.min(hi, Math.round(ANCHO * 0.2));
  if (b.kind === 'campo' && modo === 'poco') return hi;
  if (b.kind === 'mediana' && modo === 'calma') return Math.round((RANGO.mediana[0] + RANGO.mediana[1]) / 2);
  return hi;
}

function piso(b: Draft): number {
  return RANGO[b.kind][0];
}

function cremaNueva(width: number, motivo: string): Draft {
  const kind = width >= RANGO.fina[0] ? 'fina' : 'hilo';
  const [lo, hi] = RANGO[kind];
  return {
    kind,
    cream: true,
    hex: CREMA,
    motivo,
    momento: -1,
    width: Math.max(lo, Math.min(hi, width)),
  };
}

const ANCHOS_CREMA = [14, 22, 18, 27, 12, 31, 16, 24, 19, 28, 13, 21];

function estaTeselada(widths: number[]): boolean {
  if (widths.length < 4) return false;
  for (let p = 1; p <= Math.floor(widths.length / 2); p++) {
    if (widths.length % p !== 0) continue;
    let igual = true;
    for (let i = p; i < widths.length; i++) {
      if (widths[i] !== widths[i - p]) {
        igual = false;
        break;
      }
    }
    if (igual && widths.length / p >= 2) return true;
  }
  return false;
}

function separarCremas(out: Draft[]) {
  let guard = 0;
  while (guard < out.length) {
    let i = 0;
    for (; i < out.length - 1; i++) {
      if (out[i]!.cream && out[i + 1]!.cream) break;
    }
    if (i >= out.length - 1) return;
    let j = i + 2;
    while (j < out.length && out[j]!.cream) j += 1;
    if (j >= out.length) return;
    const crema = out[i + 1]!;
    out[i + 1] = out[j]!;
    out[j] = crema;
    guard += 1;
  }
}

function ajustar(bands: Draft[], modo: Modo): Draft[] {
  const out = bands.map((b) => ({ ...b }));
  let guard = 0;
  while (suma(out) !== ANCHO && guard < 5000) {
    const antes = suma(out);
    const falta = ANCHO - antes;
    if (falta > 0) {
      const crecer = out
        .map((b, i) => ({ b, i, room: techo(b, modo) - b.width }))
        .filter((x) => x.room > 0)
        .sort((a, b) => b.room - a.room);
      if (crecer.length > 0 && (modo !== 'calma' || crecer[0]!.b.cream || falta < 40)) {
        const g = crecer[0]!;
        g.b.width += Math.min(g.room, falta);
      } else if (falta < RANGO.hilo[0]) {
        out[out.length - 1]!.width += falta;
      } else {
        const ciclo = ANCHOS_CREMA[guard % ANCHOS_CREMA.length]!;
        const ancho = Math.min(falta, ciclo, RANGO.fina[1]);
        const pieza = cremaNueva(ancho, 'pausa');
        const huecos: number[] = [];
        for (let i = 0; i < out.length - 1; i++) {
          if (!out[i]!.cream && !out[i + 1]!.cream) huecos.push(i + 1);
        }
        if (huecos.length > 0) {
          out.splice(huecos[guard % huecos.length]!, 0, pieza);
        } else {
          const em = out.find((b) => !b.cream);
          out.push({
            kind: 'hilo',
            cream: false,
            hex: em?.hex ?? '#E7DDD0',
            motivo: em?.motivo ?? 'acento',
            momento: -1,
            width: RANGO.hilo[0],
          });
          out.push(pieza);
        }
      }
    } else {
      const sobra = -falta;
      const encoger = out
        .map((b, i) => ({ b, i, slack: b.width - piso(b) }))
        .filter((x) => x.slack > 0)
        .sort((a, b) => b.slack - a.slack);
      if (encoger.length === 0) {
        const idx = out.findIndex((b) => b.kind === 'hilo' && !b.cream);
        if (idx >= 0 && out.length > 4) out.splice(idx, 1);
        else throw new Error(`No pude ajustar las cintas (${suma(out)} px).`);
      } else {
        const sh = encoger[0]!;
        sh.b.width -= Math.min(sh.slack, sobra);
      }
    }
    if (suma(out) === antes) throw new Error('El ajuste de anchos se detuvo.');
    guard += 1;
  }
  if (suma(out) !== ANCHO) throw new Error(`Ancho final ${suma(out)}, se esperaba ${ANCHO}.`);
  separarCremas(out);

  let rompe = 0;
  while (estaTeselada(out.map((b) => b.width)) && rompe < 8) {
    const a = out[0];
    const b = out[Math.floor(out.length / 2)];
    if (!a || !b) break;
    if (a.width > piso(a) && b.width < techo(b, modo)) {
      a.width -= 1;
      b.width += 1;
    } else break;
    rompe += 1;
  }
  return out;
}

function aplicarColoresDeImagen(bands: Draft[], colores: string[]): void {
  if (colores.length === 0) return;
  const armonicos = colores.map((hex) => armonizar(hex));
  const campo = bands.find((b) => b.kind === 'campo' && !b.cream);
  let i = 0;
  for (const b of bands) {
    if (b.cream || b === campo) continue;
    if (b.kind === 'hilo' || b.kind === 'fina' || b.kind === 'mediana') {
      b.hex = armonicos[i % armonicos.length]!;
      b.motivo = 'color-imagen';
      i += 1;
    }
  }
}

export function componerCintas(params: {
  id: string;
  analisis: Analisis;
  texto: string;
  locale: AlmaLocale;
  silencios?: SilencioVoz[];
  coloresImagen?: string[];
}): PlanCintas {
  const poco = esPocoContenido(params.texto, params.locale);
  const modo = modoDe(params.analisis, poco);
  const rng = rngDeId(params.id);
  const plan = planificar(params.analisis, modo, rng, params.silencios ?? []);
  aplicarColoresDeImagen(plan, params.coloresImagen ?? []);
  const ajustadas = ajustar(plan, modo);
  let x = 0;
  const bandas: Banda[] = ajustadas.map((b) => {
    const banda: Banda = {
      x,
      ancho: b.width,
      hex: b.hex.toUpperCase(),
      clase: b.cream ? 'pausa' : b.kind,
      motivo: b.motivo,
    };
    x += b.width;
    return banda;
  });
  return { modo, bandas, ancho: ANCHO };
}
