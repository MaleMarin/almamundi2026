/**
 * Taxonomía pública en dos niveles: 11 ejes y sus temas.
 * El eje no se elige: sale del tema.
 */

export type EjeId =
  | 'vinculos'
  | 'memoria'
  | 'territorio'
  | 'migracion'
  | 'trabajo'
  | 'cuerpo'
  | 'perdidas'
  | 'identidad'
  | 'comunidad'
  | 'cultura'
  | 'suenos';

export type TemaId = string;

export type Eje = {
  id: EjeId;
  es: string;
  pt: string;
  en: string;
};

export type Tema = {
  id: string;
  eje: EjeId;
  es: string;
  pt: string;
  en: string;
};

type Locale = 'es' | 'pt' | 'en';

export const EJES: readonly Eje[] = [
  { id: 'vinculos', es: 'Vínculos', pt: 'Vínculos', en: 'Relationships' },
  { id: 'memoria', es: 'Memoria', pt: 'Memória', en: 'Memory' },
  { id: 'territorio', es: 'Territorio', pt: 'Território', en: 'Place' },
  { id: 'migracion', es: 'Migración y viajes', pt: 'Migração e viagens', en: 'Migration and travel' },
  { id: 'trabajo', es: 'Trabajo y oficios', pt: 'Trabalho e ofícios', en: 'Work and trades' },
  { id: 'cuerpo', es: 'Cuerpo y cuidado', pt: 'Corpo e cuidado', en: 'Body and care' },
  { id: 'perdidas', es: 'Pérdidas y cambios', pt: 'Perdas e mudanças', en: 'Loss and change' },
  { id: 'identidad', es: 'Identidad y creencias', pt: 'Identidade e crenças', en: 'Identity and beliefs' },
  { id: 'comunidad', es: 'Comunidad y sociedad', pt: 'Comunidade e sociedade', en: 'Community and society' },
  { id: 'cultura', es: 'Cultura y celebración', pt: 'Cultura e celebração', en: 'Culture and celebration' },
  { id: 'suenos', es: 'Sueños y futuro', pt: 'Sonhos e futuro', en: 'Dreams and future' },
];

