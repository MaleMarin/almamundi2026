function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Métricas léxicas locales (sin IA): densidad, longitud media, repetición. */
export function computeTextStats(text: string) {
  const t = text.trim();
  const words = t.split(/\s+/).filter(Boolean);
  const n = words.length;
  const avgLen = n ? words.reduce((a, w) => a + w.length, 0) / n : 0;
  const punct = (t.match(/[.!?,;:—–-]/g) ?? []).length;
  const punctDensity = n ? punct / n : 0;
  const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^a-záéíóúñü0-9]+/gi, ""))).size;
  const uniqueRatio = n ? unique / n : 0;
  /** 0 = más “frío”/pausado, 1 = más “cálido”/denso (heurística visual). */
  const temperature = clamp01(
    0.28 * clamp01(avgLen / 9) + 0.22 * clamp01(punctDensity * 6) + 0.5 * uniqueRatio
  );
  return { wordCount: n, avgLen, punctDensity, uniqueRatio, temperature };
}

export function temperatureLabel(t: number): string {
  if (t < 0.33) return "Registro pausado";
  if (t < 0.66) return "Ritmo medio";
  return "Texto denso / intenso";
}
