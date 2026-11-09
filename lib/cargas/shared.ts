/**
 * «Subir archivos» del admin: lectura de JSON y CSV, reconocimiento del tipo y validación de campos.
 * Sin dependencias de servidor: lo usan la pestaña del admin y las rutas /api/admin/cargas.
 */
import { MAX_TITULO, stripHtml } from '@/lib/api/input-validation';
import { RESPUESTA_TEXT_MAX } from '@/lib/respuestas/constants';
import { ME_PREGUNTA_MAX } from '@/lib/me-pregunto/shared';
import { SUBIR_TEXT_MAX_CHARS } from '@/lib/subir-limits';
import { TEMAS, temasGuardados } from '@/lib/temas';

export const CARGAS_COLLECTION = 'cargas_contenido';
export const CARGA_MAX_FILAS = 500;

export const TIPOS_CARGA = ['historia', 'respuesta', 'pregunta'] as const;
export type TipoCarga = (typeof TIPOS_CARGA)[number];
export type EstadoCarga = 'revision' | 'publicando' | 'publicado' | 'descartado';
export type IdiomaCarga = 'es' | 'pt' | 'en';

export type DatosCarga = {
  titulo: string;
  texto: string;
  /** Respuestas: la pregunta a la que responde (su texto o su identificador). */
  pregunta: string;
  alias: string;
  ciudad: string;
  pais: string;
  temas: string[];
  idioma: IdiomaCarga;
};

export type FilaNormalizada = {
  tipo: TipoCarga | null;
  datos: DatosCarga;
  /** Temas escritos en el archivo que no existen en AlmaMundi. */
  temasDesconocidos: string[];
  /** Idioma escrito en el archivo que no se reconoce. */
  idiomaDesconocido: string;
};

export const ETIQUETA_TIPO: Record<TipoCarga, string> = {
  historia: 'Historia',
  respuesta: 'Respuesta',
  pregunta: 'Pregunta',
};

export const LIMITES = {
  tituloMax: MAX_TITULO,
  historiaMax: SUBIR_TEXT_MAX_CHARS,
  respuestaMax: RESPUESTA_TEXT_MAX,
  preguntaMin: 8,
  preguntaMax: ME_PREGUNTA_MAX,
  aliasHistoriaMax: 120,
  aliasMax: 80,
  ciudadMax: 120,
  paisMax: 120,
} as const;

/** Minúsculas, sin tildes, sin signos y con espacios simples. Sirve para comparar textos. */
export function normalizarTexto(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();
}

function clave(value: string): string {
  return normalizarTexto(value).replace(/\s+/g, '');
}

