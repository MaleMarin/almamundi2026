/**
 * Recordatorio para casos límite en curaduría. No reemplaza el criterio de Ana.
 */

export const CONDUCT_GUIDE_HREF = "/Guia%20de%20conducta%20AlmaMundi.pdf";

export function moreInfoMailto(args: { authorEmail: string; storyTitle: string }): string {
  const to = args.authorEmail.trim();
  const title = args.storyTitle.trim() || "tu historia";
  const subject = "Sobre tu historia en AlmaMundi";
  const body = [
    "Hola,",
    "",
    `Revisamos tu historia "${title}" y, antes de decidir si publicarla, necesitamos un poco más de información.`,
    "",
    "Si la historia involucra a una persona menor de 18 años, ¿puedes confirmar que un adulto responsable o una institución autorizó este envío?",
    "",
    "Gracias por contarla.",
    "Equipo AlmaMundi",
  ].join("\n");
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
