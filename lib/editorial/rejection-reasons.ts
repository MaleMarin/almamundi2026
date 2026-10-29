/**
 * Motivos públicos de rechazo. El correo usa el idioma guardado de quien envió.
 * Usable en cliente (panel) y en servidor (API / correo).
 */

import type { AlmaLocale } from "@/lib/i18n/locale";
import { parseAlmaLocale } from "@/lib/i18n/locale";

export const REJECTION_REASON_IDS = [
  "missing_consent",
  "third_party",
  "terms",
  "file_quality",
  "copyright",
  "other",
] as const;

export type RejectionReasonId = (typeof REJECTION_REASON_IDS)[number];

export const REJECTION_REASON_DETAIL_MAX = 400;
export const REJECTION_REASON_DETAIL_MIN_OTHER = 8;

type Localized = { es: string; pt: string; en: string };

type Option = {
  id: RejectionReasonId;
  /** Etiqueta del panel, en español. */
  label: string;
  /** Texto que recibe la persona. `null` = hay que escribirlo en su idioma. */
  text: Localized | null;
};

export const REJECTION_REASON_OPTIONS: readonly Option[] = [
  {
    id: "missing_consent",
    label: "Falta el consentimiento de quien aparece",
    text: {
      es: "Falta el consentimiento de quien aparece",
      pt: "Falta o consentimento de quem aparece",
      en: "The consent of the people who appear is missing",
    },
  },
  {
    id: "third_party",
    label: "Expone datos o imágenes de otras personas sin autorización",
    text: {
      es: "Expone datos o imágenes de otras personas sin autorización",
      pt: "Expõe dados ou imagens de outras pessoas sem autorização",
      en: "It shows other people's information or images without permission",
    },
  },
  {
    id: "terms",
    label: "No cumple los términos de uso",
    text: {
      es: "No cumple los términos de uso",
      pt: "Não cumpre os termos de uso",
      en: "It does not meet the terms of use",
    },
  },
  {
    id: "file_quality",
    label: "El archivo no se puede ver o escuchar bien",
    text: {
      es: "El archivo no se puede ver o escuchar bien",
      pt: "O arquivo não pode ser visto ou ouvido direito",
      en: "The file cannot be properly seen or heard",
    },
  },
  {
    id: "copyright",
    label: "Parece contenido de otra persona o con derechos de autor",
    text: {
      es: "Parece contenido de otra persona o con derechos de autor",
      pt: "Parece conteúdo de outra pessoa ou protegido por direitos autorais",
      en: "It appears to be someone else's content or copyrighted material",
    },
  },
  {
    id: "other",
    label: "Otro",
    text: null,
  },
];

export function senderLocaleName(locale: AlmaLocale): string {
  if (locale === "pt") return "portugués";
  if (locale === "en") return "inglés";
  return "español";
}

function isReasonId(v: string): v is RejectionReasonId {
  return (REJECTION_REASON_IDS as readonly string[]).includes(v);
}

export function resolvePublicRejectionText(
  reasonId: unknown,
  detail?: unknown,
  locale?: AlmaLocale | string | null
): { ok: true; reasonId: RejectionReasonId; publicText: string; detail: string } | { ok: false; error: string } {
  if (typeof reasonId !== "string" || !isReasonId(reasonId)) {
    return { ok: false, error: "Elige un motivo de rechazo." };
  }
  const option = REJECTION_REASON_OPTIONS.find((o) => o.id === reasonId);
  if (!option) return { ok: false, error: "Elige un motivo de rechazo." };

  const extra =
    typeof detail === "string" ? detail.replace(/\s+/g, " ").trim().slice(0, REJECTION_REASON_DETAIL_MAX) : "";
  const lang = parseAlmaLocale(typeof locale === "string" ? locale : undefined);

  if (reasonId === "other") {
    if (extra.length < REJECTION_REASON_DETAIL_MIN_OTHER) {
      return {
        ok: false,
        error: `Escribe el motivo en ${senderLocaleName(lang)} (al menos unas palabras) para que la persona lo entienda.`,
      };
    }
    return { ok: true, reasonId, publicText: extra, detail: extra };
  }

  const publicText = option.text?.[lang] ?? option.text?.es ?? "";
  return { ok: true, reasonId, publicText, detail: "" };
}
