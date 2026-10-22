import { foldLemma, hitsFromText } from '@/lib/huella/almamundi-lexicon';
import type { AlmaLocale } from '@/lib/i18n/locale';
import {
  aclarar,
  ajustarTinta,
  armonizar,
  colorDeEmocion,
  colorDePalabra,
  coloresDeHistoria,
  contrastan,
  CREMA,
  emocionDeColor,
  EMOCIONES,
  enRango,
  esIntenso,
  FAMILIA,
  medidaHsl,
  mismaTinta,
  oscurecerTono,
  silencioDe,
  variarSilencio,
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
  familia?: Emocion | null;
  pleno?: boolean;
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
  familia: Emocion | null;
  pleno: boolean;
};

const HILO: [number, number] = [Math.round(ANCHO * 0.003), Math.round(ANCHO * 0.01)];
const FINA: [number, number] = [Math.round(ANCHO * 0.01) + 1, Math.round(ANCHO * 0.03)];
const CAMPO: [number, number] = [Math.round(ANCHO * 0.12), Math.round(ANCHO * 0.4)];
const FINO_INTENSA = Math.round(ANCHO * 0.6);
const TOPE_FAMILIA = Math.round(ANCHO * 0.4);
const PLENO_MIN = Math.round(ANCHO * 0.15);
const PLENO_MAX = Math.round(ANCHO * 0.2);
const TOPE_CREMA = Math.round(ANCHO * 0.15);
const TOPE_CREMA_CALMA = Math.round(ANCHO * 0.25);
const BORDE = Math.round(ANCHO * 0.03);

function topeCrema(modo: Modo): number {
  return modo === 'calma' ? TOPE_CREMA_CALMA : TOPE_CREMA;
}

let paletaActiva: string[] = [];
let familiaPorHex = new Map<string, Emocion>();

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
  familia?: Emocion | null;
  pleno?: boolean;
}): Pieza {
  const min = Math.max(1, params.min);
  const max = Math.max(min, params.max);
  return {
    ...params,
    hex: params.hex.toUpperCase(),
    familia: params.familia ?? null,
    pleno: params.pleno ?? false,
    min,
    max,
    width: Math.max(min, Math.min(max, params.width)),
  };
}

