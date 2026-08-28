/**
 * Motivos públicos de rechazo (Santa Clara: razón clara, sin jerga).
 * Usable en cliente (panel) y en servidor (API / correo).
 */

export const REJECTION_REASON_IDS = [
  "off_topic",
  "rights_third_party",
  "minors",
  "quality_incomplete",
  "duplicate",
  "other",
] as const;

export type RejectionReasonId = (typeof REJECTION_REASON_IDS)[number];

export const REJECTION_REASON_DETAIL_MAX = 400;
export const REJECTION_REASON_DETAIL_MIN_OTHER = 8;

type Option = {
  id: RejectionReasonId;
  /** Etiqueta corta para el panel de curación. */
  label: string;
  /** Texto que recibe la persona. `null` = hay que escribirlo. */
  publicText: string | null;
};

export const REJECTION_REASON_OPTIONS: readonly Option[] = [
  {
    id: "off_topic",
    label: "No encaja con AlmaMundi",
    publicText:
      "Esta historia no encaja con lo que AlmaMundi publica en este momento.",
  },
  {
    id: "rights_third_party",
    label: "Derechos o datos de otras personas",
    publicText:
      "No pudimos publicar esta historia: no cumple con nuestra guía de conducta en cuanto al respeto de otras personas (imagen, derechos o datos sin un consentimiento claro).",
  },
  {
    id: "minors",
    label: "Involucra a menores de edad",
    publicText:
      "No pudimos publicar esta historia: no cumple con nuestra guía de conducta en cuanto al cuidado de menores de edad. Hace falta que quede clara la autorización de un adulto responsable o de una institución.",
  },
  {
    id: "quality_incomplete",
    label: "Incompleta o poco clara",
    publicText:
      "Esta historia quedó incompleta o no se pudo revisar con claridad.",
  },
  {
    id: "duplicate",
    label: "Envío repetido o muy similar",
    publicText:
      "Ya tenemos una historia muy similar, o este envío parece repetido.",
  },
  {
    id: "other",
    label: "Otro (escribir el motivo)",
    publicText: null,
  },
];

function isReasonId(v: string): v is RejectionReasonId {
  return (REJECTION_REASON_IDS as readonly string[]).includes(v);
}

export function resolvePublicRejectionText(
  reasonId: unknown,
  detail?: unknown
): { ok: true; reasonId: RejectionReasonId; publicText: string; detail: string } | { ok: false; error: string } {
  if (typeof reasonId !== "string" || !isReasonId(reasonId)) {
    return { ok: false, error: "Elige un motivo de rechazo." };
  }
  const option = REJECTION_REASON_OPTIONS.find((o) => o.id === reasonId);
  if (!option) return { ok: false, error: "Elige un motivo de rechazo." };

  const extra =
    typeof detail === "string" ? detail.replace(/\s+/g, " ").trim().slice(0, REJECTION_REASON_DETAIL_MAX) : "";

  if (reasonId === "other") {
    if (extra.length < REJECTION_REASON_DETAIL_MIN_OTHER) {
      return { ok: false, error: "Escribe el motivo (al menos unas palabras) para que la persona lo entienda." };
    }
    return { ok: true, reasonId, publicText: extra, detail: extra };
  }

  const base = option.publicText ?? "";
  const publicText = extra ? `${base} ${extra}` : base;
  return { ok: true, reasonId, publicText, detail: extra };
}
