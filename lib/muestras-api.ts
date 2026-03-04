/**
 * Tipos para la API pública de Muestras (submissions aprobadas).
 */

export type MuestraApprovedItem = {
  id: string;
  topic: string;
  topicLabel: string;
  publicUrl: string;
  alias: string;
  dateTaken?: string;
  context?: string;
  createdAt: string;
};

export type MuestrasByTopic = {
  topic: string;
  topicLabel: string;
  items: MuestraApprovedItem[];
};
