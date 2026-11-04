/**
 * Color de la ronda 8.
 * El tono sale de los objetos. La luz solo mueve la luminosidad.
 * El ancho sigue la ley de la extensión y la jerarquía de la cinta.
 */
import { PALETA_MADRE, TONOS_MADRE, type NivelPaleta, type TonoMadre } from '@/lib/cintas-v2/paleta-madre';
import { luminancia, luzOklch, medidaHsl, type Emocion } from '@/lib/cintas-v2/palette';
import { rngDeId } from '@/lib/cintas-v2/seed';
import { clasificarLuz, type Analisis, type ImagenMomento } from '@/lib/cintas-v2/understand/schema';
import { ANCHO, type Banda, type PlanCintas } from '@/lib/cintas-v2/compose/layout';
import { MENSAJE_SIN_IMAGEN, colorMadre, tonoCercano, type RazonColor } from '@/lib/cintas-v2/compose/color-v3';

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

type Rol = 'prota' | 'sec' | 'acento';

export type Papel = { tono: TonoMadre; rol: Rol; razon: string; nivel?: NivelPaleta };

const MAX_FRANJA_LUZ = Math.round(ANCHO * 0.1);

function esColorLuminoso(tono: TonoMadre, nivel: NivelPaleta): boolean {
  return tono === 'amarillo' || tono === 'lima' || nivel >= 4;
}

function luzDeTono(bandas: Banda[], marca: Array<Papel | null>, papel: Papel): number {
  const luces: number[] = [];
  bandas.forEach((banda, indice) => {
    if (marca[indice]?.tono === papel.tono && banda.clase !== 'pausa') luces.push(luzOklch(banda.hex));
  });
  if (luces.length === 0) return luzOklch(colorMadre(papel.tono, papel.nivel ?? 3).hex);
  return luces.reduce((suma, valor) => suma + valor, 0) / luces.length;
}

/** 0 es oscuro y puede ser ancho. 1 es luminoso y debe ser chico. */
function pesoLuz(luz: number): number {
  return Math.min(1, Math.max(0, (luz - 0.35) / 0.55));
}

function nivelesPosibles(tope: NivelPaleta): NivelPaleta[] {
  return ([1, 5, 2, 4, 3] as NivelPaleta[]).filter((nivel) => nivel <= tope);
}

export type PlanV8 = {
  plan: PlanCintas;
  razones: RazonColor[];
  protagonista: { tono: TonoMadre; nombre: string; razon: string };
  mensaje: string | null;
};

function clampNivel(n: number): NivelPaleta {
  return Math.min(5, Math.max(1, Math.round(n))) as NivelPaleta;
}

function reponerX(bandas: Banda[]): void {
  let x = 0;
  for (const banda of bandas) {
    banda.x = x;
    x += banda.ancho;
  }
}

function distanciaTono(a: string, b: string): number {
  const ha = medidaHsl(a).h * 360;
  const hb = medidaHsl(b).h * 360;
  return Math.min(Math.abs(ha - hb), 360 - Math.abs(ha - hb));
}

export function separan(a: string, b: string): boolean {
  if (!a || !b || a.toUpperCase() === b.toUpperCase()) return false;
  return distanciaTono(a, b) >= 28 || Math.abs(luminancia(a) - luminancia(b)) >= 24;
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

function nivelCentral(valencia: number): NivelPaleta {
  if (valencia < 0.22) return 1;
  if (valencia < 0.42) return 2;
  if (valencia < 0.62) return 3;
  if (valencia < 0.82) return 4;
  return 5;
}

function esColor(img: ImagenMomento): img is ImagenMomento & { tono: TonoMadre } {
  return Boolean(img.tono) && !img.luz && !clasificarLuz(img.descripcion);
}

function ajusteLuz(analisis: Analisis, indice: number): number {
  const imagenes = analisis.momentos[indice]?.imagenes;
  if (!Array.isArray(imagenes)) return 0;
  let suma = 0;
  for (const img of imagenes) {
    const luz = img.luz ?? clasificarLuz(img.descripcion);
    if (luz === 'sube') suma += img.peso;
    if (luz === 'baja') suma -= img.peso;
  }
  if (suma >= 0.5) return 1;
  if (suma <= -0.5) return -1;
  return 0;
}

function momentoSinColor(analisis: Analisis, indice: number): boolean {
  const imagenes = analisis.momentos[indice]?.imagenes;
  if (!Array.isArray(imagenes)) return true;
  return !imagenes.some((img) => esColor(img));
}

function tonosSemilla(id: string, usados: TonoMadre[], cantidad: number): TonoMadre[] {
  const rng = rngDeId(`${id}:tonos8`);
  const pool = TONOS_MADRE.filter((tono) => !usados.includes(tono));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, cantidad);
}

