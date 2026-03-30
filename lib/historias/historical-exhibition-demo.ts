import raw from './historias.json';

import type { HistoricalExhibitionStory } from './historical-exhibition-story-types';

export type { HistoricalExhibitionStory } from './historical-exhibition-story-types';

type HistoriaArchivo = {
  id: string;
  nombre: string;
  titulo_historia: string;
  cita_textual: string;
  ubicación: string;
  foto_perfil: string;
  fecha?: string;
  imagen_principal?: string;
  tags?: string[];
};

type HistoriasFile = { historias: HistoriaArchivo[] };

function normalizeHistorias(file: HistoriasFile): HistoricalExhibitionStory[] {
  return file.historias.map((h) => ({
    id: h.id,
    nombre: h.nombre,
    titulo: h.titulo_historia,
    cita: h.cita_textual,
    lugar: h.ubicación,
    foto_perfil: h.foto_perfil,
    fecha: h.fecha ?? '—',
    imagen_principal:
      h.imagen_principal ??
      `https://picsum.photos/seed/${encodeURIComponent(h.id)}main/567/567`,
    tags: Array.isArray(h.tags) && h.tags.length > 0 ? h.tags : ['historia'],
  }));
}

/** 15 relatos de prueba (`historias.json`): artistas, emprendedores, personas resilientes. */
export const HISTORICAL_EXHIBITION_DEMO: HistoricalExhibitionStory[] = normalizeHistorias(
  raw as HistoriasFile
);
