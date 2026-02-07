/**
 * Campos de resonancia (world_items.fields).
 * Usado para validar y filtrar en GET /api/world/field/[field].
 */
export const FIELD_VALUES = [
  "condicion-humana",
  "conflicto-geopolitica",
  "economia-finanzas",
  "tecnologia-vida",
  "creacion",
  "memoria-testimonio",
  "naturaleza-territorio",
  "comunidad-transformacion",
  "buenas-noticias",
] as const;

export type Field = (typeof FIELD_VALUES)[number];

export const MODES = ["now", "today"] as const;
export type Mode = (typeof MODES)[number];

export type WorldSource = {
  name: string;
  url: string;
  publishedAt: unknown;
};

export type WorldItem = {
  kind: "news";
  title: string;
  summary?: string;
  publishedAt: unknown;
  ingestedAt: unknown;
  fields: string[];
  intensity: number;
  sources: WorldSource[];
  sourceCount: number;
  dedupeKey: string;
  isActive: boolean;
};

export type WorldItemDoc = WorldItem & { id: string };

/** Serializado para JSON (timestamps → ISO). */
export type WorldItemSerialized = Omit<WorldItemDoc, "publishedAt" | "ingestedAt" | "sources"> & {
  publishedAt: string;
  ingestedAt: string;
  sources: { name: string; url: string; publishedAt: string }[];
};

export type WorldResponse = {
  mode: Mode;
  updatedAt: string;
  items: WorldItemSerialized[];
};

export function isField(s: string): s is Field {
  return (FIELD_VALUES as readonly string[]).includes(s);
}

export function isMode(s: string): s is Mode {
  return s === "now" || s === "today";
}
