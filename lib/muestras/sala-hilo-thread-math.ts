/** Curva del hilo y posiciones de nudos (compartido sala 2D/3D). */

export const ty = (x: number, W: number, H: number, t: number) => {
  const amp = 36;
  const freq = (2 * Math.PI) / (W * 0.88);
  return (
    H * 0.48 +
    Math.sin(x * freq + t * 0.5) * amp +
    Math.sin(x * freq * 0.4 + t * 0.28) * 15
  );
};

export const kpos = (W: number, H: number, t: number, count: number) => {
  if (count <= 0) return [];
  if (count === 1) {
    const x = W / 2;
    return [{ x, y: ty(x, W, H, t) }];
  }
  const mg = W * 0.1;
  const sp = (W - mg * 2) / (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const x = mg + i * sp;
    return { x, y: ty(x, W, H, t) };
  });
};

export function truncThreeWords(s: string): string {
  const w = s.trim().split(/\s+/).filter(Boolean);
  if (w.length <= 3) return w.join(' ');
  return `${w.slice(0, 3).join(' ')}…`;
}
