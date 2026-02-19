/**
 * Temas prioritarios para noticias en AlmaMundi / Precisar.
 * Prioridad de visualización: las noticias más actuales de estos temas.
 * Se usan para consultar la API de noticias (GDELT) y para UI.
 */

export type NewsTopicGroup = {
  id: string;
  label: string;
  /** Términos para la query de búsqueda (API) */
  query: string;
};

/** Grupos de temas con sus términos de búsqueda para la API */
export const NEWS_TOPIC_GROUPS: NewsTopicGroup[] = [
  {
    id: "poder-gobernanza",
    label: "Poder, Gobernanza y Sociedad",
    query: "transparencia corrupción fiscalización congreso gobernanza política digital internet privacidad gobernanza tecnológica derechos humanos movimientos sociales geopolítica Iberoamérica",
  },
  {
    id: "tecnologia-innovacion",
    label: "Tecnología e Innovación",
    query: "inteligencia artificial IA periodismo smart cities transformación digital ciudades servicios públicos alfabetización mediática ciudadanía digital desinformación",
  },
  {
    id: "arte-cultura",
    label: "Arte, Cultura y Humanidades",
    query: "arte cine industria cinematográfica música literatura mundo hispano sátira crítica cultural",
  },
  {
    id: "finanzas-salud",
    label: "Finanzas, Salud y Bienestar",
    query: "mercados economía global fondos inversión salud avances médicos políticas sanitarias bienestar buenas noticias progreso soluciones comunitarias",
  },
];

/** Query por defecto: combina todos los temas para mostrar lo más actual en estas áreas */
export const DEFAULT_NEWS_TOPIC_QUERY =
  "transparencia gobernanza política digital derechos humanos inteligencia artificial tecnología alfabetización mediática arte cultura finanzas salud";
