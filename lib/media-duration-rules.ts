/**
 * Duración máxima para audio y video en envíos (5 minutos).
 * Usar en cliente: las funciones de sondeo crean elementos <audio> en el DOM.
 */

export const MAX_AUDIO_VIDEO_DURATION_SECONDS = 5 * 60;

export function isDurationWithinMax(seconds: number | null | undefined): boolean {
  if (seconds == null || !Number.isFinite(seconds)) return true;
  return seconds <= MAX_AUDIO_VIDEO_DURATION_SECONDS;
}

/** Duración de un archivo de audio local (segundos), o null si no se puede leer. */
export function probeAudioFileDurationSeconds(file: File): Promise<number | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const el = document.createElement('audio');
    const objectUrl = URL.createObjectURL(file);
    const finish = (sec: number | null) => {
      URL.revokeObjectURL(objectUrl);
      el.removeAttribute('src');
      resolve(sec);
    };
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      const d = el.duration;
      finish(Number.isFinite(d) ? d : null);
    };
    el.onerror = () => finish(null);
    el.src = objectUrl;
  });
}

/** Duración de un archivo de video local (segundos), o null si no se puede leer. */
export function probeVideoFileDurationSeconds(file: File): Promise<number | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const el = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    const finish = (sec: number | null) => {
      URL.revokeObjectURL(objectUrl);
      el.removeAttribute('src');
      resolve(sec);
    };
    el.preload = 'metadata';
    el.muted = true;
    el.onloadedmetadata = () => {
      const d = el.duration;
      finish(Number.isFinite(d) ? d : null);
    };
    el.onerror = () => finish(null);
    el.src = objectUrl;
  });
}

/** Duración de un audio remoto (segundos). Puede fallar por CORS; entonces null. */
export function probeAudioUrlDurationSeconds(url: string): Promise<number | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const el = document.createElement('audio');
    el.preload = 'metadata';
    el.crossOrigin = 'anonymous';
    el.onloadedmetadata = () => {
      const d = el.duration;
      el.removeAttribute('src');
      resolve(Number.isFinite(d) ? d : null);
    };
    el.onerror = () => {
      el.removeAttribute('src');
      resolve(null);
    };
    el.src = url;
  });
}

/**
 * Vimeo expone duración vía oEmbed. YouTube no incluye duración en oEmbed público.
 */
export async function fetchVimeoVideoDurationSeconds(videoPageUrl: string): Promise<number | null> {
  try {
    const u = new URL(videoPageUrl);
    if (!/vimeo\.com$/i.test(u.hostname) && !/www\.vimeo\.com$/i.test(u.hostname)) {
      return null;
    }
    const r = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoPageUrl)}`
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { duration?: number };
    return typeof j.duration === 'number' && Number.isFinite(j.duration) ? j.duration : null;
  } catch {
    return null;
  }
}
