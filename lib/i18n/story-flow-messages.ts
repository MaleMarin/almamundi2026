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
  modalPhotoName: string;
  modalPhotoYear: string;
  modalPhotoYearUnknown: string;
  modalPhotoDecade: string;
  modalPhotoDecadeChoose: string;
  modalPhotoPlace: string;
  modalPhotoPlacePlaceholder: string;
  modalPhotoDecadeOption: string;
  modalPhotoMissingName: string;
  modalPhotoMissingYear: string;
  modalPhotoInvalidYear: string;
  modalPhotoMissingDecade: string;
  modalPhotoMissingPlace: string;
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
  modalShareMenuTitle: string;
  modalShareFacebook: string;
  modalShareX: string;
  modalShareLinkedIn: string;
  modalShareEmail: string;
  modalShareLinkCopied: string;
  modalAnotherPromptFoto: string;
  modalAnotherCtaFoto: string;
  modalAnotherPromptVideo: string;
  modalAnotherCtaVideo: string;
  modalAnotherPromptAudio: string;
  modalAnotherCtaAudio: string;
  modalAnotherPromptTexto: string;
  modalAnotherCtaTexto: string;
  modalAnotherFormatLink: string;
  modalSectionYourStory: string;
  modalSectionAbout: string;
  modalSectionWhere: string;
  modalProfilePhotoNote: string;
  modalImprintHowTexto: string;
  modalImprintHowFoto: string;
  modalImprintHowAudio: string;
  modalImprintHowVideo: string;
  modalExtrasColorHint: string;
  modalNowWhat: string;
  modalContactLead: string;
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
    'Describe esta foto en una frase. Así personas ciegas o con baja visión también podrán conocerla. (opcional)',
  modalPhotoAltPlaceholder: 'Ej: Mi abuela riendo en la playa, 1985',
  modalPhotoName: 'Nombre de la foto *',
  modalPhotoYear: 'Año *',
  modalPhotoYearUnknown: 'No sé el año exacto',
  modalPhotoDecade: 'Década *',
  modalPhotoDecadeChoose: 'Elige una década',
  modalPhotoPlace: 'Lugar *',
  modalPhotoPlacePlaceholder: 'Valparaíso, Chile',
  modalPhotoDecadeOption: 'años {year}',
  modalPhotoMissingName: 'Falta el nombre de la foto {foto}.',
  modalPhotoMissingYear: 'Falta el año de la foto {foto}.',
  modalPhotoInvalidYear: 'El año de la foto {foto} debe tener 4 dígitos, entre 1850 y {max}.',
  modalPhotoMissingDecade: 'Falta la década de la foto {foto}.',
  modalPhotoMissingPlace: 'Falta el lugar de la foto {foto}.',
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
    'Tu historia está en revisión. Te escribiremos cuando aparezca en el mapa.',
  modalSaveImage: 'Guardar imagen',
  modalShareText:
    'Mis palabras se volvieron colores en AlmaMundi. ¿De qué color es tu historia? almamundi.org/contar',
  modalCopyImageFailed: 'No pudimos copiar la imagen. Prueba con Descargar.',
  modalShareImageFailed:
    'No pudimos compartir. Descarga la imagen y compártela desde tu dispositivo.',
  modalImprintAlt: 'Cintas de colores creadas a partir de tu historia «{titulo}»',
  modalShareMenuTitle: 'Compartir',
  modalShareFacebook: 'Facebook',
  modalShareX: 'X',
  modalShareLinkedIn: 'LinkedIn',
  modalShareEmail: 'Correo',
  modalShareLinkCopied: 'Enlace copiado',
  modalAnotherPromptFoto: '¿Quieres subir más fotos?',
  modalAnotherCtaFoto: 'Subir más fotos',
  modalAnotherPromptVideo: '¿Quieres grabar otro momento?',
  modalAnotherCtaVideo: 'Grabar otro video',
  modalAnotherPromptAudio: '¿Quieres grabar otro momento?',
  modalAnotherCtaAudio: 'Grabar otro audio',
  modalAnotherPromptTexto: '¿Quieres escribir otra historia?',
  modalAnotherCtaTexto: 'Escribir otra historia',
  modalAnotherFormatLink: 'o cuéntala en otro formato',
  modalSectionYourStory: 'Tu historia',
  modalSectionAbout: 'Sobre ti',
  modalSectionWhere: 'Dónde estás y cómo avisarte',
  modalProfilePhotoNote:
    'Tu foto (opcional, hasta 10 MB). Aparecerá junto a tu historia cuando se publique. Puedes no subirla.',
  modalImprintHowTexto:
    'Los colores salen de las palabras de tu relato. Cada palabra con carga emocional se volvió una franja: su color viene de la emoción que transmite y su ancho, de cuántas veces aparece.',
  modalImprintHowFoto:
    'Los colores salen de los nombres, los lugares y las descripciones que diste a tus fotos. Cada palabra con carga emocional se volvió una franja: su color viene de la emoción que transmite y su ancho, de cuántas veces aparece.',
  modalImprintHowAudio:
    'Los colores salen de las palabras con que presentaste tu audio. Cada palabra con carga emocional se volvió una franja: su color viene de la emoción que transmite y su ancho, de cuántas veces aparece.',
  modalImprintHowVideo:
    'Los colores salen de las palabras con que presentaste tu video. Cada palabra con carga emocional se volvió una franja: su color viene de la emoción que transmite y su ancho, de cuántas veces aparece.',
  modalExtrasColorHint: 'Lo que escribas aquí también da color a tu imagen.',
  modalNowWhat: '¿Y ahora?',
  modalContactLead: '¿Tienes dudas? Escríbenos a',
};

