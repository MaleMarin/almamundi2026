import OpenAI from 'openai';
import type { AlmaLocale } from '@/lib/i18n/locale';
import { MODELO_LENGUAJE, costoLenguajeUsd } from '@/lib/cintas-v2/modelos';
import { analisisDesdeDiccionario } from '@/lib/cintas-v2/understand/lexicon-fallback';
import {
  AnalisisSchema,
  erroresDe,
  normalizarAnalisis,
  type Analisis,
} from '@/lib/cintas-v2/understand/schema';

/**
 * El análisis es privado.
 * Solo sirve para componer las cintas y para la curaduría en /admin.
 * Nunca se publica ni se muestra en el sitio.
 * No guarda nombres propios, direcciones ni datos identificables.
 */
export const ANALISIS_PRIVADO = true;
export const PRIVACIDAD_ANALISIS = 1;

const SISTEMA = `Eres el análisis de relatos de AlmaMundi. Lees el sentido, no un diccionario de palabras sueltas.
Devuelves únicamente un JSON válido, sin markdown.
El análisis es privado: solo compone las cintas y la curaduría en /admin. Nunca es público.

Forma:
{
  "animo": { "valencia": 0, "activacion": 0, "dominancia": 0 },
  "emociones": [{ "emocion": "calma", "peso": 0 }],
  "momentos": [{ "resumen": "hasta ocho palabras", "emocion": "calma", "intensidad": 0 }],
  "palabrasClave": [{ "palabra": "ejemplo", "peso": 0 }],
  "idioma": "es",
  "avisos": { "contenidoSensible": false, "violencia": false, "menores": false }
}

Reglas:
- Los ceros del esquema son la forma, no un valor sugerido. Estima cada número entre 0 y 1 a partir del texto.
- Valencia: 0 desagradable, 1 agradable. Activación: 0 calma, 1 intensidad. Dominancia: 0 vulnerabilidad, 1 firmeza.
- Emociones permitidas, solo las presentes: nostalgia, alegría, tristeza, esperanza, amor, miedo, rabia, calma, orgullo, gratitud, pérdida, asombro. Peso de 0 a 1.
- Momentos en el orden del relato. Resumen de máximo 8 palabras. Entre 1 y 8 momentos.
- La negación invierte el sentido. «No estaba triste» no es tristeza.
- La metáfora vale por la emoción que nombra. «Se me apretó el pecho de alegría» es alegría.
- La ironía se lee por el contexto. Un elogio en un párrafo desolado no es alegría.
- Palabras clave: las que sostienen el sentido, no artículos ni muletillas.
- Idioma: es, pt, en u otro.
- Avisos solo marcan, no bloquean. contenidoSensible, violencia y menores en true solo si el texto lo sostiene. Un recuerdo familiar sin daño no es violencia.
- Privacidad: nunca incluyas nombres propios de personas, apodos, iniciales, direcciones, teléfonos ni ningún dato que identifique a alguien.
- Los momentos van en términos generales. Por ejemplo: «una visita familiar que no llega», «preocupación por la salud de un familiar».
- Salud, dinero, conflictos y menores se nombran solo en términos generales, sin cifras, diagnósticos, montos ni detalles.
- No uses parentescos concretos. Di «un familiar».
- Las palabras clave tampoco llevan nombres ni datos identificables.
- Si el texto no narra nada, un solo momento, pesos bajos e idioma otro.`;

export type OrigenAnalisis = 'modelo' | 'respaldo-diccionario';

export type ResultadoAnalisis = {
  analisis: Analisis;
  origen: OrigenAnalisis;
  reintentos: number;
  tokensEntrada: number;
  tokensSalida: number;
  costoUsd: number;
  detalle: string | null;
};

function limpiar(mensaje: string): string {
  return mensaje.replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-***').replace(/Bearer\s+\S+/gi, 'Bearer ***');
}

function tokensDe(usage: unknown): { entrada: number; salida: number } {
  if (!usage || typeof usage !== 'object') return { entrada: 0, salida: 0 };
  const u = usage as Record<string, unknown>;
  const entrada = Number(u.prompt_tokens ?? u.input_tokens ?? 0);
  const salida = Number(u.completion_tokens ?? u.output_tokens ?? 0);
  return {
    entrada: Number.isFinite(entrada) ? entrada : 0,
    salida: Number.isFinite(salida) ? salida : 0,
  };
}

function extraerJson(raw: string): unknown {
  const limpio = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(limpio);
}

async function completar(
  openai: OpenAI,
  modelo: string,
  texto: string,
  correccion?: string
): Promise<{ raw: string; entrada: number; salida: number }> {
  const user = correccion
    ? `El JSON anterior no validó. Errores: ${correccion}\nCorrige y devuelve solo el JSON del relato:\n\n${texto.slice(0, 12000)}`
    : `Analiza este relato y devuelve solo el JSON:\n\n${texto.slice(0, 12000)}`;
  const messages = [
    { role: 'system' as const, content: SISTEMA },
    { role: 'user' as const, content: user },
  ];
  const completion =
    modelo === 'gpt-6.1-sol'
      ? await openai.chat.completions.create({
          model: modelo,
          reasoning_effort: 'medium',
          response_format: { type: 'json_object' },
          max_completion_tokens: 4000,
          messages,
        })
      : await openai.chat.completions.create({
          model: modelo,
          temperature: 0,
          response_format: { type: 'json_object' },
          max_tokens: 900,
          messages,
        });
  const raw = completion.choices[0]?.message?.content?.trim() ?? '';
  const t = tokensDe(completion.usage);
  return { raw, entrada: t.entrada, salida: t.salida };
}