function papelesDe(params: {
  id: string;
  analisis: Analisis;
  coloresPorMomento?: TonoMadre[][];
  forzarColores?: boolean;
}): { papeles: Papel[]; sinRelato: boolean } {
  const mapa = new Map<TonoMadre, { peso: number; razon: string }>();
  const sumar = (tono: TonoMadre, peso: number, razon: string) => {
    const previo = mapa.get(tono);
    if (!previo) mapa.set(tono, { peso, razon });
    else if (peso > previo.peso) {
      previo.peso += peso;
      previo.razon = razon;
    } else previo.peso += peso;
  };
  for (const momento of params.analisis.momentos) {
    if (!Array.isArray(momento.imagenes)) continue;
    for (const img of momento.imagenes) {
      if (!esColor(img)) continue;
      sumar(img.tono, img.peso, img.descripcion);
    }
  }
  params.analisis.momentos.forEach((_, indice) => {
    const extra = params.coloresPorMomento?.[indice] ?? [];
    if (extra.length === 0) return;
    if (!params.forzarColores && !momentoSinColor(params.analisis, indice)) return;
    for (const tono of extra) sumar(tono, 0.45, 'un color de la imagen');
  });
  const orden = [...mapa.entries()].sort((a, b) => b[1].peso - a[1].peso);
  const sinRelato = orden.length === 0;
  const nSec = orden.length >= 4 ? 3 : 2;
  const nAcc = orden.length >= 6 ? 3 : 2;
  const usados: TonoMadre[] = [];
  const tomar = (rol: Rol, cantidad: number, razonRespaldo: string): Papel[] => {
    const out: Papel[] = [];
    while (out.length < cantidad) {
      const siguiente = orden.find(([tono]) => !usados.includes(tono));
      if (siguiente) {
        usados.push(siguiente[0]);
        out.push({ tono: siguiente[0], rol, razon: siguiente[1].razon });
        continue;
      }
      const semilla = tonosSemilla(params.id, usados, 1)[0];
      if (!semilla) break;
      usados.push(semilla);
      out.push({ tono: semilla, rol, razon: razonRespaldo });
    }
    return out;
  };
  const respaldo = sinRelato ? MENSAJE_SIN_IMAGEN : 'un hilo de contraste';
  const prota = tomar('prota', 1, respaldo)[0] ?? {
    tono: tonosSemilla(params.id, [], 1)[0] ?? 'azul',
    rol: 'prota' as const,
    razon: MENSAJE_SIN_IMAGEN,
  };
  if (!usados.includes(prota.tono)) usados.push(prota.tono);
  return {
    papeles: [prota, ...tomar('sec', nSec, respaldo), ...tomar('acento', nAcc, respaldo)],
    sinRelato,
  };
}

function partirAnchas(bandas: Banda[], rng: () => number): Banda[] {
  const out: Banda[] = [];
  for (const banda of bandas) {
    if (banda.clase === 'pausa' || banda.ancho <= 96) {
      out.push({ ...banda });
      continue;
    }
    let queda = banda.ancho;
    while (queda > 96) {
      const corte = 36 + Math.floor(rng() * 48);
      out.push({ ...banda, ancho: corte });
      queda -= corte;
    }
    out.push({ ...banda, ancho: queda });
  }
  reponerX(out);
  return out;
}

function asignarPapeles(bandas: Banda[], papeles: Papel[], rng: () => number): Array<Papel | null> {
  const prota = papeles.find((p) => p.rol === 'prota')!;
  const secs = papeles.filter((p) => p.rol === 'sec');
  const acentos = papeles.filter((p) => p.rol === 'acento');
  const marca: Array<Papel | null> = bandas.map(() => null);
  const crom = bandas.map((banda, i) => i).filter((i) => bandas[i]!.clase !== 'pausa');
  let siguiente = 0;
  let accTurno = 0;
  let secTurno = 0;
  const hueco = () => 2 + Math.floor(rng() * 3);
  crom.forEach((indice, orden) => {
    const banda = bandas[indice]!;
    const fino = banda.clase === 'hilo' || banda.ancho <= 18;
    if (fino && acentos.length > 0 && orden !== siguiente) {
      marca[indice] = acentos[accTurno % acentos.length]!;
      accTurno += 1;
      return;
    }
    if (orden >= siguiente) {
      marca[indice] = prota;
      siguiente = orden + hueco();
      return;
    }
    const previo = orden > 0 ? marca[crom[orden - 1]!]?.tono : undefined;
    let elegido = secs[secTurno % Math.max(secs.length, 1)];
    if (elegido && elegido.tono === previo) elegido = secs[(secTurno + 1) % secs.length];
    marca[indice] = elegido ?? prota;
    secTurno += 1;
  });
  const cromaticos = () => bandas.map((_, i) => i).filter((i) => bandas[i]!.clase !== 'pausa');
  const asegurar = (papel: Papel) => {
    if (marca.some((item) => item?.tono === papel.tono)) return;
    const donante = cromaticos().find((indice) => {
      const actual = marca[indice];
      if (!actual || actual.rol === 'prota' || actual.tono === papel.tono) return false;
      return marca.filter((item) => item?.tono === actual.tono).length > 1;
    });
    if (donante !== undefined) {
      marca[donante] = papel;
      return;
    }
    const ancho = cromaticos()
      .filter((indice) => marca[indice]?.rol === 'sec')
      .sort((a, b) => bandas[b]!.ancho - bandas[a]!.ancho)[0];
    if (ancho === undefined) return;
    const banda = bandas[ancho]!;
    const mitad = Math.max(8, Math.floor(banda.ancho / 2));
    banda.ancho -= mitad;
    bandas.splice(ancho + 1, 0, { ...banda, ancho: mitad });
    marca.splice(ancho + 1, 0, papel);
  };
  for (const papel of [...secs, ...acentos]) asegurar(papel);
  const protas = () => marca.filter((item) => item?.rol === 'prota').length;
  while (protas() < 4) {
    const donante = cromaticos().find((indice) => {
      const actual = marca[indice];
      if (!actual || actual.rol === 'prota') return false;
      return marca.filter((item) => item?.tono === actual.tono).length > 1;
    });
    if (donante === undefined) break;
    marca[donante] = prota;
  }
  reponerX(bandas);
  return marca;
}