const pt: StoryFlowMessages = {
  ...es,
  modalPhotoTypeError: 'Esse ficheiro não é uma foto. Use JPG, PNG, WEBP ou HEIC.',
  modalPhotoSizeError: 'Essa foto pesa mais de 10 MB. Tente uma mais leve.',
  modalPhotoConverting: 'A converter a sua foto…',
  modalPhotoUploadFailed: 'Não foi possível enviar esta foto.',
  modalPhotoRetry: 'Tentar de novo',
  modalPhotoAltLabel:
    'Descreva esta foto numa frase. Assim, pessoas cegas ou com baixa visão também poderão conhecê-la. (opcional)',
  modalPhotoAltPlaceholder: 'Ex.: A minha avó a rir na praia, 1985',
  modalPhotoName: 'Nome da foto *',
  modalPhotoYear: 'Ano *',
  modalPhotoYearUnknown: 'Não sei o ano exato',
  modalPhotoDecade: 'Década *',
  modalPhotoDecadeChoose: 'Escolha uma década',
  modalPhotoPlace: 'Lugar *',
  modalPhotoPlacePlaceholder: 'Valparaíso, Chile',
  modalPhotoDecadeOption: 'anos {year}',
  modalPhotoMissingName: 'Falta o nome da foto {foto}.',
  modalPhotoMissingYear: 'Falta o ano da foto {foto}.',
  modalPhotoInvalidYear: 'O ano da foto {foto} deve ter 4 dígitos, entre 1850 e {max}.',
  modalPhotoMissingDecade: 'Falta a década da foto {foto}.',
  modalPhotoMissingPlace: 'Falta o lugar da foto {foto}.',
  modalRequiredFieldsNote: 'Os campos com * são obrigatórios.',
  modalShareImageFailed:
    'Não foi possível partilhar. Descarregue a imagem e partilhe-a a partir do seu dispositivo.',
  modalShareEmail: 'Correio',
  modalShareLinkCopied: 'Ligação copiada',
  modalAnotherPromptFoto: 'Quer enviar mais fotos?',
  modalAnotherCtaFoto: 'Enviar mais fotos',
  modalAnotherPromptVideo: 'Quer gravar outro momento?',
  modalAnotherCtaVideo: 'Gravar outro vídeo',
  modalAnotherPromptAudio: 'Quer gravar outro momento?',
  modalAnotherCtaAudio: 'Gravar outro áudio',
  modalAnotherPromptTexto: 'Quer escrever outra história?',
  modalAnotherCtaTexto: 'Escrever outra história',
  modalAnotherFormatLink: 'ou conte-a noutro formato',
  modalReviewInProgress:
    'A sua história está em revisão. Escreveremos quando aparecer no mapa.',
  modalSectionYourStory: 'A sua história',
  modalSectionAbout: 'Sobre si',
  modalSectionWhere: 'Onde está e como avisar',
  modalProfilePhotoNote:
    'A sua foto (opcional, até 10 MB). Aparecerá junto à sua história quando for publicada. Pode não a enviar.',
  modalImprintHowTexto:
    'As cores saem das palavras do seu relato. Cada palavra com carga emocional tornou-se uma faixa: a cor vem da emoção que transmite e a largura, de quantas vezes aparece.',
  modalImprintHowFoto:
    'As cores saem dos nomes, dos lugares e das descrições que deu às suas fotos. Cada palavra com carga emocional tornou-se uma faixa: a cor vem da emoção que transmite e a largura, de quantas vezes aparece.',
  modalImprintHowAudio:
    'As cores saem das palavras com que apresentou o seu áudio. Cada palavra com carga emocional tornou-se uma faixa: a cor vem da emoção que transmite e a largura, de quantas vezes aparece.',
  modalImprintHowVideo:
    'As cores saem das palavras com que apresentou o seu vídeo. Cada palavra com carga emocional tornou-se uma faixa: a cor vem da emoção que transmite e a largura, de quantas vezes aparece.',
  modalExtrasColorHint: 'O que escrever aqui também dá cor à sua imagem.',
  modalNowWhat: 'E agora?',
  modalContactLead: 'Tem dúvidas? Escreva para',
};

