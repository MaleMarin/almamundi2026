import sharp from 'sharp';
import type { Analisis } from '@/lib/cintas-v2/understand/schema';
import type { Modo } from '@/lib/cintas-v2/compose/layout';
import type { OrigenAnalisis } from '@/lib/cintas-v2/understand/analyze';
import { escapeXml } from '@/scripts/cintas-v2/footer';

export function resumenAnalisis(analisis: Analisis, modo: Modo, origen: OrigenAnalisis, detalle: string | null): string {
  const a = analisis.animo;
  const emociones = [...analisis.emociones]
    .sort((x, y) => y.peso - x.peso)
    .slice(0, 3)
    .map((e) => `${e.emocion} ${e.peso.toFixed(2)}`)
    .join(', ');
  const momentos = analisis.momentos.map((m) => m.resumen).join(' · ');
  const avisos = [
    analisis.avisos.contenidoSensible ? 'contenido sensible' : '',
    analisis.avisos.violencia ? 'violencia' : '',
    analisis.avisos.menores ? 'menores' : '',
  ].filter(Boolean);
  const lineaAvisos = avisos.length > 0 ? `Avisos: ${avisos.join(', ')}.` : 'Avisos: ninguno.';
  const lineaOrigen =
    origen === 'modelo' ? 'Análisis del modelo.' : `Respaldo del diccionario${detalle ? `: ${detalle}` : '.'}`;
  return `Ánimo: valencia ${a.valencia.toFixed(2)}, activación ${a.activacion.toFixed(2)}, dominancia ${a.dominancia.toFixed(2)}. Modo ${modo}. Emociones: ${emociones}. Momentos: ${momentos}. ${lineaAvisos} ${lineaOrigen}`;
}

function envolver(texto: string, max: number, lineasMax: number): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of palabras) {
    const siguiente = actual ? `${actual} ${palabra}` : palabra;
    if (siguiente.length > max && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = siguiente;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.slice(0, lineasMax);
}

function svgTexto(lineas: string[], ancho: number, alto: number, size: number, color = '#3E3A32'): Buffer {
  const fuente = 'Helvetica, Arial, sans-serif';
  const textos = lineas
    .map((linea, i) => `<text x="0" y="${size + i * (size + 6)}" font-size="${size}" fill="${color}" font-family="${fuente}">${escapeXml(linea)}</text>`)
    .join('');
  return Buffer.from(`<svg width="${ancho}" height="${alto}" xmlns="http://www.w3.org/2000/svg">${textos}</svg>`);
}

export async function hojaPorCaso(params: {
  titulo: string;
  actual: Buffer;
  v2: Buffer;
  resumen: string;
}): Promise<Buffer> {
  const margen = 40;
  const hueco = 28;
  const img = 1080;
  const ancho = margen + img + hueco + img + margen;
  const tituloAlto = 56;
  const etiquetaAlto = 28;
  const lineas = envolver(params.resumen, 118, 5);
  const captionAlto = 16 + lineas.length * 24;
  const alto = margen + tituloAlto + etiquetaAlto + img + 20 + captionAlto + margen;
  const base = sharp({
    create: { width: ancho, height: alto, channels: 3, background: '#F7F4EE' },
  });
  const titulo = svgTexto([params.titulo], ancho - margen * 2, tituloAlto, 28);
  const etiquetas = svgTexto(['Algoritmo actual'], 400, 24, 16, '#8A8A7A');
  const etiquetasV2 = svgTexto(['Cintas v2'], 400, 24, 16, '#8A8A7A');
  const caption = svgTexto(lineas, ancho - margen * 2, captionAlto, 18);
  const yImg = margen + tituloAlto + etiquetaAlto;
  return base
    .composite([
      { input: titulo, top: margen, left: margen },
      { input: etiquetas, top: margen + tituloAlto, left: margen },
      { input: etiquetasV2, top: margen + tituloAlto, left: margen + img + hueco },
      { input: params.actual, top: yImg, left: margen },
      { input: params.v2, top: yImg, left: margen + img + hueco },
      { input: caption, top: yImg + img + 16, left: margen },
    ])
    .png()
    .toBuffer();
}

export async function hojaTodas(
  piezas: Array<{ titulo: string; modo: string; png: Buffer }>
): Promise<Buffer> {
  const cols = 3;
  const margen = 36;
  const hueco = 24;
  const img = 1080;
  const pie = 64;
  const filas = Math.ceil(piezas.length / cols);
  const ancho = margen * 2 + cols * img + (cols - 1) * hueco;
  const alto = margen + 48 + filas * (img + pie) + (filas - 1) * hueco;
  const capas: sharp.OverlayOptions[] = [
    { input: svgTexto(['Cintas v2, todas juntas'], 800, 40, 28), top: margen, left: margen },
  ];
  for (let i = 0; i < piezas.length; i++) {
    const col = i % cols;
    const fila = Math.floor(i / cols);
    const x = margen + col * (img + hueco);
    const y = margen + 48 + fila * (img + pie + hueco);
    const pieza = piezas[i]!;
    capas.push({ input: pieza.png, top: y, left: x });
    capas.push({
      input: svgTexto(envolver(`${pieza.titulo} · ${pieza.modo}`, 42, 2), img, pie - 8, 18),
      top: y + img + 8,
      left: x,
    });
  }
  return sharp({ create: { width: ancho, height: alto, channels: 3, background: '#F7F4EE' } })
    .composite(capas)
    .png()
    .toBuffer();
}
