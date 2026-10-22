import { foldLemma, hitsFromText } from '@/lib/huella/almamundi-lexicon';
import type { AlmaLocale } from '@/lib/i18n/locale';
import {
  armonizar,
  colorDeEmocion,
  colorDePalabra,
  coloresDeHistoria,
  contrastan,
  CREMA,
  esAcentoIntenso,
  esIntenso,
  esSuave,
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
  momento: number;
};

export type SilencioMarca = { inicio: number; fin: number; segundos: number };

export type PlanCintas = {
  modo: Modo;
  bandas: Banda[];
  ancho: number;
};

type Kind = 'hilo' | 'fina' | 'campo' | 'pausa';

type Pieza = {
  kind: Kind;
  cream: boolean;
  hex: string;
  motivo: string;
  momento: number;
  width: number;
  min: number;
  max: number;
};

const HILO: [number, number] = [Math.round(ANCHO * 0.003), Math.round(ANCHO * 0.01)];
const FINA: [number, number] = [Math.round(ANCHO * 0.01) + 1, Math.round(ANCHO * 0.03)];
const CAMPO: [number, number] = [Math.round(ANCHO * 0.12), Math.round(ANCHO * 0.4)];
const FINO_INTENSA = Math.round(ANCHO * 0.6);
const MIN_SUAVE = Math.round(ANCHO * 0.6);
const TOPE_ACENTO = Math.round(ANCHO * 0.2);
const TOPE_CREMA = Math.round(ANCHO * 0.15);
const TOPE_CREMA_CALMA = Math.round(ANCHO * 0.25);

function topeCrema(modo: Modo): number {
  return modo === 'calma' ? TOPE_CREMA_CALMA : TOPE_CREMA;
}

let paletaActiva: string[] = [];

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
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

