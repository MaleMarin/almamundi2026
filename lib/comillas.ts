/**
 * Comillas tipográficas, como las pone un procesador de texto:
 * "hola" → “hola”, 'hola' → ‘hola’, l'eau → l’eau.
 */
export function comillasTipograficas(texto: string): string {
  if (!texto || !/["']/.test(texto)) return texto;
  return texto
    .replace(/(^|[\s([{«¿¡—–-])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s([{«¿¡—–-])'/g, '$1‘')
    .replace(/'/g, '’');
}
