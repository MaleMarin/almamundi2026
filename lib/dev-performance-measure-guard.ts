/**
 * Next.js 16 + React 19 (dev/Turbopack) a veces llama performance.measure() con marcas
 * inválidas → "cannot have a negative time stamp". No afecta producción.
 * @see https://github.com/vercel/next.js/issues/86060
 */
'use client';

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const perf = globalThis.performance;
  const key = '__almamundiPerfMeasureGuard';
  if (perf && !(key in perf)) {
    Object.defineProperty(perf, key, { value: true, enumerable: false });
    const original = perf.measure.bind(perf);
    perf.measure = ((...args: Parameters<Performance['measure']>) => {
      try {
        return original(...args);
      } catch (err) {
        if (
          err instanceof TypeError &&
          typeof err.message === 'string' &&
          (err.message.includes('negative time stamp') ||
            err.message.includes("does not exist"))
        ) {
          return undefined;
        }
        throw err;
      }
    }) as Performance['measure'];
  }
}
