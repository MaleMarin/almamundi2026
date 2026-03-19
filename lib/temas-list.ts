/**
 * Temas para /temas y /temas/[slug].
 * Fuente: lib/temas.ts (20 temas con slug, titulo, descripcion, color, keywords).
 */
import { TEMAS as TEMAS_SOURCE, getTemaBySlug as getTemaBySlugSource } from '@/lib/temas'

export type TemaItem = {
  slug: string
  name: string
  description?: string
  color: string
}

/** Lista para la UI: slug, name (titulo), description (descripcion), color */
export const TEMAS: TemaItem[] = TEMAS_SOURCE.map((t) => ({
  slug: t.slug,
  name: t.titulo,
  description: t.descripcion,
  color: t.color,
}))

export function getTemaBySlug(slug: string): TemaItem | undefined {
  const t = getTemaBySlugSource(slug)
  if (!t) return undefined
  return { slug: t.slug, name: t.titulo, description: t.descripcion, color: t.color }
}

/** Normaliza un tema de historia para comparar con slug (lowercase, sin acentos). */
export function normalizeTemaForMatch(t: string | undefined): string {
  if (!t || typeof t !== 'string') return ''
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u0300-\u036f/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}
