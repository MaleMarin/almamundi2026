/** «Me pregunto…»: preguntas que deja la gente. Tipos y límites compartidos por cliente y servidor. */

export const ME_PREGUNTO_ID = 'me-pregunto';
export const ME_PREGUNTAS_COLLECTION = 'preguntas_comunidad';
export const ME_PREGUNTA_CONTACTS_COLLECTION = 'pregunta_comunidad_contacts';
export const ME_PREGUNTA_MAX = 140;
/** Las respuestas guardan `questionId = "mp-<id del documento>"`. */
export const ME_PREGUNTA_PREFIX = 'mp-';

export type MePreguntaPublica = {
  /** `mp-<id>` */
  id: string;
  texto: string;
  alias: string;
  city: string;
  country: string;
};

export function esMePreguntaId(value: unknown): value is string {
  return typeof value === 'string' && /^mp-[A-Za-z0-9]{8,40}$/.test(value);
}

export function docIdDeMePregunta(id: string): string {
  return id.slice(ME_PREGUNTA_PREFIX.length);
}