function colorLibre(preferido: string, prohibidos: string[], rng: () => number, familia?: Emocion | null): string {
  const fuente = familia
    ? FAMILIA[familia].flatMap((color) => [color.toUpperCase(), aclarar(color)])
    : paletaActiva.length > 0
      ? paletaActiva
      : [];
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
  return pref || fuente[0] || '#FF4F5A';
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

function colorEmocion(emocion: Emocion, analisis: Analisis, rango: number): string {
  const fila = analisis.emociones.find((e) => e.emocion === emocion);
  return colorDeEmocion(emocion, analisis.animo, fila?.peso ?? 0.4, rango);
}

function repartirPausas(piezas: Pieza[]): Pieza[] {
  const pausas = piezas.filter((p) => p.cream);
  const crom = piezas.filter((p) => !p.cream);
  if (pausas.length === 0 || crom.length < 2) return piezas;
  const cortes: number[] = [];
  for (let i = 0; i < crom.length - 1; i++) {
    const a = crom[i]!;
    const b = crom[i + 1]!;
    if (a.momento !== b.momento || a.kind === 'campo' || b.kind === 'campo') cortes.push(i);
  }
  if (cortes.length === 0) cortes.push(Math.floor((crom.length - 1) / 2));
  const grupos = cortes.map(() => [] as Pieza[]);
  pausas.forEach((pausa, i) => grupos[i % cortes.length]!.push(pausa));
  const out: Pieza[] = [];
  for (let i = 0; i < crom.length; i++) {
    out.push(crom[i]!);
    const gi = cortes.indexOf(i);
    if (gi < 0) continue;
    grupos[gi]!.forEach((pausa, k) => {
      if (k > 0) {
        out.push(
          pieza({
            kind: 'fina',
            cream: false,
            hex: pausa.hex,
            motivo: 'puente',
            momento: -1,
            width: FINA[0],
            min: FINA[0],
            max: FINA[1],
            familia: pausa.familia,
            pleno: true,
          })
        );
      }
      out.push(pausa);
    });
  }
  return out;
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
    params.modo === 'calma' ? Math.min(TOPE_CREMA_CALMA, Math.max(minPausas, Math.max(0, TOPE_CREMA_CALMA - sumaSilencio))) : minPausas;
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
      const preferido = clave
        ? colorDePalabra(clave.palabra, params.analisis.animo.valencia, params.analisis.animo.activacion, clave.peso)
        : colorEmocion(momento.emocion, params.analisis, k + 1);
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
          hex: tomarHex(colorEmocion(momento.emocion, params.analisis, lineas.length)),
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
              hex: tomarHex(colorEmocion(principal, params.analisis, k + sIdx)),
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

  if (params.modo === 'calma') {
    for (const cluster of clusters) {
      const cortes = cluster.map((p, i) => (!p.cream ? i : -1)).filter((i) => i >= 0);
      if (cortes.length < 4) continue;
      const medio = cortes[Math.floor(cortes.length / 2)]!;
      cluster.splice(
        medio,
        0,
        pieza({
          kind: 'pausa',
          cream: true,
          hex: CREMA,
          motivo: 'pausa',
          momento: cluster[medio]?.momento ?? -1,
          width: 36,
          min: 20,
          max: 80,
        })
      );
    }
  }

  const pausaDe = (motivo: string): Pieza => {
    if (params.modo === 'calma') {
      return pieza({
        kind: 'pausa',
        cream: true,
        hex: CREMA,
        motivo,
        momento: -1,
        width: entre(rng, 48, 110),
        min: 28,
        max: 150,
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
    const preferido =
      i > 0 && clave
        ? colorDePalabra(clave.palabra, params.analisis.animo.valencia, params.analisis.animo.activacion, clave.peso)
        : colorEmocion(emocion, params.analisis, i);
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
  const tonoSilencio = silencioDe(principal);
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
  for (const p of secuencia) {
    if (!p.cream) continue;
    p.hex = tonoSilencio;
    p.familia = principal;
    p.pleno = false;
  }
  return repartirPausas(secuencia);
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
  if (suma(out) < ANCHO) crecer(out, (p) => !p.cream, ANCHO - suma(out));
  if (suma(out) > ANCHO) encoger(out, (p) => !p.cream && p.kind !== 'campo', suma(out) - ANCHO);
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
    const idx = paletaActiva.findIndex((tono) => tono !== CREMA);
    if (idx >= 0) paletaActiva[idx] = hex;
  }
}

function aplicarColoresDeImagen(piezas: Pieza[], colores: string[], modo: Modo): void {
  if (colores.length === 0) return;
  const mezclas = colores.map((hex) => armonizar(hex).toUpperCase());
  const usadas = new Set<Pieza>();
  for (const mezcla of mezclas) {
    const destino = piezas.find((p) => {
      if (p.cream || p.kind === 'campo' || p.motivo === 'color-imagen' || usadas.has(p)) return false;
      const i = piezas.indexOf(p);
      const prev = piezas[i - 1]?.hex ?? '';
      const next = piezas[i + 1]?.hex ?? '';
      return (!prev || contrastan(mezcla, prev)) && (!next || contrastan(mezcla, next));
    });
    if (!destino) continue;
    usadas.add(destino);
    destino.hex = mezcla;
    destino.motivo = 'color-imagen';
    destino.familia = emocionDeColor(mezcla);
    destino.pleno = modo === 'calma';
    familiaPorHex.set(mezcla, destino.familia);
  }
}

function repararContraste(piezas: Pieza[]): void {
  const yaUsados = () => [...new Set(piezas.map((p) => p.hex))].filter((hex) => hex !== CREMA);
  for (let i = 1; i < piezas.length; i++) {
    const prev = piezas[i - 1]!;
    const cur = piezas[i]!;
    if (cur.cream && prev.cream) continue;
    if (cur.hex !== prev.hex && contrastan(cur.hex, prev.hex)) continue;
    let mover = cur;
    if ((cur.motivo === 'color-imagen' || cur.motivo === 'borde' || cur.kind === 'campo') && prev.motivo !== 'borde' && prev.kind !== 'campo' && !prev.cream) {
      mover = prev;
    } else if (cur.cream && !prev.cream) mover = prev;
    if (mover.cream || mover.motivo === 'color-imagen' || mover.kind === 'campo') continue;
    if (mover.motivo === 'borde') {
      const idx = piezas.indexOf(mover);
      const propuesto = tonoPleno(mover, [piezas[idx - 1]?.hex ?? '', piezas[idx + 1]?.hex ?? '']);
      const presentes = new Set(piezas.map((p) => p.hex));
      if ((presentes.has(propuesto) || presentes.size < 12) && propuesto !== piezas[idx - 1]?.hex && propuesto !== piezas[idx + 1]?.hex) {
        mover.hex = propuesto;
      }
      continue;
    }
    const propiosDe = (pieza: Pieza) =>
      pieza.familia
        ? FAMILIA[pieza.familia].flatMap((color) => {
            const base = ajustarTinta(color);
            return pieza.pleno ? [base] : [aclarar(base), base];
          })
        : yaUsados();
    const aplicar = (pieza: Pieza, ladoPrev: string, ladoNext: string): boolean => {
      const vecinos = [ladoPrev, ladoNext].filter(Boolean);
      const presentes = new Set(piezas.map((p) => p.hex));
      const usadosCampo = new Set(piezas.filter((otro) => otro.kind === 'campo' && otro !== pieza).map((otro) => otro.hex));
      const pool = propiosDe(pieza).filter((hex) => presentes.has(hex) || presentes.size < 12);
      const elegido = pool.find((hex) => hex !== CREMA && !usadosCampo.has(hex) && vecinos.every((v) => contrastan(hex, v)));
      if (elegido) {
        pieza.hex = elegido;
        return true;
      }
      if (presentes.size >= 12) return false;
      const semilla = propiosDe(pieza)[0] ?? pieza.hex;
      const variante = mismaTinta(pieza.pleno ? semilla : aclarar(semilla), vecinos);
      if (vecinos.some((v) => v === variante)) return false;
      pieza.hex = variante;
      return true;
    };
    const idx = piezas.indexOf(mover);
    if (aplicar(mover, piezas[idx - 1]?.hex ?? '', piezas[idx + 1]?.hex ?? '')) continue;
    const otro = mover === cur ? prev : cur;
    if (!otro.cream && otro.motivo !== 'color-imagen') {
      const j = piezas.indexOf(otro);
      aplicar(otro, piezas[j - 1]?.hex ?? '', piezas[j + 1]?.hex ?? '');
    }
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
    objetivo.hex = colorLibre(objetivo.hex, [vecino, siguiente, ...otrosCampos], rng, objetivo.familia);
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

function cuposDe(analisis: Analisis, chromatic: number): Map<Emocion, number> {
  const filas = analisis.emociones.filter((e) => e.peso > 0);
  const base = filas.length > 0 ? filas : [{ emocion: 'calma' as Emocion, peso: 1 }];
  const sumaPesos = base.reduce((s, e) => s + e.peso, 0) || 1;
  const cupo = new Map<Emocion, number>();
  let resto = chromatic;
  for (const fila of base) {
    const ideal = Math.round((chromatic * fila.peso) / sumaPesos);
    const give = Math.min(TOPE_FAMILIA, ideal, resto);
    cupo.set(fila.emocion, (cupo.get(fila.emocion) ?? 0) + give);
    resto -= give;
  }
  let guard = 0;
  while (resto > 0 && guard < 5000) {
    const libres = [...cupo.entries()].filter(([, px]) => px < TOPE_FAMILIA).sort((a, b) => a[1] - b[1]);
    if (libres.length === 0) break;
    const [emocion, px] = libres[0]!;
    cupo.set(emocion, px + 1);
    resto -= 1;
    guard += 1;
  }
  if (resto > 0) {
    const mayor = Math.max(0, ...cupo.values());
    for (const emocion of EMOCIONES) {
      if (resto <= 0) break;
      if (cupo.has(emocion)) continue;
      const give = Math.min(TOPE_FAMILIA, Math.max(1, mayor - 1), resto);
      cupo.set(emocion, give);
      resto -= give;
    }
  }
  return cupo;
}

function colorDeFamilia(emocion: Emocion, indice: number, modo: Modo, pleno: boolean): string {
  const base = ajustarTinta((FAMILIA[emocion][indice % FAMILIA[emocion].length] ?? FAMILIA[emocion][0]!).toUpperCase());
  familiaPorHex.set(base, emocion);
  if (!paletaActiva.includes(base)) paletaActiva.push(base);
  if (pleno || modo !== 'calma') return base;
  const claro = aclarar(base);
  familiaPorHex.set(claro, emocion);
  if (!paletaActiva.includes(claro)) paletaActiva.push(claro);
  return claro;
}

function teñirPorEmocion(piezas: Pieza[], analisis: Analisis, modo: Modo): void {
  familiaPorHex = new Map();
  const cromaticas = piezas.filter((p) => !p.cream);
  const chromatic = cromaticas.reduce((s, p) => s + p.width, 0);
  const cupo = cuposDe(analisis, chromatic);
  const queda = new Map(cupo);
  const orden = [...cupo.entries()].sort((a, b) => b[1] - a[1]).map(([emocion]) => emocion);
  let plenoPx = 0;
  const plenoTope = modo === 'calma' ? Math.round(ANCHO * 0.17) : chromatic;
  const campos = cromaticas.filter((p) => p.kind === 'campo');
  campos.forEach((p, i) => {
    const preferida = orden[Math.min(i, orden.length - 1)] ?? 'calma';
    let hex = colorDeFamilia(preferida, i + 1, modo, modo !== 'calma');
    const usadosCampo = new Set(campos.slice(0, i).map((otro) => otro.hex));
    let giro = 0;
    while (usadosCampo.has(hex) && giro < 6) {
      hex = colorDeFamilia(preferida, i + giro + 2, modo, modo !== 'calma');
      giro += 1;
    }
    p.hex = hex;
    p.familia = preferida;
    p.pleno = modo !== 'calma';
    queda.set(preferida, (queda.get(preferida) ?? 0) - p.width);
  });
  cromaticas.forEach((p, indice) => {
    if (p.kind === 'campo') return;
    const delMomento = p.momento >= 0 ? analisis.momentos[p.momento]?.emocion : undefined;
    const cabe = (emocion: Emocion | undefined) => Boolean(emocion && (queda.get(emocion) ?? 0) >= Math.min(p.width, 12));
    const preferida = cabe(delMomento)
      ? delMomento!
      : (orden.find((emocion) => cabe(emocion)) ?? orden[0] ?? 'calma');
    const pleno = modo !== 'calma' || (plenoPx < plenoTope && indice % 5 === 0);
    let hex = colorDeFamilia(preferida, indice, modo, pleno);
    const ya = new Set(cromaticas.map((otro) => otro.hex).filter((tono) => tono && tono !== '#000000'));
    if (ya.size >= 11 && !ya.has(hex)) {
      const repetido = FAMILIA[preferida]
        .flatMap((color) => {
          const base = color.toUpperCase();
          return pleno || modo !== 'calma' ? [base] : [aclarar(base), base];
        })
        .find((tono) => ya.has(tono));
      if (repetido) hex = repetido;
    }
    p.hex = hex;
    p.familia = preferida;
    p.pleno = modo === 'calma' ? pleno : true;
    if (p.pleno) plenoPx += p.width;
    queda.set(preferida, (queda.get(preferida) ?? 0) - p.width);
  });
  const usados = new Set(piezas.map((p) => p.hex));
  if (modo !== 'calma') {
    const intensos: Array<{ emocion: Emocion; hex: string }> = [];
    for (const emocion of orden) {
      for (const color of FAMILIA[emocion]) {
        const hex = color.toUpperCase();
        if (esIntenso(hex) && !intensos.some((item) => item.hex === hex)) intensos.push({ emocion, hex });
      }
    }
    const puestos = new Set(piezas.filter((p) => esIntenso(p.hex)).map((p) => p.hex));
    for (const item of intensos) {
      if (puestos.size >= 3) break;
      if (puestos.has(item.hex)) continue;
      const p = cromaticas.find((otro) => otro.kind !== 'campo' && !esIntenso(otro.hex));
      if (!p) break;
      p.hex = item.hex;
      p.familia = item.emocion;
      p.pleno = true;
      familiaPorHex.set(item.hex, item.emocion);
      puestos.add(item.hex);
      usados.add(item.hex);
    }
  }
  if (usados.size >= 7) return;
  const extras: string[] = [];
  for (const emocion of orden) {
    for (const color of FAMILIA[emocion]) {
      const hex = modo === 'calma' ? aclarar(color) : color.toUpperCase();
      familiaPorHex.set(color.toUpperCase(), emocion);
      familiaPorHex.set(hex, emocion);
      if (!usados.has(hex) && !extras.includes(hex)) extras.push(hex);
    }
  }
  let n = 0;
  for (const p of cromaticas) {
    if (usados.size >= 7 || p.kind === 'campo') continue;
    const hex = extras[n++];
    if (!hex) break;
    p.hex = hex;
    p.familia = familiaPorHex.get(hex) ?? p.familia;
    p.pleno = false;
    usados.add(hex);
  }
}

function limitarFamilias(piezas: Pieza[]): void {
  const anchoFam = (emocion: Emocion) =>
    piezas.filter((p) => p.familia === emocion && !p.cream).reduce((s, p) => s + p.width, 0);
  let guard = 0;
  while (guard < 100) {
    const familias = [...new Set(piezas.map((p) => p.familia).filter((f): f is Emocion => Boolean(f)))];
    const grande = familias.map((emocion) => ({ emocion, px: anchoFam(emocion) })).sort((a, b) => b.px - a.px)[0];
    if (!grande || grande.px <= TOPE_FAMILIA) break;
    const chica =
      familias.filter((emocion) => emocion !== grande.emocion && anchoFam(emocion) < TOPE_FAMILIA).sort((a, b) => anchoFam(a) - anchoFam(b))[0] ??
      EMOCIONES.find((emocion) => !familias.includes(emocion));
    if (!chica) break;
    const p = piezas
      .filter((item) => item.familia === grande.emocion && !item.cream && item.motivo !== 'color-imagen' && item.motivo !== 'borde' && item.kind !== 'campo')
      .sort((a, b) => a.width - b.width)[0];
    if (!p) break;
    const i = piezas.indexOf(p);
    const prev = piezas[i - 1]?.hex ?? '';
    const next = piezas[i + 1]?.hex ?? '';
    let hex = '';
    for (let k = 0; k < FAMILIA[chica].length; k++) {
      const base = ajustarTinta(FAMILIA[chica][(guard + k) % FAMILIA[chica].length]!);
      const candidato = p.pleno ? base : aclarar(base);
      if ((prev && !contrastan(candidato, prev)) || (next && !contrastan(candidato, next))) continue;
      hex = candidato;
      break;
    }
    if (!hex) hex = aclarar(FAMILIA[chica][0]!);
    p.hex = hex;
    p.familia = chica;
    familiaPorHex.set(hex, chica);
    guard += 1;
  }
}

function ajustarPlenos(piezas: Pieza[], modo: Modo): void {
  if (modo !== 'calma') return;
  const anchoPleno = () => piezas.filter((p) => p.pleno && !p.cream).reduce((s, p) => s + p.width, 0);
  let guard = 0;
  while (anchoPleno() > PLENO_MAX && guard < 50) {
    const p = piezas
      .filter((item) => item.pleno && !item.cream && item.motivo !== 'color-imagen' && item.motivo !== 'borde' && item.familia)
      .sort((a, b) => b.width - a.width)[0];
    if (!p?.familia) break;
    const claro = aclarar(FAMILIA[p.familia][guard % FAMILIA[p.familia].length]!);
    p.hex = claro;
    p.pleno = false;
    familiaPorHex.set(claro, p.familia);
    guard += 1;
  }
  guard = 0;
  while (anchoPleno() < PLENO_MIN && guard < 50) {
    const p = piezas.find((item) => !item.cream && !item.pleno && item.kind !== 'campo' && item.familia && item.motivo !== 'color-imagen' && item.motivo !== 'borde');
    if (!p?.familia) break;
    const base = ajustarTinta(FAMILIA[p.familia][guard % FAMILIA[p.familia].length]!);
    const i = piezas.indexOf(p);
    const prev = piezas[i - 1]?.hex ?? '';
    const next = piezas[i + 1]?.hex ?? '';
    if ((prev && !contrastan(base, prev)) || (next && !contrastan(base, next))) {
      guard += 1;
      continue;
    }
    p.hex = base;
    p.pleno = true;
    familiaPorHex.set(base, p.familia);
    guard += 1;
  }
}

function limitarColores(piezas: Pieza[]): void {
  const deFamilia = (pieza: Pieza, hex: string) => {
    if (!pieza.familia) return hex !== CREMA;
    return FAMILIA[pieza.familia].some((color) => {
      const base = color.toUpperCase();
      return hex === base || hex === aclarar(base);
    });
  };
  const encaja = (hex: string, a: string, b: string) =>
    hex !== CREMA && hex !== a && hex !== b && (!a || contrastan(hex, a)) && (!b || contrastan(hex, b));
  let guard = 0;
  while (new Set(piezas.map((p) => p.hex)).size > 12 && guard < 40) {
    const pesos = new Map<string, number>();
    for (const p of piezas) pesos.set(p.hex, (pesos.get(p.hex) ?? 0) + p.width);
    const candidatos = [...pesos.entries()]
      .filter(([hex]) => {
        if (hex === CREMA) return false;
        const libre = piezas.some((p) => p.hex === hex && !p.cream && p.motivo !== 'color-imagen' && p.kind !== 'campo');
        if (!libre) return false;
        const intensos = new Set(piezas.filter((p) => esIntenso(p.hex)).map((p) => p.hex));
        if (esIntenso(hex) && intensos.size <= 3) return false;
        return true;
      })
      .sort((a, b) => a[1] - b[1])
      .map(([hex]) => hex);
    let cambio = false;
    for (const quitar of candidatos) {
      for (const piezaActual of piezas) {
        if (piezaActual.hex !== quitar || piezaActual.cream || piezaActual.motivo === 'borde' || piezaActual.kind === 'campo' || piezaActual.motivo === 'color-imagen') continue;
        const i = piezas.indexOf(piezaActual);
        const prev = piezas[i - 1];
        const next = piezas[i + 1];
        const opciones = [...pesos.keys()].filter((hex) => deFamilia(piezaActual, hex) && hex !== quitar);
        for (const destino of opciones) {
          const lado = (vecino: Pieza | undefined, extremo: string, contra: string): string => {
            if (!vecino || encaja(destino, vecino.hex, '')) return vecino?.hex ?? '';
            if (vecino.cream || vecino.kind === 'campo' || vecino.motivo === 'color-imagen') return '';
            return (
              [...pesos.keys()].find((hex) => deFamilia(vecino, hex) && hex !== quitar && encaja(hex, extremo, contra)) ?? ''
            );
          };
          const prevHex = prev ? lado(prev, piezas[i - 2]?.hex ?? '', destino) : '';
          if (prev && !prevHex && !encaja(destino, prev.hex, '')) continue;
          const nextHex = next ? lado(next, piezas[i + 2]?.hex ?? '', destino) : '';
          if (next && !nextHex && !encaja(destino, '', next.hex)) continue;
          if (!encaja(destino, prevHex || prev?.hex || '', nextHex || next?.hex || '')) continue;
          if (prev && prevHex && prevHex !== prev.hex) prev.hex = prevHex;
          if (next && nextHex && nextHex !== next.hex) next.hex = nextHex;
          piezaActual.hex = destino;
          cambio = true;
          break;
        }
        if (!cambio) continue;
        break;
      }
      if (cambio) break;
    }
    if (!cambio) {
      for (const quitar of candidatos) {
        const muestra = piezas.find((p) => p.hex === quitar && p.familia && !p.cream && p.kind !== 'campo' && p.motivo !== 'color-imagen');
        if (!muestra?.familia) continue;
        const hermano = [...pesos.keys()].find((hex) => hex !== quitar && deFamilia(muestra, hex));
        if (!hermano) continue;
        for (const p of piezas) {
          if (p.hex !== quitar || p.cream || p.kind === 'campo' || p.motivo === 'color-imagen') continue;
          p.hex = hermano;
          if (p.motivo === 'borde') p.pleno = true;
          cambio = true;
        }
        if (cambio) break;
      }
    }
    if (!cambio) break;
    guard += 1;
  }
  let extra = 0;
  while (new Set(piezas.map((p) => p.hex)).size > 12 && extra < 20) {
    const pesos = new Map<string, number>();
    for (const p of piezas) pesos.set(p.hex, (pesos.get(p.hex) ?? 0) + (p.cream || p.kind === 'campo' ? 10000 : p.width));
    const orden = [...pesos.entries()].sort((a, b) => a[1] - b[1]).map(([hex]) => hex);
    let aplicado = false;
    for (const quitar of orden) {
      if (quitar === CREMA) continue;
      const muestra = piezas.find((p) => p.hex === quitar && p.familia && !p.cream && p.kind !== 'campo' && p.motivo !== 'color-imagen');
      if (!muestra) continue;
      const hermanos = [...pesos.keys()].filter((hex) => hex !== quitar && deFamilia(muestra, hex) && !piezas.some((p) => p.hex === hex && p.cream));
      for (const hermano of hermanos) {
        for (const p of piezas) {
          if (p.hex !== quitar || p.cream || p.kind === 'campo' || p.motivo === 'color-imagen') continue;
          const i = piezas.indexOf(p);
          const prev = piezas[i - 1]?.hex ?? '';
          const next = piezas[i + 1]?.hex ?? '';
          if ((prev && !contrastan(hermano, prev)) || (next && !contrastan(hermano, next))) continue;
          p.hex = hermano;
          if (p.motivo === 'borde') p.pleno = true;
          aplicado = true;
        }
        if (aplicado && !piezas.some((p) => p.hex === quitar && !p.cream && p.kind !== 'campo' && p.motivo !== 'color-imagen')) break;
      }
      if (aplicado && new Set(piezas.map((p) => p.hex)).size <= 12) break;
    }
    if (!aplicado) break;
    extra += 1;
  }
}

function separarCampos(piezas: Pieza[]): void {
  const usados = new Set<string>();
  for (const campo of piezas.filter((p) => p.kind === 'campo')) {
    if (!usados.has(campo.hex)) {
      usados.add(campo.hex);
      continue;
    }
    const familia = campo.familia ? FAMILIA[campo.familia] : [];
    const i = piezas.indexOf(campo);
    const prev = piezas[i - 1]?.hex ?? '';
    const next = piezas[i + 1]?.hex ?? '';
    const otro = familia
      .map((color) => ajustarTinta(color))
      .find((hex) => !usados.has(hex) && hex !== prev && hex !== next && (!prev || contrastan(hex, prev)) && (!next || contrastan(hex, next)));
    if (!otro) continue;
    campo.hex = otro;
    campo.pleno = true;
    usados.add(otro);
  }
}

function tonoPleno(p: Pieza, evitar: string[] = []): string {
  const familia = p.familia ? FAMILIA[p.familia] : [];
  const opciones = (familia.length > 0 ? familia : [p.hex]).map((color) => ajustarTinta(color));
  return (
    opciones.find((hex) => evitar.every((otro) => !otro || (hex !== otro && contrastan(hex, otro)))) ??
    opciones.find((hex) => evitar.every((otro) => hex !== otro)) ??
    ajustarTinta(p.hex)
  );
}

function marcarPleno(p: Pieza): void {
  p.hex = tonoPleno(p);
  p.pleno = true;
  p.motivo = 'borde';
}

function asegurarBordes(piezas: Pieza[]): void {
  const sacar = (inicio: boolean) => {
    let guard = 0;
    while (guard < 40) {
      let acc = 0;
      let i = inicio ? 0 : piezas.length - 1;
      const dir = inicio ? 1 : -1;
      let pausa = -1;
      while (i >= 0 && i < piezas.length && acc < BORDE) {
        if (piezas[i]!.cream) {
          pausa = i;
          break;
        }
        acc += piezas[i]!.width;
        i += dir;
      }
      if (pausa < 0) break;
      const [p] = piezas.splice(pausa, 1);
      if (!p) break;
      const destino = Math.max(1, Math.min(piezas.length - 1, Math.floor(piezas.length / 2)));
      piezas.splice(destino, 0, p);
      guard += 1;
    }
  };
  const cubrir = (inicio: boolean) => {
    let acc = 0;
    let i = inicio ? 0 : piezas.length - 1;
    const dir = inicio ? 1 : -1;
    while (acc < BORDE && i >= 0 && i < piezas.length) {
      const p = piezas[i]!;
      if (p.cream) break;
      const falta = BORDE - acc;
      if (p.motivo === 'borde' && p.pleno && p.width >= Math.min(p.width, falta) && acc + p.width >= BORDE && p.width <= falta) {
        acc += p.width;
        i += dir;
        continue;
      }
      if ((p.kind === 'campo' || p.motivo === 'color-imagen' || p.width > falta) && p.width > falta) {
        const donante =
          p.kind === 'campo' || p.motivo === 'color-imagen'
            ? piezas.find(
                (q) => !q.cream && q !== p && q.motivo !== 'borde' && q.motivo !== 'color-imagen' && q.kind !== 'campo' && q.width - falta >= q.min
              )
            : p;
        if (p.kind !== 'campo' && p.motivo !== 'color-imagen') {
          const resto: Pieza = {
            ...p,
            width: p.width - falta,
            min: Math.min(p.min, p.width - falta),
            max: Math.max(p.max, p.width - falta),
            motivo: p.motivo === 'borde' ? (p.familia ?? 'franja') : p.motivo,
          };
          p.width = falta;
          p.min = Math.min(p.min, falta);
          p.max = Math.max(p.max, falta);
          marcarPleno(p);
          p.momento = -1;
          piezas.splice(inicio ? i + 1 : i, 0, resto);
          return;
        }
        if (donante && donante !== p) {
          donante.width -= falta;
          donante.min = Math.min(donante.min, donante.width);
        } else if (p.width - falta >= (p.kind === 'campo' ? CAMPO[0] : 1)) {
          p.width -= falta;
          p.min = Math.min(p.min, p.width);
        } else {
          marcarPleno(p);
          return;
        }
        const borde = pieza({
          kind: 'fina',
          cream: false,
          hex: tonoPleno(p, [p.hex, piezas[inicio ? i + 1 : i - 1]?.hex ?? '']),
          motivo: 'borde',
          momento: -1,
          width: falta,
          min: falta,
          max: falta,
          familia: p.familia,
          pleno: true,
        });
        piezas.splice(inicio ? i : i + 1, 0, borde);
        return;
      }
      marcarPleno(p);
      acc += p.width;
      i += dir;
    }
  };
  sacar(true);
  sacar(false);
  cubrir(true);
  cubrir(false);
  for (let i = 1; i < piezas.length; i++) {
    const prev = piezas[i - 1]!;
    const cur = piezas[i]!;
    if (cur.hex !== prev.hex && contrastan(cur.hex, prev.hex)) continue;
    const borde = cur.motivo === 'borde' ? cur : prev.motivo === 'borde' ? prev : null;
    if (!borde) continue;
    const otro = borde === cur ? prev : cur;
    const lado = borde === cur ? piezas[i + 1]?.hex ?? '' : piezas[i - 2]?.hex ?? '';
    borde.hex = tonoPleno(borde, [otro.hex, lado]);
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
  const colores = new Set(plan.bandas.filter((b) => b.clase !== 'pausa').map((b) => b.hex));
  if (colores.size < 7 || colores.size > 12) errores.push(`${colores.size} colores`);
  const porFamilia = new Map<string, number>();
  for (const banda of plan.bandas) {
    if (!banda.familia || banda.clase === 'pausa') continue;
    porFamilia.set(banda.familia, (porFamilia.get(banda.familia) ?? 0) + banda.ancho);
  }
  for (const [familia, px] of porFamilia) {
    if (px > TOPE_FAMILIA) errores.push(`${familia} ${px}px`);
  }
  if (plan.modo === 'calma') {
    const pleno = plan.bandas.filter((b) => b.pleno).reduce((s, b) => s + b.ancho, 0);
    const plenosDistintos = new Set(plan.bandas.filter((b) => b.pleno).map((b) => b.hex));
    if (pleno < PLENO_MIN || pleno > PLENO_MAX) errores.push(`plenos ${pleno}px`);
    if (plenosDistintos.size < 3) errores.push('faltan acentos plenos');
  } else {
    const familias = new Set(plan.bandas.map((b) => b.familia).filter((f): f is Emocion => Boolean(f)));
    const disponibles = new Set<string>();
    for (const familia of familias) {
      for (const color of FAMILIA[familia]) {
        if (esIntenso(color)) disponibles.add(color.toUpperCase());
      }
    }
    const enCinta = new Set(plan.bandas.filter((b) => esIntenso(b.hex)).map((b) => b.hex));
    if (enCinta.size < Math.min(3, disponibles.size)) errores.push('faltan colores intensos');
  }
  for (let i = 1; i < plan.bandas.length; i++) {
    if (!contrastan(plan.bandas[i]!.hex, plan.bandas[i - 1]!.hex)) errores.push(`poco contraste en la franja ${i}`);
  }
  if (plan.bandas.some((b) => b.hex === '#000000' || b.hex === '#FFFFFF' || b.hex === CREMA || !enRango(b.hex))) {
    errores.push('color fuera de rango');
  }
  const bordeInicio = cubrirBorde(plan.bandas, true);
  const bordeFin = cubrirBorde([...plan.bandas].reverse(), true);
  if (!bordeInicio) errores.push('el inicio no es pleno');
  if (!bordeFin) errores.push('el final no es pleno');
  if (plan.bandas[0]?.clase === 'pausa' || plan.bandas[plan.bandas.length - 1]?.clase === 'pausa') errores.push('silencio en el extremo');
  let silencioPrevio = '';
  for (const banda of plan.bandas) {
    if (banda.clase !== 'pausa') continue;
    if (banda.hex === silencioPrevio) errores.push('silencios del mismo tono');
    const { l, s } = medidaHsl(banda.hex);
    if (l < 0.62 || l > 0.78 || s < 0.45 || s > 0.7) errores.push(`silencio ${banda.hex}`);
    silencioPrevio = banda.hex;
  }
  return errores;
}

function teñirSilencios(piezas: Pieza[]): void {
  let anterior = '';
  let paso = 0;
  for (let i = 0; i < piezas.length; i++) {
    const p = piezas[i]!;
    if (!p.cream) continue;
    const ancho = new Map<string, number>();
    const sumar = (desde: number, dir: number) => {
      for (let j = desde; j >= 0 && j < piezas.length; j += dir) {
        const q = piezas[j]!;
        if (q.cream) break;
        ancho.set(q.hex, (ancho.get(q.hex) ?? 0) + q.width);
      }
    };
    sumar(i - 1, -1);
    if (ancho.size === 0) sumar(i + 1, 1);
    const base = [...ancho.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? p.hex;
    const prev = piezas[i - 1]?.hex ?? '';
    const next = piezas[i + 1]?.hex ?? '';
    let elegido = '';
    for (let k = 0; k < 24; k++) {
      const candidato = variarSilencio(base, paso + k, anterior);
      if (candidato === anterior) continue;
      if (prev && !contrastan(candidato, prev)) continue;
      if (next && next !== candidato && !piezas[i + 1]!.cream && !contrastan(candidato, next)) continue;
      elegido = candidato;
      break;
    }
    p.hex = elegido || variarSilencio(base, paso + 3, anterior);
    p.pleno = false;
    p.familia = emocionDeColor(base);
    anterior = p.hex;
    paso += 1;
  }
  for (let i = 0; i < piezas.length; i++) {
    const p = piezas[i]!;
    if (!p.cream) continue;
    for (const lado of [-1, 1]) {
      const j = i + lado;
      const vecino = piezas[j];
      if (!vecino || vecino.cream || contrastan(p.hex, vecino.hex)) continue;
      if (vecino.motivo === 'color-imagen') continue;
      const otro = piezas[j + lado]?.hex ?? '';
      const presentes = new Set(piezas.filter((q) => !q.cream).map((q) => q.hex));
      const usadosCampo = new Set(piezas.filter((q) => q.kind === 'campo' && q !== vecino).map((q) => q.hex));
      const opciones = vecino.familia
        ? FAMILIA[vecino.familia].flatMap((color) => {
            const base = ajustarTinta(color);
            return [base, aclarar(base)];
          })
        : [];
      const nuevo = opciones.find((hex) => {
        if (usadosCampo.has(hex) || !contrastan(hex, p.hex) || (otro && !contrastan(hex, otro))) return false;
        if (presentes.has(hex)) return true;
        return new Set(piezas.filter((q) => !q.cream).map((q) => q.hex)).size < 12;
      });
      if (!nuevo) {
        const oscuro = oscurecerTono(vecino.hex);
        if (!usadosCampo.has(oscuro) && contrastan(oscuro, p.hex)) {
          const viejo = vecino.hex;
          vecino.hex = oscuro;
          const cuenta = () => new Set(piezas.filter((q) => !q.cream).map((q) => q.hex)).size;
          if (cuenta() > 12) {
            for (const q of piezas) {
              if (!q.cream && q.kind !== 'campo' && q.hex === viejo) q.hex = oscuro;
            }
          }
        }
        continue;
      }
      vecino.hex = nuevo;
      if (vecino.motivo === 'borde') vecino.pleno = true;
    }
  }
}

function cubrirBorde(bandas: Banda[], _inicio: boolean): boolean {
  let acc = 0;
  for (const banda of bandas) {
    if (acc >= BORDE) return true;
    if (banda.clase === 'pausa' || !banda.pleno) return false;
    acc += banda.ancho;
  }
  return acc >= BORDE;
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
  teñirPorEmocion(cuadradas, params.analisis, modo);
  const rng = rngDeId(`${params.id}:color`);
  const separadas = separarColores(cuadradas, rng, modo);
  romperRepeticion(separadas, modo);
  aplicarColoresDeImagen(separadas, params.coloresImagen ?? [], modo);
  const finales = separarColores(separadas, rng, modo);
  limitarFamilias(finales);
  ajustarPlenos(finales, modo);
  limitarFamilias(finales);
  for (let ronda = 0; ronda < 4; ronda++) {
    limitarColores(finales);
    repararContraste(finales);
  }
  const cerrarTinta = () => {
    for (const p of finales) {
      if (!p.cream) p.hex = ajustarTinta(p.hex);
    }
  };
  cerrarTinta();
  asegurarBordes(finales);
  ajustarPlenos(finales, modo);
  for (let ronda = 0; ronda < 3; ronda++) {
    separarCampos(finales);
    limitarColores(finales);
    repararContraste(finales);
    cerrarTinta();
  }
  separarCampos(finales);
  teñirSilencios(finales);
  repararContraste(finales);
  let x = 0;
  const bandas: Banda[] = finales.map((p) => {
    const banda: Banda = {
      x,
      ancho: p.width,
      hex: p.hex.toUpperCase(),
      clase: p.cream ? 'pausa' : p.kind,
      motivo: p.motivo,
      momento: p.momento,
      familia: p.familia,
      pleno: p.pleno,
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
