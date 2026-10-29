/**
 * Versión de los textos que la persona acepta al enviar.
 * Términos: vigencia agosto 2026. Política de privacidad: 27 de agosto de 2026.
 */
export const LEGAL_TEXTS_VERSION = "terminos-agosto-2026+privacidad-2026-08-27";

export type ConsentRow = {
  label: string;
  accepted: boolean;
  at: number | null;
};

const LABELS = {
  adult: "Mayor de 18 o adulto responsable",
  publish: "Autorización de publicar imagen, voz y nombre",
  terms: "Términos",
  privacy: "Política de privacidad",
} as const;

function flag(data: Record<string, unknown>, key: string): boolean {
  return data[key] === true;
}

function consentedAt(data: Record<string, unknown>): number | null {
  const value = data.consentedAt;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  return null;
}

function legacyTermsAccepted(data: Record<string, unknown>): boolean {
  const consent = data.consent;
  if (!consent || typeof consent !== "object" || Array.isArray(consent)) return false;
  return (consent as Record<string, unknown>).termsAccepted === true;
}

/**
 * Cuatro casillas para el admin.
 * Los envíos viejos de /contar guardaron la declaración de mayoría de edad
 * en `consentPrivacyPolicy`, y Términos y privacidad en una sola casilla
 * `consentTerminos`. Sin `consentTextsVersion` no hay registro aparte de la privacidad.
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
  const versioned = Boolean(version) && flag(data, "consentAdult");
  const legacyTrio =
    !versioned &&
    flag(data, "consentPrivacyPolicy") &&
    flag(data, "consentPublicacion") &&
    flag(data, "consentTerminos");

  const adult = flag(data, "consentAdult") || legacyTrio;
  const publish = flag(data, "consentPublicacion");
  const terms = flag(data, "consentTerminos") || legacyTermsAccepted(data);
  const privacy = versioned && flag(data, "consentPrivacyPolicy");
  const when = (accepted: boolean) => (accepted ? at : null);

  return {
    version,
    rows: [
      { label: LABELS.adult, accepted: adult, at: when(adult) },
      { label: LABELS.publish, accepted: publish, at: when(publish) },
      { label: LABELS.terms, accepted: terms, at: when(terms) },
      { label: LABELS.privacy, accepted: privacy, at: when(privacy) },
    ],
  };
}
