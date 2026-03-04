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
    label: "Política, Gobernanza y Sociedad",
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
  {
    id: "educacion",
    label: "Educación y Alfabetización",
    query: "educación alfabetización mediática escuela universidad formación docentes estudiantes ciudadanía digital",
  },
  {
    id: "medio-ambiente",
    label: "Medio Ambiente y Clima",
    query: "medio ambiente clima cambio climático sostenibilidad energía renovable naturaleza biodiversidad contaminación",
  },
  {
    id: "deportes",
    label: "Deportes",
    query: "deportes fútbol fútbol americano baloncesto tenis olimpiadas liga campeonato",
  },
  {
    id: "ciencia",
    label: "Ciencia e Investigación",
    query: "ciencia investigación tecnología espacial medicina descubrimiento estudio científico",
  },
  {
    id: "migracion-derechos",
    label: "Migración y Derechos",
    query: "migración inmigración refugiados derechos humanos frontera asilo desplazamiento",
  },
];

/** Query por defecto: combina todos los temas para mostrar lo más actual en estas áreas */
export const DEFAULT_NEWS_TOPIC_QUERY =
  "transparencia gobernanza política digital derechos humanos inteligencia artificial tecnología alfabetización mediática arte cultura finanzas salud educación medio ambiente deportes ciencia migración";