function nivelBase(analisis: Analisis, indice: number, borde: boolean, tope: NivelPaleta = 5): NivelPaleta {
  if (borde) return Math.min(2, tope) as NivelPaleta;
  const momento = indice >= 0 && indice < analisis.momentos.length ? indice : 0;
  return clampNivel(Math.min(tope, nivelCentral(valenciaDe(analisis, momento)) + ajusteLuz(analisis, momento)));
}

function elegirNivel(
  tono: TonoMadre,
  base: NivelPaleta,
  intenso: boolean,
  previo: string,
  siguienteBase: string,
  tope: NivelPaleta = 5
): NivelPaleta {
  const salto = intenso ? [2, 1, 0] : [1, 0, 2];
  const candidatos: NivelPaleta[] = [];
  for (const paso of salto) {
    candidatos.push(clampNivel(Math.min(tope, base - paso)), clampNivel(Math.min(tope, base + paso)));
  }
  for (const nivel of candidatos) {
    const hex = colorMadre(tono, nivel).hex;
    if (previo && !separan(hex, previo)) continue;
    if (siguienteBase && !separan(hex, siguienteBase)) continue;
    return nivel;
  }
  return base;
}

function pintarNiveles(
  bandas: Banda[],
  marca: Array<Papel | null>,
  niveles: NivelPaleta[],
  analisis: Analisis,
  tope: NivelPaleta = 5
): void {
  for (let i = 0; i < bandas.length; i++) {
    const banda = bandas[i]!;
    const papel = marca[i];
    if (!papel || banda.clase === 'pausa') continue;
    const momento = banda.momento >= 0 ? banda.momento : 0;
    const intenso = intensidadDe(analisis, momento) >= 0.62;
    const previo = i > 0 ? bandas[i - 1]!.hex : '';
    niveles[i] = elegirNivel(papel.tono, niveles[i] ?? 3, intenso, previo, '', tope);
    banda.hex = colorMadre(papel.tono, niveles[i]!).hex;
  }
  let silencioPrevio = '';
  for (let i = 0; i < bandas.length; i++) {
    const banda = bandas[i]!;
    if (banda.clase !== 'pausa') continue;
    let tono: TonoMadre = 'azul';
    for (let j = i - 1; j >= 0; j--) {
      if (marca[j]) {
        tono = marca[j]!.tono;
        break;
      }
    }
    const candidatos = [tono, ...TONOS_MADRE.filter((item) => item !== tono)];
    const nivelSilencio: NivelPaleta = tope >= 5 ? 5 : 3;
    let hex = colorMadre(tono, nivelSilencio).hex;
    for (const candidato of candidatos) {
      const prueba = colorMadre(candidato, nivelSilencio).hex;
      if (prueba === silencioPrevio) continue;
      const antes = bandas[i - 1]?.hex ?? '';
      const despues = bandas[i + 1]?.hex ?? '';
      if (antes && !separan(prueba, antes)) continue;
      if (despues && !separan(prueba, despues)) continue;
      hex = prueba;
      break;
    }
    banda.hex = hex;
    silencioPrevio = hex;
  }
}

function repararGris(bandas: Banda[], marca: Array<Papel | null>, niveles: NivelPaleta[], tope: NivelPaleta = 5): void {
  for (let vuelta = 0; vuelta < 4; vuelta++) {
    for (let i = 1; i < bandas.length; i++) {
      if (Math.abs(luminancia(bandas[i]!.hex) - luminancia(bandas[i - 1]!.hex)) >= 22) continue;
      const papel = marca[i];
      if (!papel || bandas[i]!.clase === 'pausa') continue;
      for (const nivel of nivelesPosibles(tope)) {
        const hex = colorMadre(papel.tono, nivel).hex;
        const antes = bandas[i - 1]!.hex;
        const despues = bandas[i + 1]?.hex ?? '';
        if (Math.abs(luminancia(hex) - luminancia(antes)) < 22) continue;
        if (!separan(hex, antes)) continue;
        if (despues && !separan(hex, despues)) continue;
        bandas[i]!.hex = hex;
        niveles[i] = nivel;
        break;
      }
    }
  }
}

