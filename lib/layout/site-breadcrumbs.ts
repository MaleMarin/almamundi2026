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
  /** Rutas de laboratorio / preview */
  prototipo: 'Prototipo',
  'vista-previa': 'Vista previa',
  'preview-home': 'Vista previa home',
  'globo-validacion': 'Validación del globo',
  'globo-v2': 'Globo',
  'earth-globe-demo': 'Demo globo',
  'demo-impronta': 'Demo resonancia visual (histórica)',
  'demo-huellas-v2': 'Demo resonancia visual',
  cinematic: 'Cine',
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

/** Fondo de la barra de migas: oscuro en vistas tipo «archivo / admin». */
export function siteBreadcrumbTone(pathname: string): 'light' | 'dark' {
  const p = normalizePathnameForBreadcrumbs(pathname);
  if (p === '/archivo' || p.startsWith('/archivo/')) return 'dark';
  if (p === '/curaduria' || p.startsWith('/curaduria/')) return 'dark';
  if (p === '/admin' || p.startsWith('/admin/')) return 'dark';
  return 'light';
}

const HISTORIA_MEDIA_FORMAT_CRUMB: Record<string, [string, string]> = {
  audio: ['/historias/audios', 'Audios'],
  video: ['/historias/videos', 'Videos'],
  foto: ['/historias/fotos', 'Fotografías'],
  texto: ['/historias/escrito', 'Escritos'],
};

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

    // /historias/:id/audio|video|foto|texto — enlace al índice por formato + página actual
    if (
      segments[0] === 'historias' &&
      segments.length === 3 &&
      i === 2 &&
      isLikelyStoryId(segments[1])
    ) {
      const pair = HISTORIA_MEDIA_FORMAT_CRUMB[seg];
      if (pair) {
        items.push({ href: pair[0], label: pair[1] });
        items.push({ href: null, label: STATIC_LABELS[seg] ?? humanizeSegment(seg) });
        break;
      }
    }

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
  if (p === '/muestras' && !muestrasListMode) return false;
  if (p === '/cinematic' || p.startsWith('/cinematic/')) return false;
  return true;
}
