/**
 * Temas para submissions (formulario /subir) y filtros.
 * Fuente única: lib/temas.ts (20 temas).
 */
import { TEMAS } from '@/lib/temas'

export const THEME_LIST = TEMAS.map((t) => ({ id: t.slug, label: t.titulo })) as ReadonlyArray<{
  id: string
  label: string
}>

export type ThemeId = (typeof THEME_LIST)[number]['id']

export const THEME_IDS: readonly ThemeId[] = THEME_LIST.map((t) => t.id)

export function getThemeLabel(id: string): string {
  return THEME_LIST.find((t) => t.id === id)?.label ?? id
}
