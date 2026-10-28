'use client';

export type UserPosition = { lat: number; lng: number } | null;

/**
 * Ya no pide la ubicación al montar. No hay una acción en el sitio que use este hook.
 */
export function useUserPosition(): UserPosition {
  return null;
}
