/**
 * Color de la versión 3. El tono sale de las imágenes.
 * La emoción no elige el tono. La luz sale de la valencia y el contraste de la activación.
 */
import { PALETA_MADRE, TONOS_MADRE, type NivelPaleta, type TonoMadre } from '@/lib/cintas-v2/paleta-madre';
import { contrastan, medidaHsl, type Emocion } from '@/lib/cintas-v2/palette';
import { rngDeId } from '@/lib/cintas-v2/seed';
import type { Analisis, ImagenMomento } from '@/lib/cintas-v2/understand/schema';
import { ANCHO, type Banda, type PlanCintas } from '@/lib/cintas-v2/compose/layout';

export const MENSAJE_SIN_IMAGEN = 'Tu historia, en colores';
const TOPE_TONO = Math.round(ANCHO * 0.3);

const VALENCIA_EMOCION: Record<Emocion, number> = {
  alegría: 0.9,
  amor: 0.82,
  esperanza: 0.78,
  gratitud: 0.8,
  orgullo: 0.72,
  calma: 0.66,
  asombro: 0.6,
  nostalgia: 0.42,
  tristeza: 0.18,
  pérdida: 0.15,
  miedo: 0.22,
  rabia: 0.28,
};

export type RazonColor = {
  tono: TonoMadre;
  nombre: string;
  razon: string;
};

export type PlanV3 = {
  plan: PlanCintas;
  razones: RazonColor[];
  mensaje: string | null;
};

type PesoTono = { tono: TonoMadre; peso: number; razon: string };

function clampNivel(n: number): NivelPaleta {
  return Math.min(5, Math.max(1, Math.round(n))) as NivelPaleta;
}

function tonoDeHex(hex: string): TonoMadre {
  const exacto = PALETA_MADRE.find((item) => item.hex.toUpperCase() === hex.toUpperCase());
  return exacto?.tono ?? tonoCercano(hex);
}

export function colorMadre(tono: TonoMadre, nivel: NivelPaleta): { nombre: string; hex: string } {
  const color = PALETA_MADRE.find((item) => item.tono === tono && item.nivel === nivel);
  return { nombre: color?.nombre ?? tono, hex: (color?.hex ?? '#E10600').toUpperCase() };
}

export function tonoCercano(hex: string): TonoMadre {
  const grados = medidaHsl(hex).h * 360;
  let mejor: TonoMadre = 'rojo';
  let dist = 999;
  for (const tono of TONOS_MADRE) {
    const ref = medidaHsl(colorMadre(tono, 2).hex).h * 360;
    const d = Math.min(Math.abs(grados - ref), 360 - Math.abs(grados - ref));
    if (d < dist) {
      dist = d;
      mejor = tono;
    }
  }
  return mejor;
}

function nivelCentral(valencia: number): NivelPaleta {
  if (valencia < 0.22) return 1;
  if (valencia < 0.42) return 2;
  if (valencia < 0.62) return 3;
  if (valencia < 0.82) return 4;
  return 5;
}

function nivelesDe(valencia: number, intensidad: number): NivelPaleta[] {
  const centro = nivelCentral(valencia);
  if (valencia >= 0.75) {
    return intensidad >= 0.62 ? [2, 4, 5] : [4, 5];
  }
  const salto = intensidad >= 0.62 ? 2 : 1;
  const niveles = [clampNivel(centro - salto), centro, clampNivel(centro + salto)];
  return [...new Set(niveles)];
}

function valenciaDe(analisis: Analisis, indice: number): number {
  const momento = analisis.momentos[indice];
  if (momento && typeof momento.valencia === 'number') return momento.valencia;
  if (momento) return VALENCIA_EMOCION[momento.emocion];
  return analisis.animo.valencia;
}

function intensidadDe(analisis: Analisis, indice: number): number {
  return analisis.momentos[indice]?.intensidad ?? analisis.animo.activacion;
}

function imagenesDe(analisis: Analisis, indice: number): ImagenMomento[] | 'sin imagen' {
  const imagenes = analisis.momentos[indice]?.imagenes;
  if (!imagenes || imagenes === 'sin imagen') return 'sin imagen';
  return imagenes;
}

