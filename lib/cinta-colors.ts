import {
  buildResonancePalette,
  chooseResonanceFamily,
  type HuellaV2Format,
  type HuellaV2Meta,
} from "@/lib/huella/huellaV2";

const HEX = /^#[0-9A-Fa-f]{6}$/;

function huellaFormat(raw: string | undefined): HuellaV2Format {
  const format = (raw ?? "").toLowerCase();
  if (format === "video") return "video";
  if (format === "audio") return "audio";
  if (format === "foto" || format === "image" || format === "photo" || format === "photos") {
    return "foto";
  }
  return "texto";
}

function hslToHex(value: string): string | null {
  const match = value.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i);
  if (!match) return null;
  const h = Number(match[1]) / 360;
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  const hue = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const channel = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(channel * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${hue(0)}${hue(8)}${hue(4)}`.toUpperCase();
}

/** Cuatro colores saturados de la misma paleta que pinta la huella. Sin crema ni blanco. */
export function cintaHexColors(input: {
  storyId: string;
  format?: string;
  content?: string;
}): string[] {
  const format = huellaFormat(input.format);
  const content = (input.content ?? "").trim() || input.storyId;
  const meta: HuellaV2Meta = {
    storyId: input.storyId,
    format,
    content,
    charCount: content.length,
  };
  const palette = buildResonancePalette(meta, chooseResonanceFamily(meta));
  return [palette.dominant, palette.secondaryA, palette.secondaryB, palette.accent]
    .map(hslToHex)
    .filter((color): color is string => Boolean(color));
}

export function parseStoredCintaColors(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const colors = value.filter((item): item is string => typeof item === "string" && HEX.test(item));
  return colors.length > 0 ? colors.slice(0, 4) : null;
}

export function resolveCintaColors(input: {
  storyId: string;
  format?: string;
  content?: string;
  stored?: unknown;
}): string[] {
  return parseStoredCintaColors(input.stored) ?? cintaHexColors(input);
}

/** Escribe la lista en el documento público, con el id de esa historia. */
export function stampCintaColors(story: Record<string, unknown>, storyId: string) {
  const format = typeof story.format === "string" ? story.format : undefined;
  const parts = [story.title, story.text].filter((part): part is string => typeof part === "string");
  story.cintaColors = cintaHexColors({ storyId, format, content: parts.join("\n") });
}
