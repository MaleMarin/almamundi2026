/**
 * Los 20 temas de AlmaMundi.
 * Cada tema tiene un slug único para rutas (/temas/[slug])
 * y palabras clave para auto-clasificación por IA.
 */

export type Tema = {
  slug: string
  titulo: string
  descripcion: string
  color: string // para UI
  keywords: string[] // para auto-clasificación
}

export const TEMAS: Tema[] = [
  {
    slug: 'amor',
    titulo: 'El amor como apertura',
    descripcion: 'Amar implica salir de uno mismo, entregarse, arriesgarse y quedar...',
    color: '#e8534a',
    keywords: ['amor', 'amar', 'enamorar', 'querer', 'entrega', 'pareja', 'relación', 'afecto', 'cariño'],
  },
  {
    slug: 'perdida',
    titulo: 'La pérdida como experiencia',
    descripcion: 'La vida humana está atravesada por lo que se rompe, se aleja, muere...',
    color: '#6b7c8e',
    keywords: ['pérdida', 'perder', 'duelo', 'muerte', 'ausencia', 'despedida', 'luto', 'extrañar'],
  },
  {
    slug: 'abandono',
    titulo: 'El abandono como herida',
    descripcion: 'Una de las experiencias más profundas es sentir que quien debía cuidar...',
    color: '#c47b3a',
    keywords: ['abandono', 'abandonar', 'dejar', 'soltar', 'descuido', 'negligencia', 'desamparo'],
  },
  {
    slug: 'ruptura',
    titulo: 'La ruptura amorosa',
    descripcion: 'No termina solo una relación: también se derrumba una promesa...',
    color: '#d45f8a',
    keywords: ['ruptura', 'separación', 'divorcio', 'terminar', 'romper', 'ex pareja', 'desamor'],
  },
  {
    slug: 'familia',
    titulo: 'La fractura familiar',
    descripcion: 'Las heridas familiares suelen tocar lo más íntimo: pertenencia, cuidado...',
    color: '#e8a23a',
    keywords: ['familia', 'familiar', 'padre', 'madre', 'hijo', 'hermano', 'hogar', 'herencia', 'fractura'],
  },
  {
    slug: 'violencia',
    titulo: 'La violencia como imposición',
    descripcion: 'La experiencia humana está marcada por la agresión, el abuso...',
    color: '#8b3030',
    keywords: ['violencia', 'abuso', 'agresión', 'maltrato', 'trauma', 'golpe', 'amenaza', 'acoso'],
  },
  {
    slug: 'injusticia',
    titulo: 'La injusticia como conciencia',
    descripcion: 'Hay humanidad en la experiencia de ser menospreciado, excluido...',
    color: '#3a6e8b',
    keywords: ['injusticia', 'discriminación', 'exclusión', 'desigualdad', 'racismo', 'marginación', 'derechos'],
  },
  {
    slug: 'miedo',
    titulo: 'El miedo como percepción',
    descripcion: 'El miedo revela nuestra fragilidad frente a la pérdida, el rechazo...',
    color: '#5a4a8b',
    keywords: ['miedo', 'temor', 'fobia', 'ansiedad', 'pánico', 'vulnerabilidad', 'fragilidad', 'angustia'],
  },
  {
    slug: 'identidad',
    titulo: 'La identidad como pregunta',
    descripcion: 'Ser humano es no coincidir del todo consigo mismo y tener que...',
    color: '#3a8b6e',
    keywords: ['identidad', 'quien soy', 'pertenencia', 'origen', 'género', 'cultura', 'raíces', 'nombre'],
  },
  {
    slug: 'memoria',
    titulo: 'La memoria como defensa',
    descripcion: 'Recordar no solo conserva el pasado: también protege lo vivido...',
    color: '#8b7a3a',
    keywords: ['memoria', 'recuerdo', 'pasado', 'historia', 'infancia', 'nostalgia', 'olvidar', 'remembrar'],
  },
  {
    slug: 'esperanza',
    titulo: 'La esperanza como forma',
    descripcion: 'Incluso en condiciones adversas, el ser humano insiste en imaginar...',
    color: '#4a8b3a',
    keywords: ['esperanza', 'futuro', 'sueño', 'deseo', 'ilusión', 'posibilidad', 'cambio', 'creer'],
  },
  {
    slug: 'trabajo',
    titulo: 'El trabajo como necesidad',
    descripcion: 'El trabajo no es solo producción: organiza el tiempo, da identidad...',
    color: '#6b4a2a',
    keywords: ['trabajo', 'empleo', 'oficio', 'profesión', 'desempleo', 'cansancio', 'esfuerzo', 'laboral'],
  },
  {
    slug: 'precariedad',
    titulo: 'La precariedad como inseguridad',
    descripcion: 'Vivir sin estabilidad material, afectiva o social vuelve incierto...',
    color: '#8b6a3a',
    keywords: ['precariedad', 'pobreza', 'inestabilidad', 'inseguridad', 'deuda', 'crisis', 'subsistir'],
  },
  {
    slug: 'soledad',
    titulo: 'La soledad como prueba interior',
    descripcion: 'A veces la soledad es elección y refugio; otras, es abandono...',
    color: '#4a6a8b',
    keywords: ['soledad', 'solo', 'aislamiento', 'silencio', 'introversión', 'desconexión', 'retiro'],
  },
  {
    slug: 'familia-refugio',
    titulo: 'La familia como refugio y herida',
    descripcion: 'En ella conviven amor, protección, transmisión, pero también conflicto...',
    color: '#8b4a6a',
    keywords: ['familia', 'refugio', 'hogar', 'vínculo', 'raíz', 'cuidado', 'protección', 'conflicto familiar'],
  },
  {
    slug: 'cambio',
    titulo: 'El cambio como condición',
    descripcion: 'Vivir es transformarse: crecer, migrar, perder certezas, adaptarse...',
    color: '#3a8b8b',
    keywords: ['cambio', 'transformación', 'migración', 'mudanza', 'adaptación', 'transición', 'evolución'],
  },
  {
    slug: 'arte',
    titulo: 'El arte como traducción',
    descripcion: 'El arte aparece cuando vivir no basta y surge la necesidad de dar forma...',
    color: '#8b3a8b',
    keywords: ['arte', 'pintura', 'dibujo', 'escultura', 'creación', 'expresión artística', 'obra', 'estética'],
  },
  {
    slug: 'escritura',
    titulo: 'La escritura como acto de fijar',
    descripcion: 'Escribir es ordenar el caos, dejar testimonio y convertir la experiencia...',
    color: '#2a5a3a',
    keywords: ['escritura', 'escribir', 'diario', 'carta', 'poesía', 'literatura', 'palabras', 'narrar'],
  },
  {
    slug: 'musica-cine-foto',
    titulo: 'La música, el cine y la fotografía',
    descripcion: 'Cada una de estas formas permite expresar lo que a veces no logra decirse...',
    color: '#3a3a8b',
    keywords: ['música', 'cine', 'fotografía', 'canción', 'película', 'imagen', 'sonido', 'visual', 'ritmo'],
  },
  {
    slug: 'sentido',
    titulo: 'La búsqueda de sentido',
    descripcion: 'Más allá del dolor, del trabajo, del amor o de la pérdida, persiste...',
    color: '#5a3a2a',
    keywords: ['sentido', 'propósito', 'fe', 'espiritualidad', 'filosofía', 'existencia', 'por qué', 'trascendencia'],
  },
]

export const TEMAS_MAP = Object.fromEntries(TEMAS.map((t) => [t.slug, t]))

export function getTemaBySlug(slug: string): Tema | undefined {
  return TEMAS.find((t) => t.slug === slug)
}

/** Detecta qué temas corresponden a un texto dado (título + descripción) */
export function detectarTemas(texto: string): string[] {
  const lower = texto.toLowerCase()
  const matches: { slug: string; score: number }[] = []

  for (const tema of TEMAS) {
    const score = tema.keywords.filter((k) => lower.includes(k)).length
    if (score > 0) matches.push({ slug: tema.slug, score })
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((m) => m.slug)
}
