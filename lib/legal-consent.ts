/**
 * Versión de los textos que la persona acepta al enviar.
 * Términos: vigencia agosto 2026. Política de privacidad: 27 de agosto de 2026.
 */
export const LEGAL_TEXTS_VERSION = "terminos-agosto-2026+privacidad-2026-08-27";

export type ConsentRow = {
  label: string;
  accepted: boolean;
  at: number | null;
  /** No hay campo guardado para este consentimiento. */
  missing: boolean;
  /** Viene de las tres casillas anteriores. */
  legacy: boolean;
};

const LABELS = {
  adult: "Mayor de 18 o adulto responsable",
  publish: "Autoriza publicar imagen, voz y nombre",
  terms: "Términos de Uso",
  privacy: "Política de privacidad",
} as const;

function flag(data: Record<string, unknown>, key: string): boolean {
  return data[key] === true;
}

function hasField(data: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(data, key);
}

function consentedAt(data: Record<string, unknown>): number | null {
  const value = data.consentedAt;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  return null;
}

function consentMap(data: Record<string, unknown>): Record<string, unknown> | null {
  const consent = data.consent;
  if (!consent || typeof consent !== "object" || Array.isArray(consent)) return null;
  return consent as Record<string, unknown>;
}

function row(
  label: string,
  accepted: boolean,
  at: number | null,
  missing: boolean,
  legacy: boolean
): ConsentRow {
  return {
    label,
    accepted: missing ? false : accepted,
    at: missing || !accepted ? null : at,
    missing,
    legacy: missing ? false : legacy,
  };
}

/**
 * Cuatro casillas para el admin.
 * Formato anterior de tres campos: `consentPrivacyPolicy` acepta mayoría de edad
 * y la Política de privacidad, `consentTerminos` es Términos de Uso y
 * `consentPublicacion` autoriza imagen, voz y nombre.
 * `story_submissions` guarda `consent.termsAccepted` y `consent.license`.
 */
export function consentRowsFromRecord(data: Record<string, unknown>): {
  rows: ConsentRow[];
  version: string | null;
} {
  const version =
    typeof data.consentTextsVersion === "string" && data.consentTextsVersion.trim()
      ? data.consentTextsVersion.trim()
      : null;
  const at = consentedAt(data);
  const versioned = Boolean(version) && hasField(data, "consentAdult");
  const legacyFields =
    !versioned &&
    (hasField(data, "consentPrivacyPolicy") ||
      hasField(data, "consentTerminos") ||
      hasField(data, "consentPublicacion"));

  if (versioned) {
    return {
      version,
      rows: [
        row(LABELS.adult, flag(data, "consentAdult"), at, !hasField(data, "consentAdult"), false),
        row(LABELS.publish, flag(data, "consentPublicacion"), at, !hasField(data, "consentPublicacion"), false),
        row(LABELS.terms, flag(data, "consentTerminos"), at, !hasField(data, "consentTerminos"), false),
        row(LABELS.privacy, flag(data, "consentPrivacyPolicy"), at, !hasField(data, "consentPrivacyPolicy"), false),
      ],
    };
  }

  if (legacyFields) {
    const privacyOn = flag(data, "consentPrivacyPolicy");
    const privacyMissing = !hasField(data, "consentPrivacyPolicy");
    return {
      version,
      rows: [
        row(LABELS.adult, privacyOn, at, privacyMissing, true),
        row(LABELS.publish, flag(data, "consentPublicacion"), at, !hasField(data, "consentPublicacion"), true),
        row(LABELS.terms, flag(data, "consentTerminos"), at, !hasField(data, "consentTerminos"), true),
        row(LABELS.privacy, privacyOn, at, privacyMissing, true),
      ],
    };
  }

  const legacyConsent = consentMap(data);
  if (legacyConsent) {
    const termsOn = legacyConsent.termsAccepted === true;
    const publishOn = legacyConsent.license === "allow_publish";
    return {
      version,
      rows: [
        row(LABELS.adult, false, null, true, false),
        row(LABELS.publish, publishOn, null, !hasField(legacyConsent, "license"), false),
        row(LABELS.terms, termsOn, null, !hasField(legacyConsent, "termsAccepted"), false),
        row(LABELS.privacy, false, null, true, false),
      ],
    };
  }

  return {
    version,
    rows: [
      row(LABELS.adult, false, null, true, false),
      row(LABELS.publish, false, null, true, false),
      row(LABELS.terms, false, null, true, false),
      row(LABELS.privacy, false, null, true, false),
    ],
  };
}