const en: StoryFlowMessages = {
  ...es,
  modalPhotoTypeError: 'That file is not a photo. Use JPG, PNG, WEBP, or HEIC.',
  modalPhotoSizeError: 'That photo is over 10 MB. Try a smaller one.',
  modalPhotoConverting: 'Converting your photo…',
  modalPhotoUploadFailed: 'We could not upload this photo.',
  modalPhotoRetry: 'Try again',
  modalPhotoAltLabel:
    'Describe this photo in one sentence so people who are blind or have low vision can know it too. (optional)',
  modalPhotoAltPlaceholder: 'E.g. My grandmother laughing at the beach, 1985',
  modalPhotoName: 'Photo name *',
  modalPhotoYear: 'Year *',
  modalPhotoYearUnknown: 'I do not know the exact year',
  modalPhotoDecade: 'Decade *',
  modalPhotoDecadeChoose: 'Choose a decade',
  modalPhotoPlace: 'Place *',
  modalPhotoPlacePlaceholder: 'Valparaíso, Chile',
  modalPhotoDecadeOption: '{year}s',
  modalPhotoMissingName: 'Photo {foto} is missing a name.',
  modalPhotoMissingYear: 'Photo {foto} is missing the year.',
  modalPhotoInvalidYear: 'The year of photo {foto} must be 4 digits, from 1850 to {max}.',
  modalPhotoMissingDecade: 'Photo {foto} is missing a decade.',
  modalPhotoMissingPlace: 'Photo {foto} is missing the place.',
  modalRequiredFieldsNote: 'Fields marked with * are required.',
  modalShareImageFailed:
    'We could not share this. Download the image and share it from your device.',
  modalShareMenuTitle: 'Share',
  modalShareEmail: 'Email',
  modalShareLinkCopied: 'Link copied',
  modalAnotherPromptFoto: 'Want to upload more photos?',
  modalAnotherCtaFoto: 'Upload more photos',
  modalAnotherPromptVideo: 'Want to record another moment?',
  modalAnotherCtaVideo: 'Record another video',
  modalAnotherPromptAudio: 'Want to record another moment?',
  modalAnotherCtaAudio: 'Record another audio',
  modalAnotherPromptTexto: 'Want to write another story?',
  modalAnotherCtaTexto: 'Write another story',
  modalAnotherFormatLink: 'or tell it in another format',
  modalReviewInProgress:
    'Your story is in review. We will write to you when it appears on the map.',
  modalSectionYourStory: 'Your story',
  modalSectionAbout: 'About you',
  modalSectionWhere: 'Where you are and how to reach you',
  modalProfilePhotoNote:
    'Your photo (optional, up to 10 MB). It will appear next to your story when it is published. You can skip it.',
  modalImprintHowTexto:
    'The colors come from the words of your story. Each word with emotional weight became a stripe: its color comes from the emotion it carries and its width from how many times it appears.',
  modalImprintHowFoto:
    'The colors come from the names, the places and the descriptions you gave your photos. Each word with emotional weight became a stripe: its color comes from the emotion it carries and its width from how many times it appears.',
  modalImprintHowAudio:
    'The colors come from the words you used to present your audio. Each word with emotional weight became a stripe: its color comes from the emotion it carries and its width from how many times it appears.',
  modalImprintHowVideo:
    'The colors come from the words you used to present your video. Each word with emotional weight became a stripe: its color comes from the emotion it carries and its width from how many times it appears.',
  modalExtrasColorHint: 'What you write here also gives color to your image.',
  modalNowWhat: 'What now?',
  modalContactLead: 'Questions? Write to us at',
};

export const STORY_FLOW_MESSAGES: Record<AlmaLocale, StoryFlowMessages> = { es, pt, en };
