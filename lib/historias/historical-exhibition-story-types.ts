/**
 * Formato interno del carrusel de exposición (normalizado desde historias.json).
 */
export type HistoricalExhibitionStory = {
  id: string;
  nombre: string;
  titulo: string;
  cita: string;
  fecha: string;
  lugar: string;
  foto_perfil: string;
  imagen_principal: string;
  tags: string[];
  videoUrl?: string;
  audioUrl?: string;
  /** Historia demo / beta_demo — mostrar aviso en carrusel. */
  isDemoStory?: boolean;
  demoNotice?: string;
};
