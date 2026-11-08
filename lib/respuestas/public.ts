export type RespuestaPublica = {
  id: string;
  /** Código público de /r/[código]. */
  shortCode?: string;
  questionId: string;
  /** Respuesta de muestra redactada para el banco editorial; no es testimonio de un visitante. */
  editorial?: boolean;
  mode: "tu" | "alguien";
  kind: "texto" | "voz" | "foto";
  contenido: string;
  alias: string;
  city: string;
  country: string;
  previewUrl: string | null;
  lat: number | null;
  lng: number | null;
  /** «Me pregunto…»: texto de la pregunta y quién la hizo. */
  questionText?: string;
  askerAlias?: string;
  askerCity?: string;
  askerCountry?: string;
  /** Año en que se envió (solo el año). */
  anio?: string;
};
