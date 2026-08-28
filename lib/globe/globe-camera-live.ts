/**
 * Muestra en tiempo real hacia dónde mira la cámara del globo y el giro de la Tierra.
 * Lo escribe GlobeV2 (y el RAF de MapFullPage); el motor de ambiente lo lee sin React.
 */

export type GlobeCameraLive = {
  camX: number;
  camY: number;
  camZ: number;
  dist: number;
  earthYaw: number;
};

let live: GlobeCameraLive | null = null;

export function publishGlobeCameraLive(next: GlobeCameraLive): void {
  live = next;
}

export function getGlobeCameraLive(): GlobeCameraLive | null {
  return live;
}
