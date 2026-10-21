import type { AlmaLocale } from '@/lib/i18n/locale';

export type StoryFlowMessages = {
  modalStep1: string;
  modalStep2: string;
  modalLeaveConfirm: string;
  modalCameraPermissionHint: string;
  modalMicPermissionHint: string;
  modalCameraDenied: string;
  modalCameraUnsupported: string;
  modalCameraBusy: string;
  modalMicDenied: string;
  modalMicUnsupported: string;
  modalMicBusy: string;
  modalSwitchToUploadVideo: string;
  modalSwitchToUploadAudio: string;
  modalRecordingProgress: string;
  modalRecordingSoonEnd: string;
  modalFileReadyVideo: string;
  modalFileReadyAudio: string;
  modalVideoLinkHint: string;
  modalAudioLinkLabel: string;
  modalPhotoAltLabel: string;
  modalPhotoAltPlaceholder: string;
  modalPhotoTypeError: string;
  modalPhotoSizeError: string;
  modalPhotoConverting: string;
  modalPhotoUploadFailed: string;
  modalPhotoRetry: string;
  modalRequiredFieldsNote: string;
  modalAliasHint: string;
  modalCancionPlaceholder: string;
  modalLocationHint: string;
  modalConsentAdult: string;
  modalConsentPublish: string;
  modalConsentTermsAndPrivacy: string;
  modalConsentTermsLink: string;
  modalConsentPrivacyLink: string;
  modalMarkThreeToSend: string;
  modalSubmitFailedKeep: string;
  modalCaptchaFailed: string;
  modalFieldTitleMissing: string;
  modalFieldAliasMissing: string;
  modalFieldCountryMissing: string;
  modalFieldCityMissing: string;
  modalFieldAgeMissing: string;
  modalFieldEmailMissing: string;
  modalReviewInProgress: string;
  modalSaveImage: string;
  modalShareText: string;
  modalCopyImageFailed: string;
  modalShareImageFailed: string;
  modalImprintAlt: string;
};

