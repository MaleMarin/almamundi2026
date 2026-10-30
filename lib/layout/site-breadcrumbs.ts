/**
 * Migas de pan para rutas internas: etiquetas en el idioma del sitio y hrefs coherentes con redirecciones (p. ej. /mapa/historias → /mapa).
 */

import type { AlmaLocale } from '@/lib/i18n/locale';

export type SiteBreadcrumbItem = { href: string | null; label: string };

const PUBLIC_CRUMBS: Record<AlmaLocale, Record<string, string>> = {
  es: {
    _inicio: 'Inicio',
    _historia: 'Historia',
    historias: 'Historias',
    videos: 'Videos',
    audios: 'Audios',
    escrito: 'Textos',
    fotos: 'Fotos',
    audio: 'Audio',
    video: 'Video',
    texto: 'Texto',
    foto: 'Foto',
    mapa: 'Mapa',
    contar: 'Cuenta tu historia',
    pregunta: 'Pregunta',
  },
  pt: {
    _inicio: 'Início',
    _historia: 'História',
    historias: 'Histórias',
    videos: 'Vídeos',
    audios: 'Áudios',
    escrito: 'Textos',
    fotos: 'Fotos',
    audio: 'Áudio',
    video: 'Vídeo',
    texto: 'Texto',
    foto: 'Foto',
    mapa: 'Mapa',
    contar: 'Conte sua história',
    pregunta: 'Pergunta',
  },
  en: {
    _inicio: 'Home',
    _historia: 'Story',
    historias: 'Stories',
    videos: 'Videos',
    audios: 'Audio',
    escrito: 'Texts',
    fotos: 'Photos',
    audio: 'Audio',
    video: 'Video',
    texto: 'Text',
    foto: 'Photo',
    mapa: 'Map',
    contar: 'Tell your story',
    pregunta: 'Question',
  },
};

function crumb(locale: AlmaLocale, key: string): string | undefined {
  return PUBLIC_CRUMBS[locale][key];
}

const STATIC_LABELS: Record<string, string> = {
  historias: 'Historias',
  videos: 'Videos',
  audios: 'Audios',
  escrito: 'Textos',
  fotos: 'Fotos',
  /** Segmentos en URL dedicada /historias/[id]/… */
  audio: 'Audio',
  video: 'Video',
  texto: 'Texto',
  foto: 'Foto',
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
  contacto: 'Contacto',
  camaras: 'Cámaras',
  u: 'Perfil público',
  /** Rutas de laboratorio / preview */
  'vista-previa': 'Vista previa',
  'preview-home': 'Vista previa home',
  'globo-validacion': 'Validación del globo',
  'globo-v2': 'Globo',
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
  foto: ['/historias/fotos', 'Fotos'],
  texto: ['/historias/escrito', 'Textos'],
};

/**
 * Construye la lista de migas a partir del pathname.
 */
export function buildSiteBreadcrumbs(pathname: string, locale: AlmaLocale = 'es'): SiteBreadcrumbItem[] {
  const path = normalizePathnameForBreadcrumbs(pathname);
  if (path === '/') return [];

  const segments = path.split('/').filter(Boolean);
  const items: SiteBreadcrumbItem[] = [{ href: '/', label: crumb(locale, '_inicio') ?? 'Inicio' }];

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
        const indexKey = seg === 'texto' ? 'escrito' : seg === 'foto' ? 'fotos' : `${seg}s`;
        items.push({ href: pair[0], label: crumb(locale, indexKey) ?? pair[1] });
        items.push({ href: null, label: crumb(locale, seg) ?? STATIC_LABELS[seg] ?? humanizeSegment(seg) });
        break;
      }
    }

    // /mapa/historias/:id — el índice /mapa/historias redirige; migas: Inicio · Mapa · Historia (Mapa ya añadida en la vuelta anterior)
    if (prev === 'mapa' && seg === 'historias' && segments[i + 1] !== undefined && i + 2 === segments.length) {
      items.push({ href: null, label: crumb(locale, '_historia') ?? 'Historia' });
      break;
    }

    if (seg === 'noticias' || prev === 'noticias') continue;

    let href: string | null = isLast ? null : pathUpTo;
    if (pathUpTo === '/mapa' || pathUpTo === '/mapa/historias' || pathUpTo === '/mapa/camaras') {
      href = isLast ? null : '/#mapa';
    }

    let label: string | undefined = crumb(locale, seg) ?? STATIC_LABELS[seg];
    if (!label) {
      if (prev === 'u') {
        try {
          label = `@${decodeURIComponent(seg)}`;
        } catch {
          label = `@${seg}`;
        }
      } else if (prev === 'historias' && isLikelyStoryId(seg)) {
        label = crumb(locale, '_historia') ?? 'Historia';
      } else if (prev === 'temas' || prev === 'exposiciones' || prev === 'recorridos' || prev === 'muestras') {
        label = humanizeSegment(seg);
      } else if (prev === 'camaras') {
        label = humanizeSegment(seg);
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
  if (p === '/privacidad') return false;
  if (p === '/terminos') return false;
  if (p === '/contacto') return false;
  if (p === '/vision') return false;
  if (p === '/newsletter' || p.startsWith('/newsletter/')) return false;
  return true;
}
