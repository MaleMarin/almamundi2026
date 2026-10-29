import "server-only";
import type { DocumentReference } from "firebase-admin/firestore";
import { formatPublicPlace } from "@/lib/historias/story-ubicacion";

const geocodeCache = new Map<string, { lat: number; lng: number }>();

/** 2 a 5 km en una dirección al azar. Se guarda una sola vez, nunca el punto exacto. */
export function jitterPublicPoint(lat: number, lng: number): { lat: number; lng: number } {
  const km = 2 + Math.random() * 3;
  const bearing = Math.random() * Math.PI * 2;
  const latRad = (lat * Math.PI) / 180;
  const dLat = (km / 111) * Math.cos(bearing);
  const cos = Math.cos(latRad);
  const dLng = (km / (111 * (Math.abs(cos) < 0.2 ? 0.2 : cos))) * Math.sin(bearing);
  let nextLng = lng + dLng;
  if (nextLng > 180) nextLng -= 360;
  if (nextLng < -180) nextLng += 360;
  return { lat: Math.min(90, Math.max(-90, lat + dLat)), lng: nextLng };
}

/** Ciudad y país, con el desplazamiento público ya aplicado. */
export async function geocodePublicPlace(
  city: string,
  country: string
): Promise<{ lat: number; lng: number } | null> {
  const place = formatPublicPlace(city, country);
  const hit = await geocodeCityCountry(place || city, "");
  if (!hit) return null;
  return jitterPublicPoint(hit.lat, hit.lng);
}

function hasStoredPoint(lat: unknown, lng: unknown): boolean {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng);
}

/** Escribe lat y lng solo si el documento todavía no los tiene. */
export async function writeCoordsIfMissing(
  ref: DocumentReference,
  city: string,
  country: string
): Promise<void> {
  const point = await geocodePublicPlace(city, country);
  if (!point) return;
  await ref.firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    if (hasStoredPoint(snap.get("lat"), snap.get("lng"))) return;
    tx.update(ref, { lat: point.lat, lng: point.lng });
  });
}

/**
 * Coordenadas de ciudad y país. Si Nominatim no responde, se reintenta en la siguiente lectura.
 */
export async function geocodeCityCountry(
  city: string,
  country: string
): Promise<{ lat: number; lng: number } | null> {
  const q = [city, country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ")
    .replace(/\s+/g, " ")
    .slice(0, 160);
  if (q.length < 3) return null;
  const cached = geocodeCache.get(q.toLocaleLowerCase("es-CL"));
  if (cached) return cached;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", q);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "AlmaMundi/1.0 (https://www.almamundi.org)",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const hit = Array.isArray(data) ? data[0] : null;
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    const point = { lat, lng };
    geocodeCache.set(q.toLocaleLowerCase("es-CL"), point);
    return point;
  } catch {
    return null;
  }
}
