/** Preferencia: no autoplay de video en datos móviles. */

export const DATA_SAVER_AUTOPLAY_KEY = 'am-no-autoplay-mobile-data';
export const DATA_SAVER_AUTOPLAY_EVENT = 'am-data-saver-change';

type NetworkConnection = {
  saveData?: boolean;
  type?: string;
  effectiveType?: string;
  addEventListener?: (type: string, fn: () => void) => void;
  removeEventListener?: (type: string, fn: () => void) => void;
};

export function getNetworkConnection(): NetworkConnection | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const nav = navigator as Navigator & {
    connection?: NetworkConnection;
    mozConnection?: NetworkConnection;
    webkitConnection?: NetworkConnection;
  };
  return nav.connection || nav.mozConnection || nav.webkitConnection;
}

/** `null` si el navegador no expone Network Information (p. ej. Safari). */
export function isMeteredOrCellular(): boolean | null {
  const c = getNetworkConnection();
  if (!c) return null;
  if (c.saveData) return true;
  if (c.type === 'cellular') return true;
  if (c.effectiveType === 'slow-2g' || c.effectiveType === '2g' || c.effectiveType === '3g') {
    return true;
  }
  return false;
}

export function readDataSaverAutoplayPref(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(DATA_SAVER_AUTOPLAY_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeDataSaverAutoplayPref(on: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DATA_SAVER_AUTOPLAY_KEY, on ? '1' : '0');
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Si la preferencia está apagada, no bloquea.
 * Si está encendida y no hay API de red, se trata como “no autoplay” (preferencia manual).
 */
export function shouldBlockVideoAutoplay(prefOn: boolean): boolean {
  if (!prefOn) return false;
  const metered = isMeteredOrCellular();
  if (metered === null) return true;
  return metered;
}
