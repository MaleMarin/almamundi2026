/**
 * Ronda 10. El protagonista sale de un color propio y central.
 * Si la historia no lo tiene, usa una paleta de respaldo de su casilla.
 */
import type { NivelPaleta, TonoMadre } from '@/lib/cintas-v2/paleta-madre';
import { MENSAJE_SIN_IMAGEN, type RazonColor } from '@/lib/cintas-v2/compose/color-v3';
import { colorearConPapeles, type Papel, type PlanV8 } from '@/lib/cintas-v2/compose/color-v8';
import { elegirPaletaRespaldo } from '@/lib/cintas-v2/compose/paletas-respaldo';
import type { PlanCintas } from '@/lib/cintas-v2/compose/layout';
import {
  clasificarLuz,
  colorPropio,
  esPaisajeDeFondo,
  type Analisis,
  type ImagenMomento,
} from '@/lib/cintas-v2/understand/schema';

const VALENCIA_BAJA = 0.4;

function valenciaMedia(analisis: Analisis): number {
  const dichas = analisis.momentos
    .map((momento) => momento.valencia)
    .filter((valor): valor is number => typeof valor === 'number');
  if (dichas.length === 0) return analisis.animo.valencia;
  return dichas.reduce((suma, valor) => suma + valor, 0) / dichas.length;
}

function conColor(img: ImagenMomento): img is ImagenMomento & { tono: TonoMadre } {
  if (!img.tono || img.luz || clasificarLuz(img.descripcion)) return false;
  return colorPropio(img.descripcion) === img.tono;
}

export function colorearV9(params: {
  id: string;
  analisis: Analisis;
  plan: PlanCintas;
  coloresPorMomento?: TonoMadre[][];
  forzarColores?: boolean;
  evitar?: TonoMadre[];
}): PlanV8 & { paleta: string | null } {
  const luz = valenciaMedia(params.analisis);
  const intensidad = params.analisis.animo.activacion;
  const paleta = elegirPaletaRespaldo(luz, intensidad, params.id);
  const candidatos: Array<{ tono: TonoMadre; importancia: number; razon: string; paisaje: boolean }> = [];
  for (const momento of params.analisis.momentos) {
    if (!Array.isArray(momento.imagenes)) continue;
    for (const img of momento.imagenes) {
      if (!conColor(img)) continue;
      const paisaje = esPaisajeDeFondo(img.descripcion);
      const importancia = paisaje && (img.importancia ?? 0) < 0.8 ? Math.min(img.importancia ?? 0, 0.4) : (img.importancia ?? img.peso);
      candidatos.push({ tono: img.tono, importancia, razon: img.descripcion, paisaje });
    }
  }
  params.analisis.momentos.forEach((_, indice) => {
    const extra = params.coloresPorMomento?.[indice] ?? [];
    if (extra.length === 0) return;
    const sinTexto = !params.analisis.momentos[indice]?.imagenes || !Array.isArray(params.analisis.momentos[indice]?.imagenes)
      ? true
      : !(params.analisis.momentos[indice]?.imagenes as ImagenMomento[]).some((img) => conColor(img));
    if (!params.forzarColores && !sinTexto) return;
    for (const tono of extra) {
      candidatos.push({ tono, importancia: 0.35, razon: 'un color de la imagen', paisaje: false });
    }
  });

  const centrales = candidatos
    .filter((item) => !item.paisaje || item.importancia >= 0.75)
    .sort((a, b) => b.importancia - a.importancia);
  const sinRelato = centrales.length === 0;
  const usados = new Set<TonoMadre>();
  const papeles: Papel[] = [];
  const tomar = (tono: TonoMadre, rol: Papel['rol'], razon: string, nivel?: NivelPaleta) => {
    if (usados.has(tono)) return;
    if (rol !== 'prota' && params.evitar?.includes(tono)) return;
    usados.add(tono);
    papeles.push({ tono, rol, razon, nivel });
  };

  if (!sinRelato) {
    const prota = centrales[0]!;
    tomar(prota.tono, 'prota', prota.razon);
    for (const item of centrales.slice(1)) {
      if (papeles.filter((p) => p.rol === 'sec').length >= 3) break;
      tomar(item.tono, 'sec', item.razon);
    }
    for (const item of centrales.slice(1)) {
      if (papeles.filter((p) => p.rol === 'acento').length >= 3) break;
      tomar(item.tono, 'acento', item.razon);
    }
  }

  for (const color of paleta.colores) {
    if (papeles.some((p) => p.rol === 'prota') && color.rol === 'prota') continue;
    const cupo = color.rol === 'prota' ? 1 : 3;
    if (papeles.filter((p) => p.rol === color.rol).length >= cupo) continue;
    tomar(color.tono, color.rol, MENSAJE_SIN_IMAGEN, color.nivel);
  }
  if (!papeles.some((p) => p.rol === 'prota')) {
    const primero = paleta.colores.find((color) => color.rol === 'prota' && !params.evitar?.includes(color.tono)) ?? paleta.colores[0]!;
    papeles.unshift({ tono: primero.tono, rol: 'prota', razon: MENSAJE_SIN_IMAGEN, nivel: primero.nivel });
    usados.add(primero.tono);
  }

  const vistos = new Set<string>();
  const unicos = papeles.filter((papel) => {
    const clave = `${papel.rol}:${papel.tono}`;
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
  const tope: NivelPaleta = luz < VALENCIA_BAJA ? 3 : 5;
  const cinta = colorearConPapeles({
    id: params.id,
    analisis: params.analisis,
    plan: params.plan,
    papeles: unicos,
    sinRelato,
    tope,
    clarosChicos: true,
  });
  return { ...cinta, paleta: paleta.nombre };
}

export type { RazonColor };
