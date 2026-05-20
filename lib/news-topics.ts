/**
 * Temas prioritarios para noticias en AlmaMundi / Precisar.
 * `apiQuery` ≤ 80 caracteres (límite /api/world). `matchKeywords` filtra RSS por título.
 */

export type NewsTopicGroup = {
  id: string;
  label: string;
  /** Query larga (referencia editorial / GDELT). */
  query: string;
  /** Query enviada a /api/world (máx. 80 caracteres). */
  apiQuery: string;
  /** Palabras distintivas para filtrar titulares RSS por tema. */
  matchKeywords: string[];
};

export const NEWS_TOPIC_GROUPS: NewsTopicGroup[] = [
  {
    id: "poder-gobernanza",
    label: "Política, Gobernanza y Sociedad",
    query:
      "política gobierno elecciones congreso democracia parlamento presidente transparencia",
    apiQuery: "política gobierno elecciones congreso democracia parlamento presidente",
    matchKeywords: [
      "politica",
      "política",
      "gobierno",
      "eleccion",
      "elección",
      "congreso",
      "senado",
      "parlamento",
      "democracia",
      "presidente",
      "ministro",
      "diputad",
      "gobernador",
      "alcalde",
      "legislat",
      "votacion",
      "votación",
    ],
  },
  {
    id: "tecnologia-innovacion",
    label: "Tecnología e Innovación",
    query: "tecnología inteligencia artificial IA internet ciberseguridad plataformas algoritmos",
    apiQuery: "tecnología inteligencia artificial IA internet ciberseguridad algoritmos",
    matchKeywords: [
      "tecnolog",
      "inteligencia artificial",
      " ciber",
      "internet",
      "digital",
      "algoritmo",
      "software",
      "aplicacion",
      "aplicación",
      "startup",
      "chip",
      "datos",
      "redes sociales",
      "ia ",
      " ia",
    ],
  },
  {
    id: "arte-cultura",
    label: "Arte, Cultura y Humanidades",
    query: "arte cultura cine música literatura patrimonio museo exposición teatro",
    apiQuery: "arte cultura cine música literatura patrimonio museo exposición",
    matchKeywords: [
      "arte",
      "cultura",
      "cine",
      "pelicula",
      "película",
      "musica",
      "música",
      "literatura",
      "libro",
      "teatro",
      "museo",
      "exposicion",
      "exposición",
      "patrimonio",
      "festival",
    ],
  },
  {
    id: "finanzas-salud",
    label: "Finanzas, Salud y Bienestar",
    query: "economía inflación empleo mercados finanzas banco central salud pública",
    apiQuery: "economía inflación empleo mercados finanzas banco central salud",
    matchKeywords: [
      "econom",
      "economía",
      "inflacion",
      "inflación",
      "empleo",
      "mercado",
      "finanza",
      "banco",
      "salud",
      "hospital",
      "medico",
      "médico",
      "vacuna",
      "epidemi",
    ],
  },
  {
    id: "educacion",
    label: "Educación y Alfabetización",
    query: "educación escuela universidad estudiantes docentes aprendizaje ministerio educación",
    apiQuery: "educación escuela universidad estudiantes docentes aprendizaje",
    matchKeywords: [
      "educacion",
      "educación",
      "escuela",
      "colegio",
      "universidad",
      "estudiante",
      "docente",
      "profesor",
      "aprendizaje",
      "aula",
      "bachiller",
      "maestro",
    ],
  },
  {
    id: "medio-ambiente",
    label: "Medio Ambiente y Clima",
    query: "clima medio ambiente energía contaminación biodiversidad agua sostenibilidad",
    apiQuery: "clima medio ambiente energía contaminación biodiversidad agua",
    matchKeywords: [
      "clima",
      "medio ambiente",
      "contaminacion",
      "contaminación",
      "biodivers",
      "energia",
      "energía",
      "renovable",
      "sequia",
      "sequía",
      "incendio",
      "deforest",
      "carbono",
    ],
  },
  {
    id: "deportes",
    label: "Deportes",
    query: "deportes fútbol baloncesto tenis olimpiadas campeonato liga selección",
    apiQuery: "deportes fútbol baloncesto tenis olimpiadas campeonato liga",
    matchKeywords: [
      "deporte",
      "futbol",
      "fútbol",
      "baloncesto",
      "tenis",
      "olimpiad",
      "campeonato",
      "liga",
      "seleccion",
      "selección",
      "gol ",
      " mundial",
    ],
  },
  {
    id: "ciencia",
    label: "Ciencia e Investigación",
    query: "ciencia investigación salud pública clima espacio laboratorio descubrimiento",
    apiQuery: "ciencia investigación salud pública clima espacio laboratorio",
    matchKeywords: [
      "ciencia",
      "investig",
      "laboratorio",
      "espacio",
      "nasa",
      "descubr",
      "estudio cient",
      "vacuna",
      "genoma",
      "asteroide",
      "marte",
      "telescopio",
    ],
  },
  {
    id: "migracion-derechos",
    label: "Migración y Derechos",
    query: "migración migrantes refugiados frontera asilo extranjería derechos humanos",
    apiQuery: "migración migrantes refugiados frontera asilo extranjería",
    matchKeywords: [
      "migracion",
      "migración",
      "migrante",
      "refugiad",
      "frontera",
      "asilo",
      "extranjer",
      "deportacion",
      "deportación",
      "indocument",
      "cruzar",
    ],
  },
];

export const DEFAULT_NEWS_TOPIC_QUERY =
  "transparencia gobernanza política digital derechos humanos inteligencia artificial tecnología alfabetización mediática arte cultura finanzas salud educación medio ambiente deportes ciencia migración";

export const DEFAULT_NEWS_TOPIC_API = DEFAULT_NEWS_TOPIC_QUERY.slice(0, 80);

export function getNewsTopicCacheKey(topicId: string | null): string {
  return topicId ?? "__all__";
}

export function getNewsTopicApiQuery(topicId: string | null): string {
  if (topicId == null) return DEFAULT_NEWS_TOPIC_API;
  const group = NEWS_TOPIC_GROUPS.find((g) => g.id === topicId);
  return group?.apiQuery ?? DEFAULT_NEWS_TOPIC_API;
}

export function getNewsTopicMatchKeywords(topicId: string | null): string[] | null {
  if (topicId == null) return null;
  const group = NEWS_TOPIC_GROUPS.find((g) => g.id === topicId);
  return group?.matchKeywords ?? null;
}
