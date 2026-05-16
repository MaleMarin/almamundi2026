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
    subtitle: 'Sube hasta 6 fotos. Cada una puede tener su historia.',
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

export const UPLOAD_PHOTO_MAX_MESSAGE = 'Solo puedes subir hasta 6 fotos.';

/** Contador en naranja editorial a partir de este umbral (texto). */
export const SUBIR_TEXT_COUNTER_WARN_CHARS = 4500;
