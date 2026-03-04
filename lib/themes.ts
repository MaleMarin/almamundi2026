/**
 * Temas (fuente única) para submissions y filtros.
 */

export const THEME_LIST = [
  { id: "vida", label: "Vida cotidiana" },
  { id: "migracion", label: "Migración y fronteras" },
  { id: "trabajo", label: "Trabajo y dignidad" },
  { id: "amor", label: "Amor y vínculos" },
  { id: "duelo", label: "Duelo y pérdida" },
  { id: "cuidado", label: "Cuidado y comunidad" },
  { id: "identidad", label: "Identidad y pertenencia" },
  { id: "salud", label: "Salud y cuerpo" },
  { id: "naturaleza", label: "Naturaleza y territorio" },
  { id: "ciudad", label: "Ciudad y memoria" },
  { id: "conflictos", label: "Conflictos y decisiones" },
  { id: "politica", label: "Política y ciudadanía" },
] as const;

export type ThemeId = (typeof THEME_LIST)[number]["id"];

export const THEME_IDS: readonly ThemeId[] = THEME_LIST.map((t) => t.id);

export function getThemeLabel(id: string): string {
  return THEME_LIST.find((t) => t.id === id)?.label ?? id;
}
