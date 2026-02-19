/**
 * Medios de comunicación curados para AlmaMundi / Precisar.
 * Se usan para priorizar/filtrar noticias y mostrar nombres legibles de fuentes.
 */

export type MediaSource = {
  id: string;
  name: string;
  domain: string;
  country: string;
  countryName: string;
  description?: string;
};

/** Dominios normalizados (sin www, en minúsculas) para matching con URLs/dominios de artículos */
export function normalizeDomain(domain: string): string {
  return domain.replace(/^www\./, "").toLowerCase().trim();
}

/** Lista de medios: institucionales, Chile, México, Argentina, EE.UU. (hispanos), España */
export const MEDIA_SOURCES: MediaSource[] = [
  // Institucionales y políticas digitales
  { id: "precisar", name: "Precisar", domain: "precisar.net", country: "cl", countryName: "Chile", description: "Alfabetización mediática, ciudadanía digital y proyecto Onda." },
  { id: "politica-digital", name: "Política Digital", domain: "politica-digital.com", country: "mx", countryName: "México", description: "Tecnología, políticas públicas y gobernanza digital." },
  // Chile
  { id: "ciper", name: "CIPER Chile", domain: "ciperchile.cl", country: "cl", countryName: "Chile", description: "Periodismo de investigación y fiscalización." },
  { id: "el-mostrador", name: "El Mostrador", domain: "elmostrador.cl", country: "cl", countryName: "Chile", description: "Primer diario digital chileno, análisis político." },
  { id: "the-clinic", name: "The Clinic", domain: "theclinic.cl", country: "cl", countryName: "Chile", description: "Cultura, sátira y reportajes con mirada crítica." },
  { id: "la-tercera", name: "La Tercera", domain: "latercera.com", country: "cl", countryName: "Chile", description: "Actualidad, economía y política." },
  { id: "el-mercurio", name: "El Mercurio", domain: "emol.com", country: "cl", countryName: "Chile", description: "Mayor trayectoria y registro histórico del país." },
  // México
  { id: "la-jornada", name: "La Jornada", domain: "jornada.com.mx", country: "mx", countryName: "México", description: "Pilar del periodismo de izquierda e intelectual." },
  { id: "animal-politico", name: "Animal Político", domain: "animalpolitico.com", country: "mx", countryName: "México", description: "Verificación de datos y transparencia." },
  { id: "el-universal", name: "El Universal", domain: "eluniversal.com.mx", country: "mx", countryName: "México", description: "Alcance nacional y amplia cobertura temática." },
  // Argentina
  { id: "pagina12", name: "Página/12", domain: "pagina12.com.ar", country: "ar", countryName: "Argentina", description: "Derechos humanos y movimientos sociales." },
  { id: "la-nacion", name: "La Nación", domain: "lanacion.com.ar", country: "ar", countryName: "Argentina", description: "Diseño visual y periodismo de datos." },
  { id: "infobae", name: "Infobae", domain: "infobae.com", country: "ar", countryName: "Argentina", description: "Portal en español más visitado globalmente." },
  // Estados Unidos (medios hispanos)
  { id: "nyt-es", name: "The New York Times (en Español)", domain: "nytimes.com", country: "us", countryName: "Estados Unidos", description: "Periodismo global del Times traducido." },
  { id: "la-opinion", name: "La Opinión", domain: "laopinion.com", country: "us", countryName: "Estados Unidos", description: "Diario en español más importante de la costa oeste." },
  { id: "el-diario-ny", name: "El Diario NY", domain: "eldiariony.com", country: "us", countryName: "Estados Unidos", description: "Medio latino histórico de Nueva York." },
  // España
  { id: "el-pais", name: "El País", domain: "elpais.com", country: "es", countryName: "España", description: "Máxima reputación digital en el mundo de habla hispana." },
  { id: "eldiario-es", name: "elDiario.es", domain: "eldiario.es", country: "es", countryName: "España", description: "Transparencia y relación con socios." },
];

/** Map: dominio normalizado -> MediaSource (para lookup rápido) */
const DOMAIN_TO_SOURCE = new Map<string, MediaSource>(
  MEDIA_SOURCES.map((s) => [normalizeDomain(s.domain), s])
);

/** Dado un dominio de artículo (ej. de GDELT), devuelve el medio curado si existe */
export function getMediaByDomain(domain: string | null | undefined): MediaSource | null {
  if (!domain || !domain.trim()) return null;
  return DOMAIN_TO_SOURCE.get(normalizeDomain(domain)) ?? null;
}

/** Lista de dominios normalizados para filtrar/priorizar noticias solo de estos medios */
export const CURATED_DOMAINS = new Set(MEDIA_SOURCES.map((s) => normalizeDomain(s.domain)));

/** Indica si un dominio pertenece a la lista curada */
export function isCuratedDomain(domain: string | null | undefined): boolean {
  if (!domain || !domain.trim()) return false;
  return CURATED_DOMAINS.has(normalizeDomain(domain));
}