function cuota(papel: Papel, luz: number): number {
  const peso = pesoLuz(luz);
  if (papel.rol === 'prota') return 0.25 + (1 - peso) * 0.1;
  if (papel.rol === 'sec') return 0.13 + (1 - peso) * 0.04;
  return Math.min(0.05, 0.04 - peso * 0.01);
}

function franjaMax(papel: Papel): number {
  if (esColorLuminoso(papel.tono, papel.nivel ?? 3)) return MAX_FRANJA_LUZ;
  if (papel.rol === 'prota') return 120;
  if (papel.rol === 'acento') return 36;
  return 160;
}

function escalarAnchos(
  bandas: Banda[],
  marca: Array<Papel | null>,
  niveles: NivelPaleta[],
  papeles: Papel[],
  tope: NivelPaleta = 5
): void {
  const protaPapel = papeles.find((p) => p.rol === 'prota')!;
  for (const papel of papeles.filter((p) => p.rol === 'acento')) {
    const suyas = bandas.map((_, i) => i).filter((i) => marca[i]?.tono === papel.tono && bandas[i]!.clase !== 'pausa');
    for (const indice of suyas.slice(2)) marca[indice] = protaPapel;
  }
  const separador = papeles.find((p) => p.rol === 'acento') ?? papeles.find((p) => p.rol === 'sec') ?? protaPapel;
  let cortes = 0;
  while (marca.filter((item) => item?.tono === protaPapel.tono).length < 4 && cortes < 8) {
    let idx = -1;
    let mejor = 0;
    bandas.forEach((banda, i) => {
      if (marca[i]?.tono === protaPapel.tono && banda.ancho > mejor) {
        mejor = banda.ancho;
        idx = i;
      }
    });
    if (idx < 0 || bandas[idx]!.ancho < 12) break;
    const banda = bandas[idx]!;
    const nivelCorte: NivelPaleta = (niveles[idx] ?? 3) <= 2 ? (tope >= 5 ? 5 : 3) : 1;
    const corte = banda.ancho >= 28 ? 10 : 4;
    const resto = Math.max(8, banda.ancho - corte);
    const izq = Math.max(4, Math.floor(resto / 2));
    const der = Math.max(4, resto - izq);
    banda.ancho = izq;
    const hilo = { ...banda, ancho: corte, clase: 'hilo' as const, hex: colorMadre(separador.tono, nivelCorte).hex };
    bandas.splice(idx + 1, 0, hilo, { ...banda, ancho: der });
    marca.splice(idx + 1, 0, separador, protaPapel);
    niveles.splice(idx + 1, 0, nivelCorte, niveles[idx] ?? 3);
    cortes += 1;
  }
  let cursor = 1;
  while (cursor < bandas.length) {
    const izq = marca[cursor - 1];
    const der = marca[cursor];
    if (!izq || !der || izq.tono !== der.tono || bandas[cursor]!.clase === 'pausa' || bandas[cursor - 1]!.clase === 'pausa') {
      cursor += 1;
      continue;
    }
    const otro = papeles.find((p) => p.tono !== izq.tono);
    if (!otro || bandas[cursor - 1]!.ancho < 14) {
      cursor += 1;
      continue;
    }
    bandas[cursor - 1]!.ancho -= 8;
    const nivel = (niveles[cursor] ?? 3) <= 3 ? 5 : 1;
    bandas.splice(cursor, 0, {
      ...bandas[cursor - 1]!,
      ancho: 8,
      clase: 'hilo',
      hex: colorMadre(otro.tono, nivel).hex,
    });
    marca.splice(cursor, 0, otro);
    niveles.splice(cursor, 0, nivel);
    cursor += 2;
  }
  const pausa = bandas.filter((b) => b.clase === 'pausa').reduce((s, b) => s + b.ancho, 0);
  const cromatico = ANCHO - pausa;
  const grupos = new Map<TonoMadre, Banda[]>();
  bandas.forEach((banda, i) => {
    const papel = marca[i];
    if (!papel || banda.clase === 'pausa') return;
    const lista = grupos.get(papel.tono) ?? [];
    lista.push(banda);
    grupos.set(papel.tono, lista);
  });
  const metas = new Map<TonoMadre, number>();
  for (const papel of papeles) {
    metas.set(papel.tono, Math.round(cuota(papel, luzDeTono(bandas, marca, papel)) * ANCHO));
  }
  let suma = [...metas.values()].reduce((s, n) => s + n, 0);
  const prota = papeles.find((p) => p.rol === 'prota')!;
  const pisoProta = Math.round(0.25 * ANCHO);
  const ajustar = (tono: TonoMadre, px: number) => metas.set(tono, Math.max(8, Math.round(px)));
  const cabeEn = (papel: Papel, px: number) => {
    const techo = Math.round(cuota(papel, luzDeTono(bandas, marca, papel)) * ANCHO);
    if (papel.rol === 'prota') return Math.min(Math.max(techo, pisoProta), Math.max(pisoProta, px));
    if (papel.rol === 'acento') return Math.min(Math.round(0.05 * ANCHO), Math.max(12, px));
    return Math.min(techo, Math.max(Math.round(0.12 * ANCHO), px));
  };
  for (const papel of papeles) ajustar(papel.tono, cabeEn(papel, metas.get(papel.tono) ?? 0));
  suma = [...metas.values()].reduce((s, n) => s + n, 0);
  let guardia = 0;
  while (suma !== cromatico && guardia < 2000) {
    const subir = suma < cromatico;
    const orden = papeles.filter((p) => (subir ? p.rol !== 'acento' : true));
    let movio = false;
    for (const papel of orden) {
      const actual = metas.get(papel.tono) ?? 0;
      const destino = cabeEn(papel, actual + (subir ? 1 : -1));
      if (destino === actual) continue;
      metas.set(papel.tono, destino);
      suma += destino - actual;
      movio = true;
      if (suma === cromatico) break;
    }
    if (!movio) break;
    guardia += 1;
  }
  if (suma > cromatico) {
    const pausas = bandas.filter((b) => b.clase === 'pausa' && b.ancho > 6);
    for (const banda of pausas) {
      if (suma <= cromatico) break;
      const baja = Math.min(banda.ancho - 6, suma - cromatico);
      banda.ancho -= baja;
      suma -= baja;
    }
  }

  for (const [tono, lista] of grupos) {
    const meta = metas.get(tono) ?? lista.reduce((s, b) => s + b.ancho, 0);
    const actual = lista.reduce((s, b) => s + b.ancho, 0) || 1;
    const papelTono = papeles.find((p) => p.tono === tono);
    const tope = papelTono ? franjaMax(papelTono) : 120;
    const anchos = lista.map((b) => Math.max(4, Math.round((b.ancho / actual) * meta)));
    let guard = 0;
    while (anchos.some((n) => n > tope) && guard < 60) {
      const grande = anchos.indexOf(Math.max(...anchos));
      const sobra = anchos[grande]! - tope;
      anchos[grande] = tope;
      const chico = anchos.findIndex((n, i) => i !== grande && n < tope);
      if (chico < 0) break;
      anchos[chico] = anchos[chico]! + sobra;
      guard += 1;
    }
    let drift = meta - anchos.reduce((s, n) => s + n, 0);
    let vueltas = 0;
    while (drift !== 0 && vueltas < meta + 20) {
      const i = drift > 0 ? anchos.findIndex((n) => n < tope) : anchos.findIndex((n) => n > 4);
      if (i < 0) break;
      const paso = drift > 0 ? 1 : -1;
      anchos[i] = anchos[i]! + paso;
      drift -= paso;
      vueltas += 1;
    }
    lista.forEach((banda, i) => {
      banda.ancho = anchos[i]!;
    });
  }
  let crom = bandas.reduce((s, b) => s + b.ancho, 0);
  let guard = 0;
  while (crom !== ANCHO && guard < 2000) {
    const paso = crom < ANCHO ? 1 : -1;
    const candidata = bandas
      .filter((b) => b.clase === 'pausa' && (paso > 0 || b.ancho > 6))
      .sort((a, b) => b.ancho - a.ancho)[0];
    if (!candidata) break;
    candidata.ancho += paso;
    crom += paso;
    guard += 1;
  }
  let guardiaFinal = 0;
  while (bandas.reduce((s, b) => s + b.ancho, 0) !== ANCHO && guardiaFinal < 2000) {
    const totalAhora = bandas.reduce((s, b) => s + b.ancho, 0);
    const paso = totalAhora < ANCHO ? 1 : -1;
    const sumaTono = (tono: TonoMadre) =>
      bandas.reduce((s, banda, i) => s + (marca[i]?.tono === tono && banda.clase !== 'pausa' ? banda.ancho : 0), 0);
    const candidata = bandas
      .map((banda, i) => ({ banda, i }))
      .filter(({ banda, i }) => {
        if (paso < 0) return banda.ancho > 6;
        const papel = marca[i];
        if (!papel || banda.clase === 'pausa') return banda.clase === 'pausa';
        const techo = Math.round(cuota(papel, luzDeTono(bandas, marca, papel)) * ANCHO);
        return sumaTono(papel.tono) < techo && banda.ancho < franjaMax(papel);
      })
      .sort((a, b) => a.banda.ancho - b.banda.ancho)[0];
    if (!candidata) break;
    candidata.banda.ancho += paso;
    guardiaFinal += 1;
  }
  bandas.forEach((banda, i) => {
    const papel = marca[i];
    if (!papel || banda.clase === 'pausa') return;
    banda.hex = colorMadre(papel.tono, niveles[i] ?? 3).hex;
  });
  repararGris(bandas, marca, niveles, tope);
  const posibles = nivelesPosibles(tope);
  const silencioNivel: NivelPaleta = tope >= 5 ? 5 : 3;
  for (let i = 1; i < bandas.length; i++) {
    if (separan(bandas[i]!.hex, bandas[i - 1]!.hex)) continue;
    const izq = marca[i - 1];
    const der = marca[i];
    const nivelesIzq: NivelPaleta[] = izq && bandas[i - 1]!.clase !== 'pausa' ? posibles : [silencioNivel];
    const nivelesDer: NivelPaleta[] = der && bandas[i]!.clase !== 'pausa' ? posibles : [silencioNivel];
    const tonoIzq = izq?.tono ?? tonoCercano(bandas[i - 1]!.hex);
    const tonoDer = der?.tono ?? tonoCercano(bandas[i]!.hex);
    let listo = false;
    for (const ni of nivelesIzq) {
      for (const nd of nivelesDer) {
        const hexI = colorMadre(tonoIzq, ni).hex;
        const hexD = colorMadre(tonoDer, nd).hex;
        if (!separan(hexI, hexD)) continue;
        const antes = bandas[i - 2]?.hex ?? '';
        const despues = bandas[i + 1]?.hex ?? '';
        if (antes && !separan(hexI, antes)) continue;
        if (despues && !separan(hexD, despues)) continue;
        bandas[i - 1]!.hex = hexI;
        bandas[i]!.hex = hexD;
        if (izq) niveles[i - 1] = ni;
        if (der) niveles[i] = nd;
        listo = true;
        break;
      }
      if (listo) break;
    }
    if (listo || separan(bandas[i]!.hex, bandas[i - 1]!.hex)) continue;
    const tercero = marca[i + 1];
    const tonoT = tercero?.tono;
    if (!tonoT || bandas[i + 1]?.clase === 'pausa') continue;
    for (const ni of nivelesIzq) {
      for (const nd of nivelesDer) {
        for (const nt of posibles) {
          const hexI = colorMadre(tonoIzq, ni).hex;
          const hexD = colorMadre(tonoDer, nd).hex;
          const hexT = colorMadre(tonoT, nt).hex;
          if (!separan(hexI, hexD) || !separan(hexD, hexT)) continue;
          const antes = bandas[i - 2]?.hex ?? '';
          const despues = bandas[i + 2]?.hex ?? '';
          if (antes && !separan(hexI, antes)) continue;
          if (despues && !separan(hexT, despues)) continue;
          bandas[i - 1]!.hex = hexI;
          bandas[i]!.hex = hexD;
          bandas[i + 1]!.hex = hexT;
          if (izq) niveles[i - 1] = ni;
          if (der) niveles[i] = nd;
          niveles[i + 1] = nt;
          listo = true;
          break;
        }
        if (listo) break;
      }
      if (listo) break;
    }
  }
  let silencioPrevio = '';
  for (let i = 0; i < bandas.length; i++) {
    if (bandas[i]!.clase !== 'pausa') continue;
    const antes = bandas[i - 1]?.hex ?? '';
    const despues = bandas[i + 1]?.hex ?? '';
    if (antes && separan(bandas[i]!.hex, antes) && (!despues || separan(bandas[i]!.hex, despues)) && bandas[i]!.hex !== silencioPrevio) {
      silencioPrevio = bandas[i]!.hex;
      continue;
    }
    for (const tono of TONOS_MADRE) {
      const hex = colorMadre(tono, silencioNivel).hex;
      if (hex === silencioPrevio) continue;
      if (antes && !separan(hex, antes)) continue;
      if (despues && !separan(hex, despues)) continue;
      bandas[i]!.hex = hex;
      silencioPrevio = hex;
      break;
    }
  }
  reponerX(bandas);
}

