export type RespuestaPublica = {
  id: string;
  questionId: string;
  mode: "tu" | "alguien";
  kind: "texto" | "voz" | "foto";
  contenido: string;
  alias: string;
  city: string;
  previewUrl: string | null;
  lat: number | null;
  lng: number | null;
};
