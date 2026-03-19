/**
 * Temas para /temas y /temas/[slug].
 * Cada tema tiene slug (URL), nombre, descripción y color (borde superior en la card).
 */
export type TemaItem = {
  slug: string;
  name: string;
  description?: string;
  color: string;
};

/** Paleta: Teal Grove, Rusted Clay, Tangerine Pop, Sun Peel, Persimmon Glow */
const COLORS = [
  '#0F4C45', /* Teal Grove */
  '#A6461F', /* Rusted Clay */
  '#FF8C1C', /* Tangerine Pop */
  '#FFB31F', /* Sun Peel */
  '#E2552A', /* Persimmon Glow */
];

export const TEMAS: TemaItem[] = [
  { slug: 'el-amor-como-apertura-y-dependencia', name: 'El amor como apertura y dependencia', description: 'Amar implica salir de uno mismo, entregarse, arriesgarse y quedar expuesto a la presencia o ausencia del otro.', color: COLORS[0] },
  { slug: 'la-perdida-como-experiencia-constitutiva', name: 'La pérdida como experiencia constitutiva', description: 'La vida humana está atravesada por lo que se rompe, se aleja, muere o deja de ser.', color: COLORS[1] },
  { slug: 'el-abandono-como-herida-de-desamparo', name: 'El abandono como herida de desamparo', description: 'Una de las experiencias más profundas es sentir que quien debía cuidar, sostener o permanecer, se retiró.', color: COLORS[2] },
  { slug: 'la-ruptura-amorosa-como-quiebre-de-mundo', name: 'La ruptura amorosa como quiebre de mundo', description: 'No termina solo una relación: también se derrumba una promesa, una rutina, una imagen del futuro.', color: COLORS[3] },
  { slug: 'la-fractura-familiar-como-conflicto-de-origen', name: 'La fractura familiar como conflicto de origen', description: 'Las heridas familiares suelen tocar lo más íntimo: pertenencia, cuidado, lealtad, rechazo, silencio.', color: COLORS[4] },
  { slug: 'la-violencia-como-imposicion-sobre-el-otro', name: 'La violencia como imposición sobre el otro', description: 'La experiencia humana también está marcada por la agresión, el abuso, la dominación y el daño físico o simbólico.', color: COLORS[0] },
  { slug: 'la-injusticia-como-conciencia-del-agravio', name: 'La injusticia como conciencia del agravio', description: 'Hay humanidad en la experiencia de ser menospreciado, excluido o tratado indignamente, pero también en la resistencia frente a ello.', color: COLORS[1] },
  { slug: 'el-miedo-como-percepcion-de-vulnerabilidad', name: 'El miedo como percepción de vulnerabilidad', description: 'El miedo revela nuestra fragilidad frente a la pérdida, el rechazo, la soledad, el dolor o la muerte.', color: COLORS[2] },
  { slug: 'la-identidad-como-pregunta-nunca-cerrada', name: 'La identidad como pregunta nunca cerrada', description: 'Ser humano es no coincidir del todo consigo mismo y tener que preguntarse una y otra vez quién se es.', color: COLORS[3] },
  { slug: 'la-memoria-como-defensa-contra-la-desaparicion', name: 'La memoria como defensa contra la desaparición', description: 'Recordar no solo conserva el pasado: también protege lo vivido frente al olvido y la indiferencia.', color: COLORS[4] },
  { slug: 'la-esperanza-como-forma-de-resistencia', name: 'La esperanza como forma de resistencia', description: 'Incluso en condiciones adversas, el ser humano insiste en imaginar que algo puede repararse o recomenzar.', color: COLORS[0] },
  { slug: 'el-trabajo-como-necesidad-carga-y-forma-de-dignidad', name: 'El trabajo como necesidad, carga y forma de dignidad', description: 'El trabajo no es solo producción: organiza el tiempo, da identidad, agota, disciplina y muchas veces define el lugar social de una persona.', color: COLORS[1] },
  { slug: 'la-precariedad-como-inseguridad-de-la-existencia', name: 'La precariedad como inseguridad de la existencia', description: 'Vivir sin estabilidad material, afectiva o social vuelve incierto el presente y reduce el horizonte del futuro.', color: COLORS[2] },
  { slug: 'la-soledad-como-prueba-interior', name: 'La soledad como prueba interior', description: 'A veces la soledad es elección y refugio; otras, es abandono, aislamiento o imposibilidad de ser comprendido.', color: COLORS[3] },
  { slug: 'la-familia-como-refugio-y-herida', name: 'La familia como refugio y herida', description: 'En ella conviven amor, protección, transmisión, pero también conflicto, deuda emocional y dolor persistente.', color: COLORS[4] },
  { slug: 'el-cambio-como-condicion-inevitable', name: 'El cambio como condición inevitable', description: 'Vivir es transformarse: crecer, migrar, perder certezas, adaptarse y asumir que nada permanece intacto.', color: COLORS[0] },
  { slug: 'el-arte-como-traduccion-de-la-experiencia', name: 'El arte como traducción de la experiencia', description: 'El arte aparece cuando vivir no basta y surge la necesidad de dar forma a lo sentido.', color: COLORS[1] },
  { slug: 'la-escritura-como-acto-de-fijar-y-comprender', name: 'La escritura como acto de fijar y comprender', description: 'Escribir es ordenar el caos, dejar testimonio y convertir la experiencia en reflexión.', color: COLORS[2] },
  { slug: 'musica-cine-fotografia-y-pintura-como-lenguajes', name: 'La música, el cine, la fotografía y la pintura como lenguajes de la sensibilidad', description: 'Cada una de estas formas permite expresar lo que a veces no logra decirse de manera directa.', color: COLORS[3] },
  { slug: 'la-busqueda-de-sentido-como-insistencia-humana', name: 'La búsqueda de sentido como insistencia humana', description: 'Más allá del dolor, del trabajo, del amor o de la pérdida, persiste la necesidad de comprender para qué se vive y cómo seguir.', color: COLORS[4] },
];

export function getTemaBySlug(slug: string): TemaItem | undefined {
  return TEMAS.find((t) => t.slug === slug);
}

/** Normaliza un tema de historia para comparar con slug (lowercase, sin acentos). */
export function normalizeTemaForMatch(t: string | undefined): string {
  if (!t || typeof t !== 'string') return '';
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u0300-\u036f/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
