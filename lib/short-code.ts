/** 6 caracteres, sin 0, o, 1, l ni i. */
export const SHORT_CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export const SHORT_CODE_LENGTH = 6;

const SHORT_CODE_PATTERN = new RegExp(`^[${SHORT_CODE_ALPHABET}]{${SHORT_CODE_LENGTH}}$`);

export function isShortCode(value: string | null | undefined): value is string {
  return typeof value === 'string' && SHORT_CODE_PATTERN.test(value);
}

export function randomShortCode(): string {
  const alphabet = SHORT_CODE_ALPHABET;
  const limit = Math.floor(256 / alphabet.length) * alphabet.length;
  let out = '';
  while (out.length < SHORT_CODE_LENGTH) {
    const bytes = new Uint8Array(SHORT_CODE_LENGTH);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= limit) continue;
      out += alphabet[byte % alphabet.length];
      if (out.length === SHORT_CODE_LENGTH) break;
    }
  }
  return out;
}
