import type { SubirHuellaFormat } from '@/hooks/useSubirHuella';

export type UploadModalCopy = {
  title: string;
  subtitle: string;
  limit?: string;
  primaryCta: string;
  uploadLabel: string;
};

export const UPLOAD_MODAL_COPY: Record<SubirHuellaFormat, UploadModalCopy> = {
  video: {
    title: 'Graba el momento que todavía vive en ti',
    subtitle: 'Tu historia merece verse.',
    limit: 'Hasta 5 minutos de video.',
    primaryCta: 'Activar cámara',
    uploadLabel: 'o subir un video desde tu dispositivo',
  },
  audio: {
    title: 'Hay historias que se entienden mejor cuando se escuchan',
    subtitle: 'Tu voz guarda lo que las palabras escritas no siempre pueden.',
    limit: 'Hasta 5 minutos de audio.',
    primaryCta: 'Activar micrófono',
    uploadLabel: 'o subir un audio desde tu dispositivo',
  },
  texto: {
    title: 'Escribe lo que no le contaste a nadie,\no lo que le contaste a todos',
    subtitle: 'Aquí no se pierde en el scroll. Queda.',
    primaryCta: '',
    uploadLabel: '',
  },
  foto: {
    title: 'Una imagen puede guardar\nlo que las palabras no alcanzan',
    subtitle: 'Sube hasta 8 fotos. Cada una puede tener su historia.',
    limit: 'Hasta 8 fotos.',
    primaryCta: 'Seleccionar fotos',
    uploadLabel: '',
  },
};

export const UPLOAD_MODAL_LEGAL_NOTE =
  'Tu historia quedará en revisión antes de formar parte de AlmaMundi.';

export const UPLOAD_DURATION_ERROR = {
  video: 'Este video dura más de 5 minutos. Puedes recortarlo o subir otro.',
  audio: 'Este audio dura más de 5 minutos. Puedes recortarlo o subir otro.',
} as const;

export const UPLOAD_PHOTO_MAX_MESSAGE = 'Solo puedes subir hasta 8 fotos.';

export const UPLOAD_EXTRA_TYPE_ERROR =
  'Los adjuntos solo pueden ser imágenes: JPG, PNG, WEBP o HEIC.';

export type UploadFailureKind = 'video' | 'audio' | 'texto' | 'foto' | 'extra' | 'generic';

/** Traduce códigos del servidor / fallos de fetch a un mensaje usable. */
export function messageForUploadError(
  err: unknown,
  kind: UploadFailureKind = 'generic'
): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const code = raw.trim();

  if (code.includes('Firebase')) {
    return 'Subida no configurada. Configura Firebase en .env.local.';
  }

  if (
    code === 'invalid_type' ||
    code === 'content_type_mismatch' ||
    code === 'invalid_request'
  ) {
    if (kind === 'video') {
      return 'Este formato de video no es compatible. Prueba con .mp4, .webm o .mov.';
    }
    if (kind === 'audio') {
      return 'Este formato de audio no es compatible. Prueba con .mp3, .m4a o .wav.';
    }
    if (kind === 'foto' || kind === 'extra') {
      return 'Este formato de imagen no es compatible. Prueba con JPG, PNG, WEBP o HEIC.';
    }
    return 'Este formato de archivo no es compatible.';
  }

  if (code === 'file_too_large' || code === 'upload_413') {
    return 'El archivo es demasiado pesado. Prueba con uno más liviano.';
  }

  if (code === 'duration_too_long') {
    return kind === 'audio' ? UPLOAD_DURATION_ERROR.audio : UPLOAD_DURATION_ERROR.video;
  }

  if (code === 'uploads_paused') {
    return 'Por ahora no podemos recibir historias nuevas, estamos revisando el sitio. Intenta de nuevo en un rato.';
  }

  if (
    code === 'captcha_required' ||
    code === 'captcha_failed' ||
    code === 'captcha_verify_error' ||
    code.toLowerCase().includes('anti-bot')
  ) {
    return 'No pudimos confirmar que eres una persona. Completa la verificación e intenta de nuevo.';
  }

  const lower = code.toLowerCase();
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('network request failed')
  ) {
    return 'No pudimos enviar. Revisa tu conexión e intenta de nuevo.';
  }

  return 'No pudimos enviar. Intenta de nuevo.';
}

/** Contador en naranja editorial a partir de este umbral (texto). */
export const SUBIR_TEXT_COUNTER_WARN_CHARS = 1400;