const TEMA_ROWS: readonly (readonly [string, EjeId, string, string, string])[] = [
  ['familia', 'vinculos', 'familia', 'família', 'family'],
  ['pareja-amor', 'vinculos', 'pareja y amor', 'casal e amor', 'couple and love'],
  ['amistad', 'vinculos', 'amistad', 'amizade', 'friendship'],
  ['maternidad-paternidad', 'vinculos', 'maternidad y paternidad', 'maternidade e paternidade', 'motherhood and fatherhood'],
  ['abuelos', 'vinculos', 'abuelos', 'avós', 'grandparents'],
  ['hijos', 'vinculos', 'hijos', 'filhos', 'children'],
  ['vecinos', 'vinculos', 'vecinos', 'vizinhos', 'neighbors'],
  ['infancia', 'memoria', 'infancia', 'infância', 'childhood'],
  ['recuerdos', 'memoria', 'recuerdos', 'lembranças', 'memories'],
  ['ancestros', 'memoria', 'ancestros', 'ancestrais', 'ancestors'],
  ['tradiciones', 'memoria', 'tradiciones', 'tradições', 'traditions'],
  ['objetos', 'memoria', 'objetos', 'objetos', 'objects'],
  ['lugares-que-ya-no-existen', 'memoria', 'lugares que ya no existen', 'lugares que já não existem', 'places that no longer exist'],
  ['historia-de-un-lugar', 'memoria', 'historia de un lugar', 'história de um lugar', 'story of a place'],
  ['hogar', 'territorio', 'hogar', 'lar', 'home'],
  ['barrio', 'territorio', 'barrio', 'bairro', 'neighborhood'],
  ['ciudad', 'territorio', 'ciudad', 'cidade', 'city'],
  ['campo', 'territorio', 'campo', 'campo', 'countryside'],
  ['naturaleza', 'territorio', 'naturaleza', 'natureza', 'nature'],
  ['mar', 'territorio', 'mar', 'mar', 'sea'],
  ['montana', 'territorio', 'montaña', 'montanha', 'mountain'],
  ['clima', 'territorio', 'clima', 'clima', 'climate'],
  ['partir', 'migracion', 'partir', 'partir', 'leaving'],
  ['llegar', 'migracion', 'llegar', 'chegar', 'arriving'],
  ['exilio', 'migracion', 'exilio', 'exílio', 'exile'],
  ['frontera', 'migracion', 'frontera', 'fronteira', 'border'],
  ['regreso', 'migracion', 'regreso', 'retorno', 'return'],
  ['viajes', 'migracion', 'viajes', 'viagens', 'travel'],
  ['raices', 'migracion', 'raíces', 'raízes', 'roots'],
  ['lengua', 'migracion', 'lengua', 'língua', 'language'],
  ['trabajo', 'trabajo', 'trabajo', 'trabalho', 'work'],
  ['oficios', 'trabajo', 'oficios', 'ofícios', 'trades'],
  ['estudio', 'trabajo', 'estudio', 'estudo', 'study'],
  ['emprendimiento', 'trabajo', 'emprendimiento', 'empreendimento', 'entrepreneurship'],
  ['primer-empleo', 'trabajo', 'primer empleo', 'primeiro emprego', 'first job'],
  ['jubilacion', 'trabajo', 'jubilación', 'aposentadoria', 'retirement'],
  ['salud', 'cuerpo', 'salud', 'saúde', 'health'],
  ['enfermedad', 'cuerpo', 'enfermedad', 'doença', 'illness'],
  ['cuidado-de-otros', 'cuerpo', 'cuidado de otros', 'cuidado de outros', 'caring for others'],
  ['deporte', 'cuerpo', 'deporte', 'esporte', 'sport'],
  ['cuerpo', 'cuerpo', 'cuerpo', 'corpo', 'body'],
  ['envejecer', 'cuerpo', 'envejecer', 'envelhecer', 'growing older'],
  ['duelo', 'perdidas', 'duelo', 'luto', 'grief'],
  ['despedidas', 'perdidas', 'despedidas', 'despedidas', 'farewells'],
  ['crisis', 'perdidas', 'crisis', 'crise', 'crisis'],
  ['decisiones', 'perdidas', 'decisiones', 'decisões', 'decisions'],
  ['comenzar-de-nuevo', 'perdidas', 'comenzar de nuevo', 'começar de novo', 'starting over'],
  ['miedo', 'perdidas', 'miedo', 'medo', 'fear'],
  ['valentia', 'perdidas', 'valentía', 'coragem', 'courage'],
  ['identidad', 'identidad', 'identidad', 'identidade', 'identity'],
  ['pertenencia', 'identidad', 'pertenencia', 'pertencimento', 'belonging'],
  ['fe-espiritualidad', 'identidad', 'fe y espiritualidad', 'fé e espiritualidade', 'faith and spirituality'],
  ['genero', 'identidad', 'género', 'gênero', 'gender'],
  ['pueblos-originarios', 'identidad', 'pueblos originarios', 'povos originários', 'Indigenous peoples'],
  ['diversidad', 'identidad', 'diversidad', 'diversidade', 'diversity'],
  ['organizacion', 'comunidad', 'organización', 'organização', 'organizing'],
  ['solidaridad', 'comunidad', 'solidaridad', 'solidariedade', 'solidarity'],
  ['derechos', 'comunidad', 'derechos', 'direitos', 'rights'],
  ['justicia', 'comunidad', 'justicia', 'justiça', 'justice'],
  ['protesta', 'comunidad', 'protesta', 'protesto', 'protest'],
  ['educacion', 'comunidad', 'educación', 'educação', 'education'],
  ['vida-publica', 'comunidad', 'vida pública', 'vida pública', 'public life'],
  ['musica', 'cultura', 'música', 'música', 'music'],
  ['arte', 'cultura', 'arte', 'arte', 'art'],
  ['comida', 'cultura', 'comida', 'comida', 'food'],
  ['fiestas', 'cultura', 'fiestas', 'festas', 'celebrations'],
  ['juego', 'cultura', 'juego', 'brincadeira', 'play'],
  ['humor', 'cultura', 'humor', 'humor', 'humor'],
  ['cine-lectura', 'cultura', 'cine y lectura', 'cinema e leitura', 'film and reading'],
  ['esperanza', 'suenos', 'esperanza', 'esperança', 'hope'],
  ['proyectos', 'suenos', 'proyectos', 'projetos', 'projects'],
  ['deseos', 'suenos', 'deseos', 'desejos', 'wishes'],
  ['cartas-al-futuro', 'suenos', 'cartas al futuro', 'cartas para o futuro', 'letters to the future'],
  ['lo-que-vendra', 'suenos', 'lo que vendrá', 'o que virá', 'what is to come'],
];

