'use client';

import { useEffect, useState } from 'react';

export type UserPosition = { lat: number; lng: number } | null;

/**
 * Obtiene la posición del usuario con la API de geolocalización del navegador.
 * Así cada uno que abre el programa puede ver el mapa (y la hora) según dónde está.
 * - Pide permiso la primera vez.
 * - Si el usuario niega o hay error, devuelve null (se usa vista por defecto).
 * - maximumAge permite usar posición en caché unos minutos sin volver a preguntar.
 */
export function useUserPosition(): UserPosition {
  const [position, setPosition] = useState<UserPosition>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // Usuario denegó, timeout o error: no hacer nada, position queda null
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // 5 min cache
      }
    );
  }, []);

  return position;
}