function pesosDe(imagenes: ImagenMomento[]): PesoTono[] {
  const mapa = new Map<TonoMadre, PesoTono>();
  for (const imagen of imagenes) {
    const previo = mapa.get(imagen.tono);
    if (!previo || imagen.peso > previo.peso) {
      mapa.set(imagen.tono, { tono: imagen.tono, peso: imagen.peso, razon: imagen.descripcion });
    } else {
      previo.peso += imagen.peso;
    }
  }
  return [...mapa.values()].sort((a, b) => b.peso - a.peso);
}

function mezclar(base: PesoTono[], extra: TonoMadre[], razon: string): PesoTono[] {
  const mapa = new Map(base.map((item) => [item.tono, { ...item }]));
  for (const tono of extra) {
    const previo = mapa.get(tono);
    if (previo) previo.peso += 0.45;
    else mapa.set(tono, { tono, peso: 0.45, razon });
  }
  return [...mapa.values()].sort((a, b) => b.peso - a.peso);
}

function tonosSemilla(id: string, cantidad: number): TonoMadre[] {
  const rng = rngDeId(`${id}:tonos`);
  const pool = [...TONOS_MADRE];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, cantidad);
}

function historiaSinImagen(analisis: Analisis): boolean {
  return analisis.momentos.every((m) => !m.imagenes || m.imagenes === 'sin imagen');
}

function elegirNivel(niveles: NivelPaleta[], tono: TonoMadre, previo: string, rng: () => number): NivelPaleta {
  const orden = [...niveles].sort((a, b) => Math.abs(a - b) - (rng() - 0.5));
  for (const nivel of orden) {
    const hex = colorMadre(tono, nivel).hex;
    if (!previo || contrastan(hex, previo)) return nivel;
  }
  for (const nivel of [1, 2, 3, 4, 5] as NivelPaleta[]) {
    if (contrastan(colorMadre(tono, nivel).hex, previo)) return nivel;
  }
  return orden[0] ?? 3;
}

function anchoPorTono(bandas: Banda[]): Map<TonoMadre, number> {
  const mapa = new Map<TonoMadre, number>();
  for (const banda of bandas) {
    if (banda.clase === 'pausa') continue;
    const tono = tonoDeHex(banda.hex);
    mapa.set(tono, (mapa.get(tono) ?? 0) + banda.ancho);
  }
  return mapa;
}

function reponerX(bandas: Banda[]): void {
  let x = 0;
  for (const banda of bandas) {
    banda.x = x;
    x += banda.ancho;
  }
}

export function revisarV3(plan: PlanCintas): string[] {
  const errores: string[] = [];
  const anchos = anchoPorTono(plan.bandas);
  if (anchos.size < 4) errores.push(`solo ${anchos.size} tonos`);
  for (const [tono, px] of anchos) {
    if (px > TOPE_TONO) errores.push(`${tono} pasa del 30 %`);
  }
  for (let i = 1; i < plan.bandas.length; i++) {
    if (!contrastan(plan.bandas[i]!.hex, plan.bandas[i - 1]!.hex)) errores.push(`poco contraste en ${i}`);
  }
  return errores;
}