function limpiarLinea(value: unknown): string {
  if (value == null) return '';
  return stripHtml(String(value)).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function limpiarTexto(value: unknown): string {
  if (value == null) return '';
  return stripHtml(String(value))
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const CAMPOS: Record<keyof Omit<DatosCarga, 'temas' | 'idioma'> | 'tipo' | 'temas' | 'idioma', string[]> = {
  tipo: ['tipo', 'type', 'clase', 'tipocontenido', 'contenidotipo', 'categoria'],
  titulo: ['titulo', 'title', 'storytitle', 'titulohistoria', 'nombrehistoria', 'nombredelahistoria'],
  texto: ['texto', 'text', 'textbody', 'historia', 'relato', 'contenido', 'respuesta', 'answer', 'body', 'cuerpo'],
  pregunta: ['pregunta', 'question', 'questionid', 'preguntaid', 'idpregunta', 'questiontext', 'textopregunta'],
  alias: ['alias', 'nombre', 'name', 'autor', 'autora', 'author', 'authorname', 'seudonimo', 'persona', 'quiencuenta'],
  ciudad: ['ciudad', 'city', 'placelabel', 'lugar', 'localidad', 'comuna'],
  pais: ['pais', 'country', 'countrylabel', 'nacion'],
  temas: ['temas', 'tema', 'themes', 'theme', 'topics', 'temasids'],
  idioma: ['idioma', 'locale', 'lang', 'language', 'lengua'],
};

function campo(row: Record<string, unknown>, nombre: keyof typeof CAMPOS): unknown {
  const opciones = CAMPOS[nombre];
  for (const [key, value] of Object.entries(row)) {
    if (opciones.includes(clave(key)) && value != null && String(value).trim() !== '') return value;
  }
  return undefined;
}

export function tipoDesde(value: unknown): TipoCarga | null {
  if (typeof value !== 'string') return null;
  const v = clave(value);
  if (['historia', 'historias', 'story', 'stories', 'relato', 'relatos'].includes(v)) return 'historia';
  if (['respuesta', 'respuestas', 'answer', 'answers', 'respuestaseditoriales'].includes(v)) return 'respuesta';
  if (['pregunta', 'preguntas', 'question', 'questions'].includes(v)) return 'pregunta';
  return null;
}

function idiomaDesde(value: unknown): { idioma: IdiomaCarga; desconocido: string } {
  const raw = limpiarLinea(value);
  if (!raw) return { idioma: 'es', desconocido: '' };
  const v = clave(raw);
  if (['es', 'esp', 'espanol', 'castellano', 'spanish', 'escl', 'esmx'].includes(v)) return { idioma: 'es', desconocido: '' };
  if (['pt', 'portugues', 'portuguese', 'ptbr'].includes(v)) return { idioma: 'pt', desconocido: '' };
  if (['en', 'ingles', 'english', 'enus', 'engb'].includes(v)) return { idioma: 'en', desconocido: '' };
  return { idioma: 'es', desconocido: raw };
}

const TEMA_POR_CLAVE = new Map<string, string>();
for (const tema of TEMAS) {
  for (const label of [tema.id, tema.es, tema.pt, tema.en]) TEMA_POR_CLAVE.set(clave(label), tema.id);
}

/** Acepta ids o nombres de temas (en español, portugués o inglés), en lista o separados por , ; | / */
export function temasDesde(value: unknown): { temas: string[]; desconocidos: string[] } {
  const partes = Array.isArray(value)
    ? value.map((item) => limpiarLinea(item))
    : limpiarLinea(value).split(/[,;|/]+/).map((item) => item.trim());
  const temas: string[] = [];
  const desconocidos: string[] = [];
  for (const parte of partes) {
    if (!parte) continue;
    const id = TEMA_POR_CLAVE.get(clave(parte));
    if (!id) desconocidos.push(parte);
    else if (!temas.includes(id)) temas.push(id);
  }
  return { temas, desconocidos };
}

/** Convierte una fila del archivo (cualquier nombre de columna aceptado) en datos de AlmaMundi. */
export function normalizarFila(row: Record<string, unknown>, tipoForzado?: TipoCarga | null): FilaNormalizada {
  const tipoEscrito = tipoDesde(campo(row, 'tipo'));
  const titulo = limpiarLinea(campo(row, 'titulo'));
  let texto = limpiarTexto(campo(row, 'texto'));
  const preguntaRaw = limpiarLinea(campo(row, 'pregunta'));
  let tipo: TipoCarga | null = tipoForzado ?? tipoEscrito;
  if (!tipo) {
    if (titulo) tipo = 'historia';
    else if (preguntaRaw && texto) tipo = 'respuesta';
    else if (preguntaRaw) tipo = 'pregunta';
  }
  let pregunta = preguntaRaw;
  if (tipo === 'pregunta') {
    if (!texto) texto = preguntaRaw;
    pregunta = '';
  }
  const { temas, desconocidos } = temasDesde(campo(row, 'temas'));
  const { idioma, desconocido } = idiomaDesde(campo(row, 'idioma'));
  return {
    tipo,
    datos: {
      titulo: tipo === 'historia' ? titulo : '',
      texto,
      pregunta: tipo === 'respuesta' ? pregunta : '',
      alias: limpiarLinea(campo(row, 'alias')),
      ciudad: limpiarLinea(campo(row, 'ciudad')),
      pais: limpiarLinea(campo(row, 'pais')),
      temas: tipo === 'pregunta' ? [] : temas,
      idioma,
    },
    temasDesconocidos: tipo === 'pregunta' ? [] : desconocidos,
    idiomaDesconocido: desconocido,
  };
}

/** Datos corregidos desde el admin: mismos límites y limpieza que al leer el archivo. */
export function normalizarEdicion(tipo: TipoCarga, input: Partial<Record<keyof DatosCarga, unknown>>): DatosCarga {
  const temas = temasGuardados(input.temas);
  const idioma = input.idioma === 'pt' || input.idioma === 'en' ? input.idioma : 'es';
  return {
    titulo: tipo === 'historia' ? limpiarLinea(input.titulo) : '',
    texto: tipo === 'pregunta' ? limpiarLinea(input.texto) : limpiarTexto(input.texto),
    pregunta: tipo === 'respuesta' ? limpiarLinea(input.pregunta) : '',
    alias: limpiarLinea(input.alias),
    ciudad: limpiarLinea(input.ciudad),
    pais: limpiarLinea(input.pais),
    temas: tipo === 'pregunta' ? [] : temas?.temas ?? (Array.isArray(input.temas) ? temasDesde(input.temas).temas.slice(0, 3) : []),
    idioma,
  };
}

/** Errores de campos (sin consultar la base). Las preguntas y los duplicados se revisan en el servidor. */
export function erroresDeCampos(
  tipo: TipoCarga | null,
  datos: DatosCarga,
  temasDesconocidos: string[] = [],
  idiomaDesconocido = ''
): string[] {
  const errores: string[] = [];
  if (!tipo) {
    errores.push('No reconocemos el tipo. Indica «historia», «respuesta» o «pregunta» en la columna tipo.');
    return errores;
  }
  const largo = (valor: string, nombre: string, min: number, max: number) => {
    if (!valor || min <= 1) {
      if (!valor) errores.push(`Falta ${nombre}.`);
    } else if (valor.length < min) errores.push(`${nombre[0].toUpperCase()}${nombre.slice(1)}: mínimo ${min} caracteres.`);
    if (!valor) return;
    if (valor.length > max) errores.push(`${nombre[0].toUpperCase()}${nombre.slice(1)}: máximo ${max} caracteres (tiene ${valor.length}).`);
  };
  if (tipo === 'historia') {
    largo(datos.titulo, 'el título', 2, LIMITES.tituloMax);
    largo(datos.texto, 'el texto de la historia', 1, LIMITES.historiaMax);
    largo(datos.alias, 'el nombre de quien cuenta', 2, LIMITES.aliasHistoriaMax);
  } else if (tipo === 'respuesta') {
    if (!datos.pregunta) errores.push('Falta la pregunta a la que responde.');
    largo(datos.texto, 'el texto de la respuesta', 1, LIMITES.respuestaMax);
    largo(datos.alias, 'el nombre de quien responde', 2, LIMITES.aliasMax);
  } else {
    largo(datos.texto, 'la pregunta', LIMITES.preguntaMin, LIMITES.preguntaMax);
    largo(datos.alias, 'el nombre de quien pregunta', 2, LIMITES.aliasMax);
  }
  largo(datos.ciudad, 'la ciudad', 1, LIMITES.ciudadMax);
  largo(datos.pais, 'el país', 2, LIMITES.paisMax);
  // Los temas ya no se piden en el admin (Ana, 9 nov 2026): si vienen en el archivo se guardan, si no, nada.
  void temasDesconocidos;
  if (idiomaDesconocido) errores.push(`Idioma no reconocido: «${idiomaDesconocido}». Usa es, pt o en.`);
  return errores;
}

/** Huella para detectar duplicados: el mismo texto (y, en respuestas, la misma pregunta). */
export function huellaContenido(tipo: TipoCarga, texto: string, questionId = ''): string {
  const base = normalizarTexto(texto);
  if (!base) return '';
  return tipo === 'respuesta' ? `${questionId}|${base}` : `${tipo}|${base}`;
}

/* ───────────── Lectura de archivos ───────────── */

/** CSV con comillas, saltos de línea dentro de comillas y separador «,» o «;» (Excel en español). */
export function leerCsv(texto: string): Record<string, string>[] {
  const limpio = texto.replace(/^﻿/, '');
  const primeraLinea = limpio.split(/\r?\n/, 1)[0] ?? '';
  const contar = (sep: string) => primeraLinea.split(sep).length - 1;
  const sep = contar(';') > contar(',') ? ';' : contar('\t') > contar(',') ? '\t' : ',';
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = '';
  let comillas = false;
  for (let i = 0; i < limpio.length; i += 1) {
    const c = limpio[i];
    if (comillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') {
          celda += '"';
          i += 1;
        } else comillas = false;
      } else celda += c;
      continue;
    }
    if (c === '"') comillas = true;
    else if (c === sep) {
      fila.push(celda);
      celda = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && limpio[i + 1] === '\n') i += 1;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = '';
    } else celda += c;
  }
  if (celda !== '' || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  const noVacias = filas.filter((f) => f.some((v) => v.trim() !== ''));
  if (noVacias.length < 2) return [];
  const encabezados = noVacias[0].map((h) => h.trim());
  return noVacias.slice(1).map((f) => {
    const obj: Record<string, string> = {};
    encabezados.forEach((h, idx) => {
      if (h) obj[h] = (f[idx] ?? '').trim();
    });
    return obj;
  });
}

