import "server-only";
import type { Metadata } from "next";
import type { AlmaLocale } from "@/lib/i18n/locale";
import { PUBLIC_OG_LOCALE, publicSiteMeta } from "@/lib/i18n/public-meta";

/** Primer valor de un parámetro de la URL (igual que `useSearchParams().get`). */
export function primerParametro(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Metadatos de la vista de una pregunta (?p=id) en las páginas internas de preguntas y respuestas:
 * dirección propia solo con `p` (sin `r` ni `responder`), y título y bajada de esa pregunta.
 * La imagen y el resto de Open Graph son los del sitio, como en la página principal.
 */
export function metadataDePregunta({
  ruta,
  id,
  titulo,
  descripcion,
  locale,
}: {
  ruta: "/respuestas-a-almamundi" | "/preguntas-de-las-personas";
  id: string;
  titulo: string;
  descripcion: string;
  locale: AlmaLocale;
}): Metadata {
  const url = `${ruta}?p=${encodeURIComponent(id)}`;
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: url },
    openGraph: {
      title: titulo,
      description: descripcion,
      url,
      type: "website",
      locale: PUBLIC_OG_LOCALE[locale],
      siteName: "AlmaMundi",
      images: [{ url: "/og/sitio?v=3", width: 1200, height: 630, alt: publicSiteMeta(locale).ogAlt }],
    },
  };
}