export function colorearV3(params: {
  id: string;
  analisis: Analisis;
  plan: PlanCintas;
  coloresPorMomento?: TonoMadre[][];
}): PlanV3 {
  const rng = rngDeId(`${params.id}:v3`);
  const bandas = params.plan.bandas.map((banda) => ({ ...banda }));
  const sinRelato = historiaSinImagen(params.analisis) && (params.coloresPorMomento ?? []).every((lista) => lista.length === 0);
  const semilla = sinRelato ? tonosSemilla(params.id, rng() < 0.5 ? 5 : 4) : [];
  const razonesTono = new Map<TonoMadre, string>();
  for (const tono of semilla) razonesTono.set(tono, MENSAJE_SIN_IMAGEN);

  const firma = (indice: number): PesoTono[] => {
    const propias = imagenesDe(params.analisis, indice);
    const deTexto = propias === 'sin imagen' ? [] : pesosDe(propias);
    const deMedio = params.coloresPorMomento?.[indice] ?? [];
    let lista = mezclar(deTexto, deMedio, 'un color de la imagen');
    if (lista.length === 0 && !sinRelato) {
      const vecinos = [indice - 1, indice + 1]
        .filter((i) => i >= 0 && i < params.analisis.momentos.length)
        .flatMap((i) => {
          const imgs = imagenesDe(params.analisis, i);
          return imgs === 'sin imagen' ? [] : imgs.map((img) => img.tono);
        });
      lista = mezclar([], vecinos.length > 0 ? vecinos : deMedio, 'un momento vecino');
    }
    if (lista.length === 0) {
      const respaldo = semilla.length > 0 ? semilla : tonosSemilla(`${params.id}:respaldo`, 4);
      lista = respaldo.map((tono) => ({ tono, peso: 1, razon: MENSAJE_SIN_IMAGEN }));
    }
    for (const item of lista) {
      if (!razonesTono.has(item.tono)) razonesTono.set(item.tono, item.razon);
    }
    return lista;
  };

  const momentoDe = (indice: number): number => {
    const banda = bandas[indice];
    if (!banda) return 0;
    if (banda.momento >= 0) return banda.momento;
    for (let i = indice + 1; i < bandas.length; i++) {
      if (bandas[i]!.momento >= 0) return bandas[i]!.momento;
    }
    for (let i = indice - 1; i >= 0; i--) {
      if (bandas[i]!.momento >= 0) return bandas[i]!.momento;
    }
    return 0;
  };

  let previo = '';
  bandas.forEach((banda, indice) => {
    if (banda.clase === 'pausa') return;
    const momento = momentoDe(indice);
    const firmaMomento = firma(momento);
    const total = firmaMomento.reduce((s, item) => s + item.peso, 0) || 1;
    const ticket = rng() * total;
    let acum = 0;
    let elegido = firmaMomento[0]!;
    for (const item of firmaMomento) {
      acum += item.peso;
      if (ticket <= acum) {
        elegido = item;
        break;
      }
    }
    const niveles = nivelesDe(valenciaDe(params.analisis, momento), intensidadDe(params.analisis, momento));
    const nivel = banda.motivo === 'borde' || banda.pleno ? 2 : elegirNivel(niveles, elegido.tono, previo, rng);
    const color = colorMadre(elegido.tono, nivel);
    if (previo && !contrastan(color.hex, previo)) {
      const otro = firmaMomento.find((item) => contrastan(colorMadre(item.tono, nivel).hex, previo));
      if (otro) {
        banda.hex = colorMadre(otro.tono, elegirNivel(niveles, otro.tono, previo, rng)).hex;
        previo = banda.hex;
        return;
      }
    }
    banda.hex = color.hex;
    previo = banda.hex;
  });

  const marca: TonoMadre[] = bandas.map((banda) => (banda.clase === 'pausa' ? 'azul' : tonoDeHex(banda.hex)));

  const pintar = (indice: number, tono: TonoMadre, nivel: NivelPaleta) => {
    const banda = bandas[indice];
    if (!banda) return;
    banda.hex = colorMadre(tono, nivel).hex;
    marca[indice] = tono;
    if (!razonesTono.has(tono)) razonesTono.set(tono, 'para equilibrar la cinta');
  };

  const anchosMarca = () => {
    const mapa = new Map<TonoMadre, number>();
    bandas.forEach((banda, indice) => {
      if (banda.clase === 'pausa') return;
      const tono = marca[indice] ?? 'azul';
      mapa.set(tono, (mapa.get(tono) ?? 0) + banda.ancho);
    });
    return mapa;
  };

  const nivelDe = (indice: number): NivelPaleta =>
    PALETA_MADRE.find((item) => item.hex.toUpperCase() === bandas[indice]?.hex.toUpperCase())?.nivel ?? 3;

  let guard = 0;
  while ([...anchosMarca().keys()].length < 4 && guard < 40) {
    const anchos = anchosMarca();
    const mayor = [...anchos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const falta =
      TONOS_MADRE.find((tono) => !anchos.has(tono) && (semilla.length === 0 || semilla.includes(tono) || guard > 8)) ??
      tonosSemilla(`${params.id}:relleno${guard}`, 1)[0]!;
    const indice = bandas.findIndex((banda, i) => banda.clase !== 'pausa' && banda.motivo !== 'borde' && marca[i] === mayor);
    if (indice < 0) break;
    pintar(indice, falta, nivelDe(indice));
    guard += 1;
  }

  guard = 0;
  while (guard < 120) {
    const anchos = anchosMarca();
    const grande = [...anchos.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!grande || grande[1] <= TOPE_TONO) break;
    const chico = [...TONOS_MADRE]
      .filter((tono) => tono !== grande[0] && (anchos.get(tono) ?? 0) < TOPE_TONO)
      .sort((a, b) => (anchos.get(a) ?? 0) - (anchos.get(b) ?? 0))[0];
    if (!chico) break;
    const indice = bandas.findIndex((banda, i) => banda.clase !== 'pausa' && marca[i] === grande[0]);
    if (indice < 0) break;
    const pieza = bandas[indice]!;
    if (pieza.ancho > TOPE_TONO) {
      const sobra = pieza.ancho - Math.min(TOPE_TONO, pieza.ancho - 8);
      pieza.ancho = pieza.ancho - sobra;
      bandas.splice(indice + 1, 0, { ...pieza, ancho: sobra, hex: colorMadre(chico, nivelDe(indice)).hex });
      marca.splice(indice + 1, 0, chico);
      reponerX(bandas);
    } else {
      pintar(indice, chico, nivelDe(indice));
    }
    guard += 1;
  }

  const contrastaCon = (indice: number, hex: string) => {
    const antes = bandas[indice - 1]?.hex ?? '';
    const despues = bandas[indice + 1]?.hex ?? '';
    if (antes && !contrastan(hex, antes)) return false;
    if (despues && !contrastan(hex, despues)) return false;
    return true;
  };

  for (let i = 0; i < bandas.length; i++) {
    if (bandas[i]!.clase === 'pausa') continue;
    if (i > 0 && contrastan(bandas[i]!.hex, bandas[i - 1]!.hex) && contrastaCon(i, bandas[i]!.hex)) continue;
    let listo = false;
    for (const tono of [marca[i]!, ...TONOS_MADRE]) {
      for (const nivel of [1, 2, 3, 4, 5] as NivelPaleta[]) {
        const hex = colorMadre(tono, nivel).hex;
        if (!contrastaCon(i, hex)) continue;
        pintar(i, tono, nivel);
        listo = true;
        break;
      }
      if (listo) break;
    }
  }

  let silencioPrevio = '';
  for (let i = 0; i < bandas.length; i++) {
    const banda = bandas[i]!;
    if (banda.clase !== 'pausa') continue;
    let base: TonoMadre = marca[i + 1] ?? 'azul';
    for (let j = i - 1; j >= 0; j--) {
      if (bandas[j]!.clase !== 'pausa') {
        base = marca[j] ?? base;
        break;
      }
    }
    const candidatos = [base, ...TONOS_MADRE.filter((tono) => tono !== base)];
    let hex = colorMadre(base, 5).hex;
    for (const tono of candidatos) {
      const prueba = colorMadre(tono, 5).hex;
      if (prueba === silencioPrevio) continue;
      if (!contrastaCon(i, prueba)) continue;
      hex = prueba;
      break;
    }
    banda.hex = hex;
    silencioPrevio = hex;
  }

  const porTono = new Map<TonoMadre, { nombre: string; ancho: number }>();
  for (const banda of bandas) {
    if (banda.clase === 'pausa') continue;
    const tono = tonoDeHex(banda.hex);
    const nombre =
      PALETA_MADRE.find((item) => item.hex.toUpperCase() === banda.hex.toUpperCase())?.nombre ?? colorMadre(tono, 3).nombre;
    const previo = porTono.get(tono);
    if (!previo || banda.ancho > previo.ancho) porTono.set(tono, { nombre, ancho: banda.ancho });
  }
  const razones: RazonColor[] = [...porTono.entries()].map(([tono, info]) => ({
    tono,
    nombre: info.nombre,
    razon: razonesTono.get(tono) ?? MENSAJE_SIN_IMAGEN,
  }));

  return {
    plan: { ...params.plan, bandas },
    razones,
    mensaje: sinRelato ? MENSAJE_SIN_IMAGEN : null,
  };
}