const es: StoryFlowMessages = {
  modalStep1: 'Paso 1 de 2',
  modalStep2: 'Paso 2 de 2',
  modalLeaveConfirm: '¿Salir sin enviar?',
  modalCameraPermissionHint: 'Tu navegador te pedirá permiso para usar la cámara.',
  modalMicPermissionHint: 'Tu navegador te pedirá permiso para usar el micrófono.',
  modalCameraDenied:
    'No tenemos permiso para usar tu cámara. Actívalo en tu navegador o sube un video que ya tengas.',
  modalCameraUnsupported:
    'Tu navegador no permite grabar aquí. Prueba con Chrome o Safari actualizado, o sube un video.',
  modalCameraBusy:
    'La cámara está ocupada o no responde. Cierra otras apps que la usen e intenta de nuevo.',
  modalMicDenied:
    'No tenemos permiso para usar tu micrófono. Actívalo en tu navegador o sube un audio que ya tengas.',
  modalMicUnsupported:
    'Tu navegador no permite grabar aquí. Prueba con Chrome o Safari actualizado, o sube un audio.',
  modalMicBusy:
    'El micrófono está ocupado o no responde. Cierra otras apps que lo usen e intenta de nuevo.',
  modalSwitchToUploadVideo: 'Subir un video',
  modalSwitchToUploadAudio: 'Subir un audio',
  modalRecordingProgress: 'Grabando {time} de 5:00',
  modalRecordingSoonEnd: 'Quedan 30 segundos',
  modalFileReadyVideo: 'Video listo: {nombre} ({peso} MB)',
  modalFileReadyAudio: 'Audio listo: {nombre} ({peso} MB)',
  modalVideoLinkHint: 'El video debe ser público o no listado.',
  modalAudioLinkLabel: 'O pega un enlace público (SoundCloud, Google Drive, YouTube…)',
  modalPhotoAltLabel:
    'Describe esta foto en una frase. Así personas ciegas o con baja visión también podrán conocerla.',
  modalPhotoAltPlaceholder: 'Ej: Mi abuela riendo en la playa, 1985',
  modalPhotoTypeError: 'Ese archivo no es una foto. Usa JPG, PNG, WEBP o HEIC.',
  modalPhotoSizeError: 'Esa foto pesa más de 10 MB. Prueba con una más liviana.',
  modalPhotoConverting: 'Convirtiendo tu foto…',
  modalPhotoUploadFailed: 'No pudimos subir esta foto.',
  modalPhotoRetry: 'Reintentar',
  modalRequiredFieldsNote: 'Los campos con * son obligatorios.',
  modalAliasHint: 'Así aparecerás en el mapa.',
  modalCancionPlaceholder: 'Nombre o enlace',
  modalLocationHint: 'Así ubicamos tu historia en el mapa.',
  modalConsentAdult:
    'Soy mayor de 18 años, o adulto responsable o representante de una institución, y tengo autorización de quienes aparecen en esta historia.',
  modalConsentPublish: 'Autorizo que mi imagen, voz y nombre o alias se publiquen en AlmaMundi.',
  modalConsentTermsAndPrivacy: 'Acepto los {terminos} y la {privacidad}.',
  modalConsentTermsLink: 'Términos de Uso',
  modalConsentPrivacyLink: 'Política de privacidad',
  modalMarkThreeToSend: 'Marca las tres casillas para enviar.',
  modalSubmitFailedKeep:
    'No pudimos enviar tu historia. Lo que grabaste y escribiste sigue aquí. Revisa tu conexión e intenta de nuevo.',
  modalCaptchaFailed: 'No pudimos completar la verificación de seguridad. Intenta de nuevo.',
  modalFieldTitleMissing: 'Falta el título de tu historia.',
  modalFieldAliasMissing: 'Falta tu nombre o alias.',
  modalFieldCountryMissing: 'Falta el país.',
  modalFieldCityMissing: 'Falta la ciudad o localidad.',
  modalFieldAgeMissing: 'Falta la edad.',
  modalFieldEmailMissing: 'Falta un correo válido.',
  modalReviewInProgress:
    'Tu historia ya está en revisión. Te avisaremos por correo cuando aparezca en el mapa.',
  modalSaveImage: 'Guardar imagen',
  modalShareText:
    'Mis palabras se volvieron colores en AlmaMundi. ¿De qué color es tu historia? almamundi.org/contar',
  modalCopyImageFailed: 'No pudimos copiar la imagen. Prueba con Descargar.',
  modalShareImageFailed:
    'No pudimos compartir la imagen. Guárdala y compártela desde tu galería.',
  modalImprintAlt: 'Cintas de colores creadas a partir de tu historia «{titulo}»',
};

const pt: StoryFlowMessages = {
  ...es,
  modalPhotoTypeError: 'Esse ficheiro não é uma foto. Use JPG, PNG, WEBP ou HEIC.',
  modalPhotoSizeError: 'Essa foto pesa mais de 10 MB. Tente uma mais leve.',
  modalPhotoConverting: 'A converter a sua foto…',
  modalPhotoUploadFailed: 'Não foi possível enviar esta foto.',
  modalPhotoRetry: 'Tentar de novo',
  modalRequiredFieldsNote: 'Os campos com * são obrigatórios.',
};

const en: StoryFlowMessages = {
  ...es,
  modalPhotoTypeError: 'That file is not a photo. Use JPG, PNG, WEBP, or HEIC.',
  modalPhotoSizeError: 'That photo is over 10 MB. Try a smaller one.',
  modalPhotoConverting: 'Converting your photo…',
  modalPhotoUploadFailed: 'We could not upload this photo.',
  modalPhotoRetry: 'Try again',
  modalRequiredFieldsNote: 'Fields marked with * are required.',
};

export const STORY_FLOW_MESSAGES: Record<AlmaLocale, StoryFlowMessages> = { es, pt, en };
