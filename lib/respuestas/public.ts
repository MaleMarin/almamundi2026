export type RespuestaPublica = {
  id: string;
  /** Código público de /r/[código]. */
  shortCode?: string;
  questionId: string;
  mode: "tu" | "alguien";
  kind: "texto" | "voz" | "foto";
  contenido: string;
  alias: string;
  city: string;
  country: string;
  previewUrl: string | null;
  lat: number | null;
  lng: number | null;
};
