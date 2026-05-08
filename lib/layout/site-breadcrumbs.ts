/**
 * Migas de pan para rutas internas: etiquetas en español y hrefs coherentes con redirecciones (p. ej. /mapa/historias → /mapa).
 */

export type SiteBreadcrumbItem = { href: string | null; label: string };

const STATIC_LABELS: Record<string, string> = {
  historias: 'Historias',
  videos: 'Videos',
  audios: 'Audios',
  escrito: 'Escritos',
  fotos: 'Fotografías',
  /** Segmentos en URL dedicada /historias/[id]/… */
  audio: 'Audio',
  video: 'Video',
  texto: 'Escrito',
  foto: 'Fotografías',
  'mi-coleccion': 'Mi colección',
  mapa: 'Mapa',
  temas: 'Temas',
  exposiciones: 'Exposiciones',
  recorridos: 'Recorridos',
  muestras: 'Muestras',
  curaduria: 'Curaduría',
  admin: 'Administración',
  subir: 'Subir historia',
  archivo: 'Archivo',
  perfil: 'Perfil',
  privacidad: 'Privacidad',
  terminos: 'Términos',
  vision: 'Visión',
  'educacion-mediatica': 'Educación mediática',
  'mis-datos-personales': 'Mis datos personales',
  camaras: 'Cámaras',
  noticias: 'Noticias',
  u: 'Perfil público',
};

function humanizeSegment(raw: string): string {
  try {
    const d = decodeURIComponent(raw);
    const t = d.replace(/-/g, ' ');
    if (t.length > 52) return `${t.slice(0, 49)}…`;
    return t.replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return raw;
  }
}

function isLikelyStoryId(seg: string): boolean {
  if (seg.length < 8) return false;
  return /^[a-zA-Z0-9_-]+$/.test(seg);
}

/**
 * Normaliza pathname (sin query, sin barra final).
 */
export function normalizePathnameForBreadcrumbs(pathname: string): string {
  const base = pathname.split('?')[0] ?? '/';
  if (base === '' || base === '/') return '/';
  return base.replace(/\/+$/, '') || '/';
}

/**
 * Construye la lista de migas a partir del pathname.
 */
export function buildSiteBreadcrumbs(pathname: string): SiteBreadcrumbItem[] {
  const path = normalizePathnameForBreadcrumbs(pathname);
  if (path === '/') return [];

  const segments = path.split('/').filter(Boolean);
  const items: SiteBreadcrumbItem[] = [{ href: '/', label: 'Inicio' }];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const prev = i > 0 ? segments[i - 1] : '';
    const pathUpTo = `/${segments.slice(0, i + 1).join('/')}`;
    const isLast = i === segments.length - 1;

    // /mapa/historias/:id — el índice /mapa/historias redirige; migas: Inicio · Mapa · Historia (Mapa ya añadida en la vuelta anterior)
    if (prev === 'mapa' && seg === 'historias' && segments[i + 1] !== undefined && i + 2 === segments.length) {
      items.push({ href: null, label: 'Historia' });
      break;
    }

    let href: string | null = isLast ? null : pathUpTo;
    if (pathUpTo === '/mapa/historias' || pathUpTo === '/mapa/camaras') {
      href = '/mapa';
    }

    let label: string | undefined = STATIC_LABELS[seg];
    if (!label) {
      if (prev === 'u') {
        try {
          label = `@${decodeURIComponent(seg)}`;
        } catch {
          label = `@${seg}`;
        }
      } else if (prev === 'historias' && isLikelyStoryId(seg)) {
        label = 'Historia';
      } else if (prev === 'temas' || prev === 'exposiciones' || prev === 'recorridos' || prev === 'muestras') {
        label = humanizeSegment(seg);
      } else if (prev === 'camaras') {
        label = humanizeSegment(seg);
      } else if (prev === 'noticias') {
        label = 'Noticia';
      } else {
        label = humanizeSegment(seg);
      }
    }

    items.push({ href, label });
  }

  return items;
}

/**
 * Rutas donde no mostramos migas (inmersión o sin barra de contexto útil).
 */
export function shouldShowSiteBreadcrumbs(pathname: string, muestrasListMode: boolean): boolean {
  const p = normalizePathnameForBreadcrumbs(pathname);
  if (p === '/') return false;
  if (p === '/mapa') return false;
  if (/^\/historias\/[^/]+\/(video|audio|texto|foto)$/.test(p)) return false;
  if (p === '/muestras' && !muestrasListMode) return false;
  if (p === '/cinematic' || p.startsWith('/cinematic/')) return false;
  return true;
}