export const TEMAS: readonly Tema[] = TEMA_ROWS.map(([id, eje, es, pt, en]) => ({ id, eje, es, pt, en }));

export const TEMAS_MAP: Record<string, Tema> = Object.fromEntries(TEMAS.map((tema) => [tema.id, tema]));

const EJES_MAP: Record<string, Eje> = Object.fromEntries(EJES.map((eje) => [eje.id, eje]));

export function getTema(id: string | null | undefined): Tema | undefined {
  if (!id) return undefined;
  return TEMAS_MAP[id];
}

export function getTemaBySlug(slug: string): Tema | undefined {
  return getTema(slug);
}

export function getEje(id: string | null | undefined): Eje | undefined {
  if (!id) return undefined;
  return EJES_MAP[id];
}

export function temasDeEje(ejeId: string): Tema[] {
  return TEMAS.filter((tema) => tema.eje === ejeId);
}

export function ejeDeTema(temaId: string): EjeId | null {
  return getTema(temaId)?.eje ?? null;
}

export function labelTema(id: string, locale: Locale): string {
  const tema = getTema(id);
  return tema ? tema[locale] : '';
}

export function labelEje(id: string, locale: Locale): string {
  const eje = getEje(id);
  return eje ? eje[locale] : '';
}

/** 1 a 3 temas conocidos. El eje se deriva y no se pide aparte. */
export function temasGuardados(value: unknown): { temas: string[]; ejes: string[] } | null {
  if (!Array.isArray(value)) return null;
  const temas: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !TEMAS_MAP[item] || temas.includes(item)) continue;
    temas.push(item);
  }
  if (temas.length < 1 || temas.length > 3 || temas.length !== value.filter((item) => typeof item === 'string').length) {
    return null;
  }
  const ejes = [...new Set(temas.map((id) => TEMAS_MAP[id].eje))];
  return { temas, ejes };
}

export function idsPublicos(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && Boolean(TEMAS_MAP[item]));
}

export function ejesPublicos(temas: string[], stored?: unknown): string[] {
  const fromTemas = [...new Set(temas.map((id) => TEMAS_MAP[id]?.eje).filter((id): id is EjeId => Boolean(id)))];
  if (fromTemas.length) return fromTemas;
  if (!Array.isArray(stored)) return [];
  return stored.filter((item): item is string => typeof item === 'string' && Boolean(EJES_MAP[item]));
}

/** Texto de ejes y temas en los tres idiomas, para el buscador público. */
export function temasSearchText(temaIds: string[] | undefined): string {
  const parts: string[] = [];
  for (const id of temaIds ?? []) {
    const tema = getTema(id);
    if (!tema) continue;
    const eje = getEje(tema.eje);
    parts.push(tema.es, tema.pt, tema.en);
    if (eje) parts.push(eje.es, eje.pt, eje.en);
  }
  return parts.join(' ');
}

/** Coincidencia simple para el panel de curación que aún importa esta función. */
export function detectarTemas(texto: string): string[] {
  const lower = texto.toLowerCase();
  const matches: { id: string; score: number }[] = [];
  for (const tema of TEMAS) {
    const words = `${tema.es} ${tema.pt} ${tema.en}`.toLowerCase().split(/[^a-záéíóúñâêôãõçü]+/).filter((word) => word.length > 3);
    const score = words.filter((word) => lower.includes(word)).length;
    if (score > 0) matches.push({ id: tema.id, score });
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, 3).map((item) => item.id);
}
