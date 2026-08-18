/**
 * lib/userLocation.ts
 *
 * Obtiene la ubicación aproximada del usuario.
 * Solo se usa cuando el usuario termina de leer una historia.
 * No se guarda ningún dato de identificación.
 */

export type ApproxLocation = {
  lat: number;
  lng: number;
};

let cachedLocation: ApproxLocation | null = null;

/**
 * Intenta obtener la ubicación del usuario de forma silenciosa.
 * Cachea el resultado para no pedir permiso múltiples veces.
 */
export async function getApproxLocation(): Promise<ApproxLocation | null> {
  if (cachedLocation) return cachedLocation;
  if (typeof window === 'undefined') return null;

  if (navigator.geolocation) {
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
    }
  }

  return null;
}

/** Registra una huella en el servidor de forma silenciosa. */
export async function registerPulse(storyId: string): Promise<void> {
  const loc = await getApproxLocation();
  if (!loc) return;

  try {
    await fetch('/api/pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: loc.lat, lng: loc.lng, storyId }),
    });
  } catch {
    // Silencioso
  }
}
