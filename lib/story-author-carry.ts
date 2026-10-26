/**
 * Datos de quien cuenta, solo en memoria de esta pestaña.
 * No usa localStorage, sessionStorage ni cookies. Se pierde al recargar.
 * Se conserva unos segundos después de armarlo para que el cierre del modal
 * (al ir a otro formato) no lo borre en el mismo instante.
 */

export type StoryAuthorCarry = {
  alias: string;
  country: string;
  city: string;
  ageRange: string;
  sex: string;
  email: string;
};

const HOLD_MS = 2000;

let carry: StoryAuthorCarry | null = null;
let armedAt = 0;

export function armStoryAuthorCarry(next: StoryAuthorCarry): void {
  carry = {
    alias: next.alias.trim(),
    country: next.country.trim(),
    city: next.city.trim(),
    ageRange: next.ageRange.trim(),
    sex: next.sex.trim(),
    email: next.email.trim(),
  };
  armedAt = Date.now();
}

export function readStoryAuthorCarry(): StoryAuthorCarry | null {
  return carry;
}

export function clearStoryAuthorCarryIfStale(now = Date.now()): void {
  if (!carry) return;
  if (now - armedAt < HOLD_MS) return;
  carry = null;
  armedAt = 0;
}
