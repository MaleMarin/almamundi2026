/**
 * Fuentes RSS por tema AlmaMundi.
 * Los valores de `topic` coinciden con los `id` de NEWS_TOPIC_GROUPS en lib/news-topics.ts.
 */

export interface AlmaFeedSource {
  id: string;
  name: string;
  url: string;
  /** Id de NEWS_TOPIC_GROUPS */
  topic: string;
  language: "es" | "en";
  region: string;
  hasGeo: boolean;
}

/**
 * Mapeo de las fuentes del brief a los ids oficiales de temas:
 * - conflictos / guerra → poder-gobernanza
 * - arte, música, literatura, cine, viajes, historias → arte-cultura
 * - economía, salud → finanzas-salud
 * - migración → migracion-derechos
 */
export const ALMA_FEED_SOURCES: AlmaFeedSource[] = [
  // --- medio-ambiente ---
  {
    id: "bbc-environment",
    name: "BBC Environment",
    url: "http://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    topic: "medio-ambiente",
    language: "en",
    region: "global",
    hasGeo: true,
  },
  {
    id: "gnews-clima",
    name: "Google News Clima",
    url: "https://news.google.com/rss/search?q=cambio+climatico+medio+ambiente&hl=es&gl=MX&ceid=MX:es",
    topic: "medio-ambiente",
    language: "es",
    region: "latam",
    hasGeo: false,
  },
  // --- tecnologia-innovacion ---
  {
    id: "techcrunch",
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    topic: "tecnologia-innovacion",
    language: "en",
    region: "global",
    hasGeo: false,
  },
  {
    id: "gnews-tecnologia",
    name: "Google News Tecnología",
    url: "https://news.google.com/rss/search?q=tecnologia+innovacion+inteligencia+artificial&hl=es&gl=MX&ceid=MX:es",
    topic: "tecnologia-innovacion",
    language: "es",
    region: "latam",
    hasGeo: false,
  },
  // --- arte-cultura (arte, música, literatura, cine, viajes, historias de vida) ---
  {
    id: "gnews-arte",
    name: "Google News Arte",
    url: "https://news.google.com/rss/search?q=arte+cultura+museo+exposicion&hl=es&gl=MX&ceid=MX:es",
    topic: "arte-cultura",
    language: "es",
    region: "latam",
    hasGeo: false,
  },
  {
    id: "theguardian-culture",
    name: "The Guardian Culture",
    url: "https://www.theguardian.com/culture/rss",
    topic: "arte-cultura",
    language: "en",
    region: "global",
    hasGeo: false,
  },
  {
    id: "gnews-musica",
    name: "Google News Música",
    url: "https://news.google.com/rss/search?q=musica+concierto+album+artista&hl=es&gl=MX&ceid=MX:es",
    topic: "arte-cultura",
    language: "es",
    region: "latam",
    hasGeo: false,
  },
  {
    id: "gnews-literatura",
    name: "Google News Literatura",
    url: "https://news.google.com/rss/search?q=literatura+libros+novela+escritor&hl=es&gl=MX&ceid=MX:es",
    topic: "arte-cultura",
    language: "es",
    region: "latam",
    hasGeo: false,
  },
  {
    id: "gnews-cine",
    name: "Google News Cine",
    url: "https://news.google.com/rss/search?q=cine+pelicula+festival+director&hl=es&gl=MX&ceid=MX:es",
    topic: "arte-cultura",
    language: "es",
    region: "latam",
    hasGeo: false,
  },
  {
    id: "gnews-historias",
    name: "Google News Historias",
    url: "https://news.google.com/rss/search?q=historia+de+vida+inspiracion+comunidad&hl=es&gl=MX&ceid=MX:es",
    topic: "arte-cultura",
    language: "es",
    region: "latam",
    hasGeo: false,
  },
  {
    id: "gnews-viajes",
    name: "Google News Viajes",
    url: "https://news.google.com/rss/search?q=viajes+turismo+destinos+aventura&hl=es&gl=MX&ceid=MX:es",
    topic: "arte-cultura",
    language: "es",
    region: "global",
    hasGeo: true,
  },
  // --- finanzas-salud ---
  {
    id: "bbc-business",
    name: "BBC Business",
    url: "http://feeds.bbci.co.uk/news/business/rss.xml",
    topic: "finanzas-salud",
    language: "en",
    region: "global",
    hasGeo: true,
  },
  {
    id: "gnews-economia",
    name: "Google News Economía",
    url: "https://news.google.com/rss/search?q=economia+mercados+finanzas+latinoamerica&hl=es&gl=MX&ceid=MX:es",
    topic: "finanzas-salud",
    language: "es",
    region: "latam",
    hasGeo: false,
  },
  {
    id: "gnews-salud",
    name: "Google News Salud",
    url: "https://news.google.com/rss/search?q=salud+bienestar+medicina+ciencia&hl=es&gl=MX&ceid=MX:es",
    topic: "finanzas-salud",
    language: "es",
    region: "latam",
    hasGeo: false,
  },
  // --- migracion-derechos ---
  {
    id: "gnews-migracion",
    name: "Google News Migración",
    url: "https://news.google.com/rss/search?q=migracion+refugiados+diaspora+frontera&hl=es&gl=MX&ceid=MX:es",
    topic: "migracion-derechos",
    language: "es",
    region: "global",
    hasGeo: true,
  },
  // --- poder-gobernanza (conflictos / mundo) ---
  {
    id: "bbc-world",
    name: "BBC World",
    url: "http://feeds.bbci.co.uk/news/world/rss.xml",
    topic: "poder-gobernanza",
    language: "en",
    region: "global",
    hasGeo: true,
  },
  {
    id: "gnews-conflictos",
    name: "Google News Conflictos",
    url: "https://news.google.com/rss/search?q=guerra+conflicto+crisis+humanitaria&hl=es&gl=MX&ceid=MX:es",
    topic: "poder-gobernanza",
    language: "es",
    region: "global",
    hasGeo: true,
  },
  // --- deportes ---
  {
    id: "gnews-deportes",
    name: "Google News Deportes",
    url: "https://news.google.com/rss/search?q=deportes+futbol+olimpiadas+campeonato&hl=es&gl=MX&ceid=MX:es",
    topic: "deportes",
    language: "es",
    region: "latam",
    hasGeo: false,
  },
  // --- educacion ---
  {
    id: "gnews-educacion",
    name: "Google News Educación",
    url: "https://news.google.com/rss/search?q=educacion+alfabetizacion+universidad+escuela&hl=es&gl=MX&ceid=MX:es",
    topic: "educacion",
    language: "es",
    region: "latam",
    hasGeo: false,
  },
  // --- ciencia ---
  {
    id: "gnews-ciencia",
    name: "Google News Ciencia",
    url: "https://news.google.com/rss/search?q=ciencia+investigacion+espacio+descubrimiento&hl=es&gl=MX&ceid=MX:es",
    topic: "ciencia",
    language: "es",
    region: "global",
    hasGeo: false,
  },
];