export type FilaArchivo = { fila: number; tipo: TipoCarga | null; datos: Record<string, unknown> };

/**
 * JSON aceptados: una lista de objetos; { items: [...] } (incluye el formato del PR #4);
 * o { historias: [...], respuestas: [...], preguntas: [...] }.
 */
export function leerJson(texto: string): FilaArchivo[] {
  const data = JSON.parse(texto.replace(/^﻿/, '')) as unknown;
  const salida: FilaArchivo[] = [];
  const agregar = (lista: unknown[], tipo: TipoCarga | null) => {
    for (const item of lista) {
      salida.push({
        fila: salida.length + 1,
        tipo,
        datos: item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>) : {},
      });
    }
  };
  if (Array.isArray(data)) {
    agregar(data, null);
    return salida;
  }
  if (!data || typeof data !== 'object') throw new Error('json');
  const obj = data as Record<string, unknown>;
  let alguno = false;
  for (const [key, value] of Object.entries(obj)) {
    if (!Array.isArray(value)) continue;
    const tipo = key === 'items' ? tipoDesde(obj.tipo) : tipoDesde(key);
    if (key !== 'items' && !tipo) continue;
    agregar(value, tipo);
    alguno = true;
  }
  if (!alguno) throw new Error('json');
  return salida;
}

/** Lee un archivo del admin (JSON o CSV) y devuelve sus filas. */
export function leerArchivo(nombre: string, texto: string): FilaArchivo[] {
  const lower = nombre.toLowerCase();
  if (lower.endsWith('.json')) return leerJson(texto);
  if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')) {
    return leerCsv(texto).map((datos, i) => ({ fila: i + 2, tipo: null, datos }));
  }
  throw new Error('formato');
}
