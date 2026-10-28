/**
 * lib/userLocation.ts
 *
 * Obtiene la ubicación aproximada del usuario.
 * Solo se pide al tocar Resonar («Esto me llegó»).
 * No se pide al terminar de leer, oír o ver una historia.
 */

export type ApproxLocation = {
  lat: number;
  lng: number;
};

let cachedLocation: ApproxLocation | null = null;
let inFlight: Promise<ApproxLocation | null> | null = null;

/**
 * Intenta obtener la ubicación del usuario de forma silenciosa.
 * Cachea el resultado para no pedir permiso múltiples veces.
 * Llamadas concurrentes comparten la misma petición (un solo prompt).
 */
export async function getApproxLocation(): Promise<ApproxLocation | null> {
  if (cachedLocation) return cachedLocation;
  if (typeof window === 'undefined') return null;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    if (!navigator.geolocation) return null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 120_000,
          enableHighAccuracy: true,
        });
      });
      cachedLocation = {
        lat: Math.round(pos.coords.latitude * 10) / 10,
        lng: Math.round(pos.coords.longitude * 10) / 10,
      };
      return cachedLocation;
    } catch {
      // Sin permiso o timeout: no hay fallback por IP (privacidad + CSP).
      return null;
    }
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}
