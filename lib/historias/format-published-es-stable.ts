/**
 * Fecha en español idéntica en SSR (Node) y en el cliente.
 * `toLocaleDateString` difiere entre entornos y rompe la hidratación de React.
 */

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

/**
 * @returns Texto tipo «15 de marzo de 2024», o «—» si no es parseable.
 */
export function formatPublishedAtEsStable(iso: string | undefined): string {
  if (!iso) return '—';
  const trimmed = iso.trim();
  const cal = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (cal) {
    const year = Number(cal[1]);
    const monthIdx = parseInt(cal[2], 10) - 1;
    const day = parseInt(cal[3], 10);
    if (monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
      return `${day} de ${MONTHS_ES[monthIdx]} de ${year}`;
    }
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getUTCDate()} de ${MONTHS_ES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}