function nombreDe(tono: TonoMadre, bandas: Banda[], marca: Array<Papel | null>): string {
  const anchos = new Map<string, number>();
  bandas.forEach((banda, i) => {
    if (marca[i]?.tono !== tono || banda.clase === 'pausa') return;
    anchos.set(banda.hex, (anchos.get(banda.hex) ?? 0) + banda.ancho);
  });
  const hex = [...anchos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return PALETA_MADRE.find((item) => item.hex.toUpperCase() === hex?.toUpperCase())?.nombre ?? colorMadre(tono, 2).nombre;
}

export function ritmoGris(bandas: Banda[]): number {
  if (bandas.length < 2) return 1;
  let cambios = 0;
  for (let i = 1; i < bandas.length; i++) {
    if (Math.abs(luminancia(bandas[i]!.hex) - luminancia(bandas[i - 1]!.hex)) >= 22) cambios += 1;
  }
  return cambios / (bandas.length - 1);
}

export function revisarV8(plan: PlanCintas, protagonista: TonoMadre): string[] {
  const errores: string[] = [];
  const anchos = new Map<TonoMadre, number>();
  for (const banda of plan.bandas) {
    if (banda.clase === 'pausa') continue;
    const exacto = PALETA_MADRE.find((item) => item.hex.toUpperCase() === banda.hex.toUpperCase());
    const tono = exacto?.tono ?? tonoCercano(banda.hex);
    anchos.set(tono, (anchos.get(tono) ?? 0) + banda.ancho);
  }
  const prota = anchos.get(protagonista) ?? 0;
  if (prota < Math.round(0.25 * ANCHO) || prota > Math.round(0.35 * ANCHO)) {
    errores.push(`protagonista ${Math.round((prota / ANCHO) * 100)}%`);
  }
  for (const [tono, px] of anchos) {
    if (tono !== protagonista && px > Math.round(0.2 * ANCHO)) errores.push(`${tono} pasa del 20 %`);
  }
  const acentos = [...anchos.values()].filter((px) => px <= Math.round(0.05 * ANCHO)).length;
  if (anchos.size < 5) errores.push(`solo ${anchos.size} tonos`);
  if (acentos < 2) errores.push(`solo ${acentos} acentos`);
  let corrido = 0;
  let peor = 0;
  for (const banda of plan.bandas) {
    const tono = PALETA_MADRE.find((item) => item.hex.toUpperCase() === banda.hex.toUpperCase())?.tono;
    if (banda.clase !== 'pausa' && tono === protagonista) {
      corrido += banda.ancho;
      peor = Math.max(peor, corrido);
    } else corrido = 0;
  }
  if (peor > Math.round(0.12 * ANCHO)) errores.push('el protagonista quedó en un solo bloque');
  for (let i = 1; i < plan.bandas.length; i++) {
    if (!separan(plan.bandas[i]!.hex, plan.bandas[i - 1]!.hex)) errores.push(`poco contraste en ${i}`);
  }
  if (ritmoGris(plan.bandas) < 0.45) errores.push('grises parejos');
  return errores;
}

function recortarClaros(bandas: Banda[], marca: Array<Papel | null>, niveles: NivelPaleta[], tope: NivelPaleta): void {
  const maxClaro = Math.round(ANCHO * 0.1);
  if (tope < 4) {
    for (let i = 0; i < bandas.length; i++) {
      const actual = PALETA_MADRE.find((item) => item.hex.toUpperCase() === bandas[i]!.hex.toUpperCase());
      if (!actual || actual.nivel < 4) continue;
      const tono = marca[i]?.tono ?? actual.tono;
      bandas[i]!.hex = colorMadre(tono, tope).hex;
      niveles[i] = tope;
    }
  }
  for (let i = 0; i < bandas.length; i++) {
    const actual = PALETA_MADRE.find((item) => item.hex.toUpperCase() === bandas[i]!.hex.toUpperCase());
    if (!actual || actual.nivel < 4 || bandas[i]!.ancho <= maxClaro) continue;
    const tono = marca[i]?.tono ?? actual.tono;
    if (bandas[i]!.clase === 'pausa') {
      const nivelPausa: NivelPaleta = Math.min(3, tope) as NivelPaleta;
      const vecinos = new Set<TonoMadre>();
      for (const lado of [i - 1, i + 1]) {
        if (lado < 0 || lado >= bandas.length) continue;
        const ladoColor = PALETA_MADRE.find((item) => item.hex.toUpperCase() === bandas[lado]!.hex.toUpperCase());
        if (ladoColor) vecinos.add(ladoColor.tono);
      }
      const enCinta = [...new Set(marca.flatMap((papel) => (papel ? [papel.tono] : [])))];
      const opciones = [...enCinta.filter((item) => !vecinos.has(item)), ...TONOS_MADRE.filter((item) => !vecinos.has(item))].filter(
        (item) => !esColorLuminoso(item, nivelPausa),
      );
      let elegido = tono;
      let hex = colorMadre(elegido, nivelPausa).hex;
      for (const candidato of opciones) {
        const prueba = colorMadre(candidato, nivelPausa).hex;
        const izq = bandas[i - 1]?.hex;
        const der = bandas[i + 1]?.hex;
        if (izq && !separan(prueba, izq)) continue;
        if (der && !separan(prueba, der)) continue;
        elegido = candidato;
        hex = prueba;
        break;
      }
      bandas[i]!.hex = hex;
      niveles[i] = nivelPausa;
      const papelPausa = marca[i];
      if (papelPausa) marca[i] = { tono: elegido, rol: papelPausa.rol, razon: papelPausa.razon };
      continue;
    }
    const sobra = bandas[i]!.ancho - maxClaro;
    bandas[i]!.ancho = maxClaro;
    const profundo: NivelPaleta = Math.min(2, tope) as NivelPaleta;
    bandas.splice(i + 1, 0, {
      ...bandas[i]!,
      ancho: sobra,
      clase: bandas[i]!.clase,
      hex: colorMadre(tono, profundo).hex,
    });
    marca.splice(i + 1, 0, marca[i] ?? { tono, rol: 'sec', razon: '' });
    niveles.splice(i + 1, 0, profundo);
  }
  reponerX(bandas);
  for (let i = 1; i < bandas.length; i++) {
    if (separan(bandas[i]!.hex, bandas[i - 1]!.hex)) continue;
    const papel = marca[i];
    if (!papel) continue;
    for (const nivel of nivelesPosibles(tope)) {
      const hex = colorMadre(papel.tono, nivel).hex;
      if (!separan(hex, bandas[i - 1]!.hex)) continue;
      bandas[i]!.hex = hex;
      niveles[i] = nivel;
      break;
    }
  }
}

function partirFranjasLuminosas(
  bandas: Banda[],
  marca: Array<Papel | null>,
  niveles: NivelPaleta[],
  papeles: Papel[],
  tope: NivelPaleta,
): void {
  for (let i = 0; i < bandas.length; i++) {
    const actual = PALETA_MADRE.find((item) => item.hex.toUpperCase() === bandas[i]!.hex.toUpperCase());
    if (!actual || !esColorLuminoso(actual.tono, actual.nivel) || bandas[i]!.ancho <= MAX_FRANJA_LUZ) continue;
    if (bandas[i]!.clase === 'pausa') {
      const nivelPausa: NivelPaleta = Math.min(2, tope) as NivelPaleta;
      const otro = papeles.find((papel) => !esColorLuminoso(papel.tono, papel.nivel ?? 3)) ?? papeles[0];
      if (!otro) continue;
      bandas[i]!.hex = colorMadre(otro.tono, nivelPausa).hex;
      niveles[i] = nivelPausa;
      continue;
    }
    const sobra = bandas[i]!.ancho - MAX_FRANJA_LUZ;
    const hilo = Math.min(8, sobra);
    const resto = sobra - hilo;
    bandas[i]!.ancho = MAX_FRANJA_LUZ;
    const separador = papeles.find((papel) => papel.tono !== actual.tono) ?? papeles[0];
    if (!separador) continue;
    const nivelHilo: NivelPaleta = Math.min(2, tope) as NivelPaleta;
    const marcaActual = marca[i] ?? { tono: actual.tono, rol: 'sec' as const, razon: '' };
    bandas.splice(i + 1, 0, {
      ...bandas[i]!,
      ancho: hilo,
      clase: 'hilo',
      hex: colorMadre(separador.tono, nivelHilo).hex,
    });
    marca.splice(i + 1, 0, { tono: separador.tono, rol: 'acento', razon: separador.razon });
    niveles.splice(i + 1, 0, nivelHilo);
    if (resto > 0) {
      bandas.splice(i + 2, 0, {
        ...bandas[i]!,
        ancho: resto,
        clase: bandas[i]!.clase === 'hilo' ? 'fina' : bandas[i]!.clase,
        hex: colorMadre(actual.tono, actual.nivel).hex,
      });
      marca.splice(i + 2, 0, marcaActual);
      niveles.splice(i + 2, 0, actual.nivel);
    }
  }
  reponerX(bandas);
}

export function colorearConPapeles(params: {
  id: string;
  analisis: Analisis;
  plan: PlanCintas;
  papeles: Papel[];
  sinRelato: boolean;
  tope?: NivelPaleta;
  clarosChicos?: boolean;
}): PlanV8 {
  const tope = params.tope ?? 5;
  const rng = rngDeId(`${params.id}:v8`);
  const bandas = partirAnchas(params.plan.bandas, rng);
  const marca = asignarPapeles(bandas, params.papeles, rng);
  const niveles: NivelPaleta[] = bandas.map((banda) =>
    nivelBase(params.analisis, banda.momento, banda.motivo === 'borde' || Boolean(banda.pleno), tope)
  );
  for (let i = 0; i < bandas.length; i++) {
    const papel = marca[i];
    if (!papel) continue;
    bandas[i]!.hex = colorMadre(papel.tono, Math.min(tope, niveles[i]!) as NivelPaleta).hex;
  }
  pintarNiveles(bandas, marca, niveles, params.analisis, tope);
  repararGris(bandas, marca, niveles, tope);
  escalarAnchos(bandas, marca, niveles, params.papeles, tope);
  if (params.clarosChicos) recortarClaros(bandas, marca, niveles, tope);
  partirFranjasLuminosas(bandas, marca, niveles, params.papeles, tope);
  const prota = params.papeles.find((p) => p.rol === 'prota')!;
  const razones: RazonColor[] = params.papeles.map((papel) => ({
    tono: papel.tono,
    nombre: nombreDe(papel.tono, bandas, marca),
    razon: papel.razon,
  }));
  return {
    plan: { ...params.plan, bandas },
    razones,
    protagonista: { tono: prota.tono, nombre: nombreDe(prota.tono, bandas, marca), razon: prota.razon },
    mensaje: params.sinRelato ? MENSAJE_SIN_IMAGEN : null,
  };
}

export function colorearV8(params: {
  id: string;
  analisis: Analisis;
  plan: PlanCintas;
  coloresPorMomento?: TonoMadre[][];
  forzarColores?: boolean;
}): PlanV8 {
  const { papeles, sinRelato } = papelesDe(params);
  return colorearConPapeles({ ...params, papeles, sinRelato });
}
