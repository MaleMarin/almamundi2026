/**
 * Temas para /temas y /temas/[slug].
 * Fuente: lib/temas.ts.
 */
import { TEMAS as TEMAS_SOURCE, getEje, getTemaBySlug as getTemaBySlugSource } from '@/lib/temas'

export type TemaItem = {
  slug: string
  name: string
  description?: string
  color: string
}

export const TEMAS: TemaItem[] = TEMAS_SOURCE.map((tema) => ({
  slug: tema.id,
  name: tema.es,
  description: getEje(tema.eje)?.es,
  color: '#FF4A1C',
}))

export function getTemaBySlug(slug: string): TemaItem | undefined {
  const tema = getTemaBySlugSource(slug)
  if (!tema) return undefined
  return { slug: tema.id, name: tema.es, description: getEje(tema.eje)?.es, color: '#FF4A1C' }
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
