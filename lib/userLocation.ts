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
      // Sin permiso o timeout
    }
  }

  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    const data = (await res.json()) as { latitude?: number; longitude?: number; country_code?: string; country?: string };
    if (data.latitude != null && data.longitude != null) {
      let lat = Math.round(data.latitude * 10) / 10;
      let lng = Math.round(data.longitude * 10) / 10;
      const isChile = data.country_code === 'CL' || data.country === 'CL';
      if (isChile) {
        lat = -33.37;
        lng = -71.65;
      }
      cachedLocation = { lat, lng };
      return cachedLocation;
    }
  } catch {
    // Silencioso
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