function entre(rng: () => number, lo: number, hi: number): number {
  if (hi <= lo) return lo;
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function pieza(params: {
  kind: Kind;
  cream: boolean;
  hex: string;
  motivo: string;
  momento: number;
  width: number;
  min: number;
  max: number;
}): Pieza {
  const min = Math.max(1, params.min);
  const max = Math.max(min, params.max);
  return {
    ...params,
    hex: params.hex.toUpperCase(),
    min,
    max,
    width: Math.max(min, Math.min(max, params.width)),
  };
}

function colorLibre(preferido: string, prohibidos: string[], rng: () => number): string {
  const fuente = paletaActiva.length > 0 ? paletaActiva : [];
  const malo = new Set(prohibidos.map((h) => h.toUpperCase()).filter(Boolean));
  const sirve = (tono: string, estricto: boolean) => {
    if (!tono || malo.has(tono) || tono === CREMA || tono === '#000000') return false;
    if (!estricto) return true;
    return prohibidos.every((p) => !p || contrastan(tono, p));
  };
  const pref = preferido.toUpperCase();
  if (fuente.includes(pref) && sirve(pref, true)) return pref;
  const start = fuente.length > 0 ? Math.floor(rng() * fuente.length) : 0;
  for (let i = 0; i < fuente.length; i++) {
    const tono = fuente[(start + i) % fuente.length]!;
    if (sirve(tono, true)) return tono;
  }
  for (const tono of fuente) {
    if (sirve(tono, false)) return tono;
  }
  return fuente[0] ?? '#FF4F5A';
}

function momentosDe(analisis: Analisis): Analisis['momentos'] {
  if (analisis.momentos.length > 0) return analisis.momentos.slice(0, 8);
  const emocion = analisis.emociones[0]?.emocion ?? 'calma';
  return [{ resumen: emocion, emocion, intensidad: 0.4 }];
}

function cuantosCampos(modo: Modo, emociones: number, rng: () => number): number {
  if (modo === 'calma') return rng() < 0.5 ? 0 : 1;
  if (modo === 'poco') return emociones >= 2 && rng() < 0.5 ? 2 : 1;
  if (modo === 'triste') return emociones >= 2 ? 2 : 1;
  return rng() < 0.5 ? 1 : 2;
}

function elegirSlots(id: string, nClusters: number, nCampos: number): number[] {
  const total = nClusters + 1;
  const rng = rngDeId(`${id}:campos`);
  const pool = Array.from({ length: total }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, Math.min(nCampos, total)).sort((a, b) => a - b);
}

function lineasPorMomento(modo: Modo, n: number, rng: () => number): number[] {
  const counts = Array.from({ length: n }, () => 4 + Math.floor(rng() * 5));
  if (modo !== 'intensa') return counts;
  const objetivo = Math.ceil(FINO_INTENSA / 24);
  let total = counts.reduce((s, c) => s + c, 0);
  let guard = 0;
  while (total < objetivo && counts.some((c) => c < 8) && guard < 80) {
    const i = guard % n;
    if (counts[i]! < 8) {
      counts[i] = counts[i]! + 1;
      total += 1;
    }
    guard += 1;
  }
  return counts;
}

function anchosDeSilencio(silencios: SilencioMarca[], duracion: number): number[] {
  if (silencios.length === 0 || duracion <= 0) return [];
  return silencios.map((s) => Math.max(HILO[0], Math.round(clamp01(s.segundos / duracion) * ANCHO)));
}

function escalarSilencios(anchos: number[], otrosMin: number): number[] {
  const suma = anchos.reduce((s, n) => s + n, 0);
  if (suma + otrosMin <= ANCHO) return anchos;
  const presupuesto = Math.max(anchos.length * HILO[0], ANCHO - otrosMin);
  if (suma <= 0) return anchos;
  const factor = presupuesto / suma;
  let usado = 0;
  return anchos.map((n, i) => {
    if (i === anchos.length - 1) return Math.max(HILO[0], presupuesto - usado);
    const w = Math.max(HILO[0], Math.round(n * factor));
    usado += w;
    return w;
  });
}

function colorEmocion(emocion: Emocion, analisis: Analisis, rango: number, modo: Modo): string {
  if (modo === 'calma' && rango % 5 !== 0) {
    const suave: Emocion = rango % 2 === 0 ? 'calma' : 'esperanza';
    return colorDeEmocion(suave, analisis.animo, 0.5, rango);
  }
  const fila = analisis.emociones.find((e) => e.emocion === emocion);
  return colorDeEmocion(emocion, analisis.animo, fila?.peso ?? 0.4, rango);
}

function construir(params: {
  id: string;
  analisis: Analisis;
  modo: Modo;
  silencios: SilencioMarca[];
  duracion: number;
}): Pieza[] {
  const rng = rngDeId(params.id);
  const momentos = momentosDe(params.analisis);
  const emos = [...params.analisis.emociones].sort((a, b) => b.peso - a.peso);
  const claves = [...params.analisis.palabrasClave].sort((a, b) => b.peso - a.peso);
  const principal = emos[0]?.emocion ?? momentos[0]?.emocion ?? 'calma';
  const nCampos = cuantosCampos(params.modo, emos.length, rng);
  const cuentas = lineasPorMomento(params.modo, momentos.length, rng);
  const slots = elegirSlots(params.id, momentos.length, nCampos);

  const gruposSilencio: SilencioMarca[][] = momentos.map(() => []);
  for (const silencio of params.silencios) {
    const frac = params.duracion > 0 ? silencio.inicio / params.duracion : 0;
    const idx = Math.min(momentos.length - 1, Math.max(0, Math.floor(clamp01(frac) * momentos.length)));
    gruposSilencio[idx]!.push(silencio);
  }
  const anchosCrudos = anchosDeSilencio(params.silencios, params.duracion);
  const porSilencio = new Map<SilencioMarca, number>();
  params.silencios.forEach((s, i) => porSilencio.set(s, anchosCrudos[i] ?? HILO[0]));

  const minLineas = cuentas.reduce((s, n) => s + n, 0) * (params.modo === 'intensa' ? FINA[0] : HILO[0]);
  const minCampos = nCampos * (params.modo === 'triste' ? 200 : CAMPO[0]);
  const huecosPausa =
    params.modo === 'calma' || params.modo === 'poco' ? momentos.length + 1 : Math.max(0, momentos.length - 1);
  const minPausas = huecosPausa * (params.modo === 'calma' ? 12 : HILO[0]);
  const sumaSilencio = anchosCrudos.reduce((s, n) => s + n, 0);
  const reservaCrema =
    params.modo === 'calma' ? Math.max(minPausas, Math.min(TOPE_CREMA_CALMA, Math.max(0, TOPE_CREMA_CALMA - sumaSilencio))) : minPausas;
  const reservaFino = params.modo === 'intensa' ? Math.max(minLineas, FINO_INTENSA) : minLineas;
  const anchosSilencio = escalarSilencios(
    params.silencios.map((s) => porSilencio.get(s) ?? HILO[0]),
    reservaFino + minCampos + reservaCrema
  );
  params.silencios.forEach((s, i) => porSilencio.set(s, anchosSilencio[i] ?? HILO[0]));

  let claveI = 0;
  let previo = '';
  const tomarHex = (preferido: string) => {
    const hex = colorLibre(preferido, previo ? [previo] : [], rng);
    previo = hex;
    return hex;
  };

  const clusters: Pieza[][] = momentos.map((momento, i) => {
    const n = cuentas[i] ?? 4;
    const lineas: Pieza[] = [];
    for (let k = 0; k < n; k++) {
      const hilo = params.modo === 'intensa' ? k === 0 : k % 3 === 0;
      const kind: Kind = hilo ? 'hilo' : 'fina';
      const [lo, hi] = kind === 'hilo' ? HILO : FINA;
      const usarClave = k % 2 === 1 && claves.length > 0;
      const clave = usarClave ? claves[claveI++ % claves.length] : undefined;
      const preferidoBruto = clave
        ? colorDePalabra(clave.palabra, params.analisis.animo.valencia, params.analisis.animo.activacion, clave.peso)
        : colorEmocion(momento.emocion, params.analisis, k + 1, params.modo);
      const preferido =
        params.modo === 'calma' && esAcentoIntenso(preferidoBruto) && k % 5 !== 0
          ? colorEmocion('calma', params.analisis, k + 1, 'intensa')
          : preferidoBruto;
      const anchoInicial = params.modo === 'intensa' && kind === 'fina' ? Math.min(hi, 24) : entre(rng, lo, Math.min(hi, lo + 8));
      lineas.push(
        pieza({
          kind,
          cream: false,
          hex: tomarHex(preferido),
          motivo: clave?.palabra ?? momento.emocion,
          momento: i,
          width: anchoInicial,
          min: lo,
          max: hi,
        })
      );
    }

    const sils = gruposSilencio[i] ?? [];
    if (sils.length === 0) return lineas;
    while (lineas.length - 1 < sils.length && lineas.length < 8) {
      const [lo, hi] = FINA;
      lineas.push(
        pieza({
          kind: 'fina',
          cream: false,
          hex: tomarHex(colorEmocion(momento.emocion, params.analisis, lineas.length, params.modo)),
          motivo: momento.emocion,
          momento: i,
          width: lo,
          min: lo,
          max: hi,
        })
      );
    }
    const gaps = Math.max(1, lineas.length - 1);
    const porGap: Pieza[][] = Array.from({ length: gaps }, () => []);
    sils.forEach((s, k) => {
      const gap = Math.min(gaps - 1, Math.floor(((k + 0.5) * gaps) / sils.length));
      const w = porSilencio.get(s) ?? HILO[0];
      porGap[gap]!.push(
        pieza({
          kind: 'pausa',
          cream: true,
          hex: CREMA,
          motivo: 'silencio',
          momento: i,
          width: w,
          min: w,
          max: w,
        })
      );
    });
    const out: Pieza[] = [];
    for (let k = 0; k < lineas.length; k++) {
      out.push(lineas[k]!);
      const grupo = porGap[k] ?? [];
      grupo.forEach((s, sIdx) => {
        if (sIdx > 0) {
          out.push(
            pieza({
              kind: 'hilo',
              cream: false,
              hex: tomarHex(colorEmocion(principal, params.analisis, k + sIdx, params.modo)),
              motivo: 'separador',
              momento: -1,
              width: HILO[0],
              min: HILO[0],
              max: HILO[1],
            })
          );
        }
        out.push(s);
      });
    }
    return out;
  });

  const pausaDe = (motivo: string): Pieza => {
    if (params.modo === 'calma') {
      return pieza({
        kind: 'pausa',
        cream: true,
        hex: CREMA,
        motivo,
        momento: -1,
        width: entre(rng, 28, 72),
        min: 12,
        max: topeCrema(params.modo),
      });
    }
    if (params.modo === 'poco') {
      return pieza({
        kind: 'pausa',
        cream: true,
        hex: CREMA,
        motivo,
        momento: -1,
        width: entre(rng, 16, 48),
        min: HILO[0],
        max: Math.min(480, topeCrema(params.modo)),
      });
    }
    const [lo, hi] = params.modo === 'intensa' ? HILO : [HILO[0], FINA[1]];
    return pieza({
      kind: 'pausa',
      cream: true,
      hex: CREMA,
      motivo,
      momento: -1,
      width: entre(rng, lo, Math.min(hi, lo + 6)),
      min: lo,
      max: hi,
    });
  };

  const usadosCampo: string[] = [];
  const anchosCampo: number[] = [];
  for (let i = 0; i < nCampos; i++) {
    if (params.modo === 'triste') anchosCampo.push(i === 0 ? entre(rng, 270, 390) : entre(rng, CAMPO[0], 210));
    else if (params.modo === 'poco') anchosCampo.push(entre(rng, 180, 340));
    else if (params.modo === 'calma') anchosCampo.push(entre(rng, CAMPO[0], 170));
    else anchosCampo.push(entre(rng, CAMPO[0], 160));
  }
  if (anchosCampo.length === 2 && rng() < 0.5) {
    const tmp = anchosCampo[0]!;
    anchosCampo[0] = anchosCampo[1]!;
    anchosCampo[1] = tmp;
  }
  const campos = slots.map((slot, i) => {
    const emocion = emos[i]?.emocion ?? principal;
    const clave = claves[i];
    const preferidoBruto =
      i > 0 && clave
        ? colorDePalabra(clave.palabra, params.analisis.animo.valencia, params.analisis.animo.activacion, clave.peso)
        : colorEmocion(emocion, params.analisis, i, params.modo);
    const preferido =
      params.modo === 'calma' && esAcentoIntenso(preferidoBruto) ? colorEmocion('calma', params.analisis, i, 'intensa') : preferidoBruto;
    const hex = colorLibre(preferido, usadosCampo, rng);
    usadosCampo.push(hex);
    const width = Math.max(CAMPO[0], Math.min(CAMPO[1], anchosCampo[i] ?? CAMPO[0]));
    return {
      slot,
      pieza: pieza({
        kind: 'campo',
        cream: false,
        hex,
        motivo: emocion,
        momento: -1,
        width,
        min: params.modo === 'triste' && width >= 270 ? 270 : CAMPO[0],
        max: Math.max(CAMPO[0], Math.min(CAMPO[1], params.modo === 'intensa' ? 180 : params.modo === 'calma' ? 200 : CAMPO[1])),
      }),
    };
  });

  const secuencia: Pieza[] = [];
  const conBordes = params.modo === 'calma' || params.modo === 'poco';
  for (let i = 0; i <= momentos.length; i++) {
    for (const campo of campos) {
      if (campo.slot === i) secuencia.push(campo.pieza);
    }
    if (i === 0 && conBordes) secuencia.push(pausaDe('pausa'));
    if (i < momentos.length) {
      const previoHex = secuencia[secuencia.length - 1]?.hex ?? '';
      for (const linea of clusters[i] ?? []) {
        if (!linea.cream && linea.hex === previoHex) {
          linea.hex = colorLibre(linea.hex, [previoHex], rng);
        }
        secuencia.push(linea);
      }
      if (i < momentos.length - 1) secuencia.push(pausaDe('pausa'));
      if (i === momentos.length - 1 && conBordes) secuencia.push(pausaDe('pausa'));
    }
  }
  return secuencia;
}

function suma(piezas: Pieza[]): number {
  return piezas.reduce((s, p) => s + p.width, 0);
}

function sumaSi(piezas: Pieza[], pred: (p: Pieza) => boolean): number {
  return piezas.filter(pred).reduce((s, p) => s + p.width, 0);
}

function crecer(piezas: Pieza[], pred: (p: Pieza) => boolean, cuanto: number): number {
  let left = cuanto;
  let guard = 0;
  while (left > 0 && guard < 20000) {
    const room = piezas
      .map((p, i) => ({ i, room: pred(p) ? p.max - p.width : 0 }))
      .filter((x) => x.room > 0);
    if (room.length === 0) break;
    const paso = room[guard % room.length]!;
    piezas[paso.i]!.width += 1;
    left -= 1;
    guard += 1;
  }
  return left;
}

function encoger(piezas: Pieza[], pred: (p: Pieza) => boolean, cuanto: number): number {
  let left = cuanto;
  let guard = 0;
  while (left > 0 && guard < 20000) {
    const slack = piezas
      .map((p, i) => ({ i, slack: pred(p) ? p.width - p.min : 0 }))
      .filter((x) => x.slack > 0)
      .sort((a, b) => b.slack - a.slack || a.i - b.i);
    if (slack.length === 0) break;
    const paso = slack[0]!;
    piezas[paso.i]!.width -= 1;
    left -= 1;
    guard += 1;
  }
  return left;
}

function ampliarTecho(piezas: Pieza[]): void {
  const techo = () => piezas.reduce((s, p) => s + (p.cream ? Math.min(p.max, p.width) : p.max), 0);
  if (techo() >= ANCHO) return;
  let guard = 0;
  while (techo() < ANCHO && guard < 40) {
    const hueco = piezas.findIndex((p, i) => !p.cream && piezas[i + 1] && !piezas[i + 1]!.cream);
    const linea = pieza({
      kind: 'fina',
      cream: false,
      hex: colorLibre('#FF4F5A', [piezas[Math.max(0, hueco)]?.hex ?? ''], () => (guard % 7) / 7),
      motivo: 'relleno',
      momento: -1,
      width: FINA[0],
      min: FINA[0],
      max: FINA[1],
    });
    if (hueco >= 0) piezas.splice(hueco + 1, 0, linea);
    else piezas.push(linea);
    guard += 1;
  }
}

function recortarCrema(piezas: Pieza[], tope: number): void {
  const cremas = [
    ...piezas.filter((p) => p.cream && p.motivo !== 'silencio'),
    ...piezas.filter((p) => p.cream && p.motivo === 'silencio'),
  ];
  let total = cremas.reduce((s, p) => s + p.width, 0);
  for (const p of cremas) {
    if (total <= tope) break;
    const quitar = Math.min(p.width - 1, total - tope);
    if (quitar > 0) {
      p.width -= quitar;
      p.min = Math.min(p.min, p.width);
      total -= quitar;
    }
  }
}

function cuadrar(piezas: Pieza[], modo: Modo): Pieza[] {
  const out = piezas.map((p) => ({ ...p, width: Math.max(p.min, Math.min(p.max, p.width)) }));
  const tope = topeCrema(modo);
  recortarCrema(out, tope);
  ampliarTecho(out);
  if (modo === 'intensa') {
    const fino = sumaSi(out, (p) => !p.cream && (p.kind === 'hilo' || p.kind === 'fina'));
    if (fino < FINO_INTENSA) crecer(out, (p) => !p.cream && (p.kind === 'hilo' || p.kind === 'fina'), FINO_INTENSA - fino);
  }

  let guard = 0;
  while (suma(out) !== ANCHO && guard < 8) {
    const delta = ANCHO - suma(out);
    if (delta > 0) {
      let left = crecer(out, (p) => !p.cream && (p.kind === 'hilo' || p.kind === 'fina'), delta);
      if (left > 0) left = crecer(out, (p) => p.kind === 'campo', left);
      if (left > 0) {
        ampliarTecho(out);
        left = crecer(out, (p) => !p.cream && (p.kind === 'hilo' || p.kind === 'fina'), left);
      }
      if (left > 0) crecer(out, (p) => p.cream && sumaSi(out, (x) => x.cream) < tope, left);
    } else {
      let left = -delta;
      const protegeFino = (p: Pieza) =>
        modo === 'intensa' && !p.cream && (p.kind === 'hilo' || p.kind === 'fina')
          ? sumaSi(out, (x) => !x.cream && (x.kind === 'hilo' || x.kind === 'fina')) - 1 >= FINO_INTENSA
          : true;
      left = encoger(out, (p) => p.cream && p.motivo !== 'silencio', left);
      if (left > 0) left = encoger(out, (p) => p.kind === 'campo', left);
      if (left > 0) left = encoger(out, (p) => !p.cream && (p.kind === 'hilo' || p.kind === 'fina') && protegeFino(p), left);
      if (left > 0) encoger(out, (p) => p.motivo === 'silencio', left);
    }
    if (suma(out) === ANCHO) break;
    guard += 1;
    if (suma(out) !== ANCHO && guard >= 2 && Math.abs(ANCHO - suma(out)) === Math.abs(delta)) break;
  }
  recortarCrema(out, tope);
  if (suma(out) < ANCHO) {
    crecer(out, (p) => !p.cream, ANCHO - suma(out));
  }
  if (suma(out) !== ANCHO) {
    throw new Error(`No pude cuadrar las cintas a ${ANCHO}px (quedó en ${suma(out)}).`);
  }
  return out;
}

function meterMezclas(colores: string[]): void {
  for (const hex of colores.map((color) => armonizar(color).toUpperCase())) {
    if (paletaActiva.includes(hex)) continue;
    if (paletaActiva.length < 11) {
      paletaActiva.push(hex);
      continue;
    }
    const idx = paletaActiva.findIndex((tono) => !esSuave(tono));
    if (idx >= 0) paletaActiva[idx] = hex;
  }
}

function aplicarColoresDeImagen(piezas: Pieza[], colores: string[], modo: Modo): void {
  if (colores.length === 0) return;
  const mezclas = colores.map((hex) => armonizar(hex).toUpperCase());
  const unicos = () => new Set(piezas.map((p) => p.hex));
  const hacerLugar = (hex: string) => {
    if (unicos().has(hex)) return;
    const sacrificable = () =>
      [...unicos()].find((tono) => {
        if (tono === CREMA || tono === hex) return false;
        if (esSuave(tono) && esIntenso(tono)) return false;
        if (!esSuave(tono)) return true;
        return [...unicos()].filter((c) => esSuave(c)).length > 4;
      });
    if (unicos().size >= 12) {
      const quitar = sacrificable();
      if (!quitar) return;
      for (const piezaActual of piezas) {
        if (piezaActual.hex === quitar) piezaActual.hex = hex;
      }
      return;
    }
    const destino =
      piezas.find((p) => !p.cream && !esSuave(p.hex)) ??
      piezas.find((p) => !p.cream && !(esSuave(p.hex) && esIntenso(p.hex)));
    if (!destino) return;
    destino.hex = hex;
    destino.motivo = 'color-imagen';
  };
  for (const hex of mezclas) hacerLugar(hex);
  let k = 0;
  for (const piezaActual of piezas) {
    if (piezaActual.cream) continue;
    const esCampo = piezaActual.kind === 'campo';
    const toca = esCampo || k % 2 === 0;
    k += 1;
    if (!toca) continue;
    const mezcla = mezclas[(k - 1) % mezclas.length]!;
    if (modo === 'calma' && piezaActual.kind === 'campo' && !esSuave(mezcla)) continue;
    const i = piezas.indexOf(piezaActual);
    const prev = piezas[i - 1]?.hex ?? '';
    const next = piezas[i + 1]?.hex ?? '';
    if ((prev && !contrastan(mezcla, prev)) || (next && !contrastan(mezcla, next))) continue;
    if (!unicos().has(mezcla) && unicos().size >= 12) continue;
    if (modo === 'calma' && esSuave(piezaActual.hex) && !esSuave(mezcla)) {
      const suave = piezas.filter((p) => esSuave(p.hex)).reduce((s, p) => s + p.width, 0);
      if (suave - piezaActual.width < MIN_SUAVE) continue;
    }
    piezaActual.hex = mezcla;
    piezaActual.motivo = 'color-imagen';
  }
}

function separarColores(piezas: Pieza[], rng: () => number, modo: Modo): Pieza[] {
  const out = piezas.map((p) => ({ ...p }));
  for (let i = 0; i < out.length - 1; ) {
    if (out[i]!.cream && out[i + 1]!.cream) {
      const a = out[i]!;
      const b = out[i + 1]!;
      a.width += b.width;
      a.max = Math.max(a.max, a.width);
      if (b.motivo === 'silencio') a.motivo = 'silencio';
      out.splice(i + 1, 1);
      continue;
    }
    i += 1;
  }
  for (let i = 1; i < out.length; i++) {
    const prev = out[i - 1]!;
    const cur = out[i]!;
    if (cur.cream && prev.cream) continue;
    const chocan = cur.hex === prev.hex || !contrastan(cur.hex, prev.hex);
    if (!chocan) continue;
    const objetivo = cur.cream ? prev : cur;
    if (objetivo.cream) continue;
    const otrosCampos = out.filter((p) => p.kind === 'campo' && p !== objetivo).map((p) => p.hex);
    const vecino = objetivo === cur ? prev.hex : cur.hex;
    const siguiente = out[i + 1]?.hex ?? '';
    objetivo.hex = colorLibre(modo === 'calma' ? '#7DD3FC' : '#FF4F5A', [vecino, siguiente, ...otrosCampos], rng);
  }
  return out;
}

function asegurarVariedad(piezas: Pieza[]): void {
  const usados = () => new Set(piezas.filter((p) => !p.cream).map((p) => p.hex));
  let i = 0;
  for (const color of paletaActiva) {
    if (usados().has(color)) continue;
    while (i < piezas.length) {
      const prev = piezas[i - 1]?.hex ?? '';
      const next = piezas[i + 1]?.hex ?? '';
      const actual = piezas[i]!;
      i += 1;
      if (actual.cream) continue;
      if ((!prev || contrastan(color, prev)) && (!next || contrastan(color, next))) {
        actual.hex = color;
        break;
      }
    }
  }
}

function romperRepeticion(piezas: Pieza[], modo: Modo): void {
  const anchos = () => piezas.map((p) => p.width);
  const repetida = (widths: number[]) => {
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
  };
  let guard = 0;
  while (repetida(anchos()) && guard < 12) {
    const a = piezas[guard % piezas.length];
    const b = piezas[(guard + Math.floor(piezas.length / 2)) % piezas.length];
    if (!a || !b || a === b) break;
    const fino = () => sumaSi(piezas, (p) => !p.cream && (p.kind === 'hilo' || p.kind === 'fina'));
    const crema = () => sumaSi(piezas, (p) => p.cream);
    const puede =
      a.width > a.min &&
      b.width < b.max &&
      (modo !== 'intensa' || a.cream || a.kind === 'campo' || fino() - 1 >= FINO_INTENSA) &&
      !(b.cream && !a.cream && crema() + 1 > topeCrema(modo));
    if (!puede) {
      guard += 1;
      continue;
    }
    a.width -= 1;
    b.width += 1;
    guard += 1;
  }
}

function equilibrarCalma(piezas: Pieza[], rng: () => number): void {
  const ancho = (pred: (p: Pieza) => boolean) => piezas.reduce((s, p) => s + (pred(p) ? p.width : 0), 0);
  const preferido = paletaActiva.find((hex) => esSuave(hex) && esIntenso(hex)) ?? '#7DD3FC';
  const recolor = (p: Pieza) => {
    const i = piezas.indexOf(p);
    const prev = piezas[i - 1]?.hex ?? '';
    const next = piezas[i + 1]?.hex ?? '';
    const antes = p.hex;
    p.hex = colorLibre(preferido, [prev, next], rng);
    return p.hex !== antes && esSuave(p.hex);
  };
  const candidatos = () =>
    piezas
      .filter((p) => !p.cream && !esSuave(p.hex))
      .sort((a, b) => Number(a.motivo === 'color-imagen') - Number(b.motivo === 'color-imagen') || b.width - a.width);

  let guard = 0;
  while (ancho((p) => !p.cream && esAcentoIntenso(p.hex)) > TOPE_ACENTO && guard < 60) {
    const p = candidatos().find((item) => esAcentoIntenso(item.hex));
    if (!p || !recolor(p)) break;
    guard += 1;
  }
  guard = 0;
  while (ancho((p) => esSuave(p.hex)) < MIN_SUAVE && guard < 80) {
    const p = candidatos()[0];
    if (!p || !recolor(p)) break;
    guard += 1;
  }
}

function fijarMezclas(piezas: Pieza[], colores: string[], modo: Modo): void {
  if (colores.length === 0) return;
  const ancho = (pred: (p: Pieza) => boolean) => piezas.reduce((s, p) => s + (pred(p) ? p.width : 0), 0);
  for (const hex of colores.map((color) => armonizar(color).toUpperCase())) {
    if (piezas.some((p) => p.hex === hex)) continue;
    const candidatos = piezas.filter((p) => {
      if (p.cream || p.motivo === 'color-imagen' || p.kind === 'campo') return false;
      if (esSuave(p.hex) && esIntenso(p.hex)) return false;
      if (modo === 'calma' && esAcentoIntenso(hex) && !esAcentoIntenso(p.hex)) return false;
      if (modo === 'calma' && esSuave(p.hex) && !esSuave(hex) && ancho((x) => esSuave(x.hex)) - p.width < MIN_SUAVE) return false;
      return true;
    });
    const destino = candidatos.find((p) => {
      const i = piezas.indexOf(p);
      const prev = piezas[i - 1]?.hex ?? '';
      const next = piezas[i + 1]?.hex ?? '';
      return (!prev || contrastan(hex, prev)) && (!next || contrastan(hex, next));
    });
    if (!destino) continue;
    destino.hex = hex;
    destino.motivo = 'color-imagen';
  }
}

function limitarColores(piezas: Pieza[]): void {
  let guard = 0;
  while (new Set(piezas.map((p) => p.hex)).size > 12 && guard < 40) {
    const pesos = new Map<string, number>();
    for (const p of piezas) pesos.set(p.hex, (pesos.get(p.hex) ?? 0) + p.width);
    const quitar = [...pesos.entries()]
      .filter(([hex]) => {
        if (hex === CREMA || (esSuave(hex) && esIntenso(hex))) return false;
        if (piezas.some((p) => p.hex === hex && p.motivo === 'color-imagen')) return false;
        if (esSuave(hex)) return [...pesos.keys()].some((otro) => otro !== hex && esSuave(otro));
        return true;
      })
      .sort((a, b) => Number(esSuave(a[0])) - Number(esSuave(b[0])) || a[1] - b[1])[0]?.[0];
    if (!quitar) break;
    let cambio = false;
    for (const piezaActual of piezas) {
      if (piezaActual.hex !== quitar) continue;
      const i = piezas.indexOf(piezaActual);
      const prev = piezas[i - 1]?.hex ?? '';
      const next = piezas[i + 1]?.hex ?? '';
      const destino = [...pesos.keys()].find(
        (hex) =>
          hex !== quitar &&
          hex !== prev &&
          hex !== next &&
          (!esSuave(quitar) || esSuave(hex)) &&
          (!prev || contrastan(hex, prev)) &&
          (!next || contrastan(hex, next))
      );
      if (!destino) continue;
      piezaActual.hex = destino;
      cambio = true;
    }
    if (!cambio) break;
    guard += 1;
  }
}

export function revisarPlan(plan: PlanCintas): string[] {
  const errores: string[] = [];
  const total = plan.bandas.reduce((s, b) => s + b.ancho, 0);
  if (total !== ANCHO) errores.push(`ancho ${total}`);
  const campos = plan.bandas.filter((b) => b.clase === 'campo');
  if (campos.length > 2) errores.push(`${campos.length} campos`);
  if (new Set(campos.map((c) => c.hex)).size !== campos.length) errores.push('campos del mismo color');
  for (const campo of campos) {
    if (campo.ancho < CAMPO[0] || campo.ancho > CAMPO[1]) errores.push(`campo de ${campo.ancho}px`);
  }
  for (let i = 1; i < plan.bandas.length; i++) {
    if (plan.bandas[i]!.hex === plan.bandas[i - 1]!.hex) errores.push(`color repetido en la franja ${i}`);
  }
  const momentos = new Set(plan.bandas.filter((b) => b.momento >= 0 && (b.clase === 'hilo' || b.clase === 'fina')).map((b) => b.momento));
  for (const momento of momentos) {
    const n = plan.bandas.filter((b) => b.momento === momento && (b.clase === 'hilo' || b.clase === 'fina')).length;
    if (n < 4 || n > 8) errores.push(`el momento ${momento} tiene ${n} líneas`);
  }
  const fino = plan.bandas.filter((b) => b.clase === 'hilo' || b.clase === 'fina').reduce((s, b) => s + b.ancho, 0);
  const crema = plan.bandas.filter((b) => b.clase === 'pausa').reduce((s, b) => s + b.ancho, 0);
  if (plan.modo === 'intensa' && fino < FINO_INTENSA) errores.push(`líneas finas ${fino}px`);
  if (crema > topeCrema(plan.modo)) errores.push(`crema ${crema}px`);
  const colores = new Set(plan.bandas.map((b) => b.hex));
  if (colores.size < 7 || colores.size > 12) errores.push(`${colores.size} colores`);
  const intensos = plan.bandas.filter((b) => esIntenso(b.hex));
  if (new Set(intensos.map((b) => b.hex)).size < 3) errores.push('faltan colores intensos');
  for (let i = 1; i < plan.bandas.length; i++) {
    if (!contrastan(plan.bandas[i]!.hex, plan.bandas[i - 1]!.hex)) errores.push(`poco contraste en la franja ${i}`);
  }
  if (plan.bandas.some((b) => b.hex === '#000000')) errores.push('negro');
  if (plan.modo === 'calma') {
    const suave = plan.bandas.filter((b) => esSuave(b.hex)).reduce((s, b) => s + b.ancho, 0);
    const acento = plan.bandas.filter((b) => esAcentoIntenso(b.hex)).reduce((s, b) => s + b.ancho, 0);
    if (suave < MIN_SUAVE) errores.push(`familia suave ${suave}px`);
    if (acento > TOPE_ACENTO) errores.push(`acentos intensos ${acento}px`);
  }
  return errores;
}

export function componerCintas(params: {
  id: string;
  analisis: Analisis;
  texto: string;
  locale: AlmaLocale;
  silencios?: SilencioMarca[];
  duracionSegundos?: number;
  coloresImagen?: string[];
}): PlanCintas {
  const poco = esPocoContenido(params.texto, params.locale);
  const modo = modoDe(params.analisis, poco);
  paletaActiva = coloresDeHistoria(
    params.analisis.emociones.map((e) => e.emocion),
    rngDeId(`${params.id}:paleta`),
    modo
  );
  meterMezclas(params.coloresImagen ?? []);
  const piezas = construir({
    id: params.id,
    analisis: params.analisis,
    modo,
    silencios: params.silencios ?? [],
    duracion: params.duracionSegundos ?? 0,
  });
  const cuadradas = cuadrar(piezas, modo);
  const rng = rngDeId(`${params.id}:color`);
  const separadas = separarColores(cuadradas, rng, modo);
  romperRepeticion(separadas, modo);
  asegurarVariedad(separadas);
  if (modo === 'calma') equilibrarCalma(separadas, rng);
  aplicarColoresDeImagen(separadas, params.coloresImagen ?? [], modo);
  if (modo === 'calma') equilibrarCalma(separadas, rng);
  limitarColores(separadas);
  fijarMezclas(separadas, params.coloresImagen ?? [], modo);
  limitarColores(separadas);
  if (modo === 'calma') equilibrarCalma(separadas, rng);
  let x = 0;
  const bandas: Banda[] = separadas.map((p) => {
    const banda: Banda = {
      x,
      ancho: p.width,
      hex: p.hex.toUpperCase(),
      clase: p.cream ? 'pausa' : p.kind,
      motivo: p.motivo,
      momento: p.momento,
    };
    x += p.width;
    return banda;
  });
  const plan = { modo, bandas, ancho: ANCHO };
  const errores = revisarPlan(plan);
  if (errores.length > 0) {
    throw new Error(`La composición de ${params.id} no cumple: ${errores.join('; ')}`);
  }
  return plan;
}