function validar(raw: string): { ok: true; analisis: Analisis } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = extraerJson(raw);
  } catch {
    return { ok: false, error: 'no es JSON' };
  }
  const normal = normalizarAnalisis(parsed);
  const result = AnalisisSchema.safeParse(normal);
  if (!result.success) return { ok: false, error: erroresDe(result.error) };
  const privacidad = revisarPrivacidad(result.data);
  if (privacidad) return { ok: false, error: privacidad };
  return { ok: true, analisis: result.data };
}

const PRIVADO =
  'incluye nombres, parentescos, direcciones o detalles de salud, dinero, conflictos o menores. Reescribe momentos y palabras clave en términos generales, sin datos identificables';

function revisarPrivacidad(analisis: Analisis): string | null {
  const textos = [
    ...analisis.momentos.map((m) => m.resumen),
    ...analisis.palabrasClave.map((p) => p.palabra),
  ];
  for (const texto of textos) {
    if (datoIdentifiable(texto)) return PRIVADO;
  }
  for (const clave of analisis.palabrasClave) {
    if (/[A-ZÁÉÍÓÚÜÑ]/.test(clave.palabra)) return PRIVADO;
  }
  return null;
}

export function analisisTieneDatosIdentificables(analisis: Analisis): boolean {
  return revisarPrivacidad(analisis) !== null;
}

function datoIdentifiable(texto: string): boolean {
  if (/\b[A-ZÁÉÍÓÚÜÑ]{2,}\b/.test(texto)) return true;
  if (/[a-záéíóúüñ][A-ZÁÉÍÓÚÜÑ]/.test(texto)) return true;
  if (/\d{3,}/.test(texto) || texto.includes('@')) return true;
  if (/\b(calle|avenida|avda|domicilio|direcci[oó]n|barrio)\b/i.test(texto)) return true;
  if (/\b(mam[aá]|pap[aá]|hij[oa]s?|abuel[oa]s?|t[ií][oa]s?|herman[oa]s?|espos[oa]|novi[oa])\b/i.test(texto)) return true;
  const frases = texto.split(/[.!?]+/);
  for (const frase of frases) {
    const palabras = frase.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g) ?? [];
    for (let i = 1; i < palabras.length; i++) {
      if (/^[A-ZÁÉÍÓÚÜÑ]/.test(palabras[i]!)) return true;
    }
  }
  return false;
}

export async function comprenderRelato(params: {
  texto: string;
  locale: AlmaLocale;
  apiKey: string;
  modelo?: string;
}): Promise<ResultadoAnalisis> {
  const modelo = params.modelo ?? MODELO_LENGUAJE;
  const openai = new OpenAI({ apiKey: params.apiKey });
  let entrada = 0;
  let salida = 0;
  let reintentos = 0;
  let ultimoError = 'sin respuesta';

  const intentar = async (correccion?: string) => {
    const paso = await completar(openai, modelo, params.texto, correccion);
    entrada += paso.entrada;
    salida += paso.salida;
    return validar(paso.raw);
  };

  try {
    let paso = await intentar();
    if (!paso.ok) {
      reintentos = 1;
      paso = await intentar(paso.error);
      ultimoError = paso.ok ? '' : paso.error;
    }
    if (paso.ok) {
      return {
        analisis: paso.analisis,
        origen: 'modelo',
        reintentos,
        tokensEntrada: entrada,
        tokensSalida: salida,
        costoUsd: costoLenguajeUsd(entrada, salida, modelo),
        detalle: null,
      };
    }
  } catch (error) {
    ultimoError = limpiar(error instanceof Error ? error.message : 'error de red');
    if (reintentos === 0) {
      try {
        reintentos = 1;
        const paso = await intentar();
        if (paso.ok) {
          return {
            analisis: paso.analisis,
            origen: 'modelo',
            reintentos,
            tokensEntrada: entrada,
            tokensSalida: salida,
            costoUsd: costoLenguajeUsd(entrada, salida, modelo),
            detalle: null,
          };
        }
        ultimoError = paso.error;
      } catch (error2) {
        ultimoError = limpiar(error2 instanceof Error ? error2.message : ultimoError);
      }
    }
  }

  return {
    analisis: analisisDesdeDiccionario(params.texto, params.locale),
    origen: 'respaldo-diccionario',
    reintentos,
    tokensEntrada: entrada,
    tokensSalida: salida,
    costoUsd: costoLenguajeUsd(entrada, salida, modelo),
    detalle: ultimoError,
  };
}
