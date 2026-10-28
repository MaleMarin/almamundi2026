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
  modalReadyTitleVideo: string;
  modalReadyTitleAudio: string;
  modalChangeFile: string;
  modalRecordingName: string;
  modalFileTypeVideo: string;
  modalFileTypeAudio: string;
  modalFileTooHeavy: string;
  modalFileTooLongVideo: string;
  modalFileTooLongAudio: string;
  modalUploadProgress: string;
  modalUploadColorsWait: string;
  modalCreatingColors: string;
  modalPreviewVersion: string;
  modalVideoLinkHint: string;
  modalAudioLinkLabel: string;
  modalPhotoAltLabel: string;
  modalPhotoName: string;
  modalPhotoYear: string;
  modalPhotoYearUnknown: string;
  modalPhotoDecade: string;
  modalPhotoDecadeChoose: string;
  modalPhotoPlace: string;
  modalPhotoChoose: string;
  modalPhotoAddAnother: string;
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
  modalShareTextShort: string;
  modalShareTextLong: string;
  modalShareEmailSubject: string;
  modalCopyImageFailed: string;
  modalShareImageFailed: string;
  modalImprintAlt: string;
  modalShareMenuTitle: string;
  modalShareFacebook: string;
  modalShareX: string;
  modalShareLinkedIn: string;
  modalShareInstagram: string;
  modalShareTikTok: string;
  modalShareAppHandoff: string;
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
  modalAnsweringPrefix: string;
  modalAskAdviceTexto: string;
  modalAskAdviceAudio: string;
  modalAskAdviceVideo: string;
  modalAskAdviceFoto: string;
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
  modalReadyTitleVideo: 'Video listo',
  modalReadyTitleAudio: 'Audio listo',
  modalChangeFile: 'Cambiar archivo',
  modalRecordingName: 'Grabación',
  modalFileTypeVideo: 'Este formato de video no es compatible. Prueba con .mp4, .webm o .mov.',
  modalFileTypeAudio: 'Este formato de audio no es compatible. Prueba con .mp3, .m4a o .wav.',
  modalFileTooHeavy: 'Este archivo supera los {max} MB. Prueba con uno más liviano.',
  modalFileTooLongVideo: 'Este video dura más de 5 minutos. Puedes recortarlo o subir otro.',
  modalFileTooLongAudio: 'Este audio dura más de 5 minutos. Puedes recortarlo o subir otro.',
  modalUploadProgress: 'Progreso de la subida',
  modalUploadColorsWait:
    'Tu archivo ya subió. Ahora creamos tus colores, puede tardar unos segundos.',
  modalCreatingColors: 'Creando tus colores…',
  modalPreviewVersion: 'Versión de prueba · {sha}',
  modalVideoLinkHint: 'El video debe ser público o no listado.',
  modalAudioLinkLabel: 'O pega un enlace público (SoundCloud, Google Drive, YouTube…)',
  modalPhotoAltLabel:
    'Describe esta foto en una frase. Así personas ciegas o con baja visión también podrán conocerla. (opcional)',
  modalPhotoName: 'Nombre de la foto *',
  modalPhotoYear: 'Año *',
  modalPhotoYearUnknown: 'No sé el año exacto',
  modalPhotoDecade: 'Década *',
  modalPhotoDecadeChoose: 'Elige una década',
  modalPhotoPlace: 'Lugar *',
  modalPhotoChoose: 'Elige tus fotos',
  modalPhotoAddAnother: 'Agrega otra foto',
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
  modalCaptchaFailed: 'No pudimos confirmar el envío. Espera unos segundos e inténtalo de nuevo.',
  modalFieldTitleMissing: 'Falta el título de tu historia.',
  modalFieldAliasMissing: 'Falta tu nombre o alias.',
  modalFieldCountryMissing: 'Falta el país.',
  modalFieldCityMissing: 'Falta la ciudad o localidad.',
  modalFieldAgeMissing: 'Falta la edad.',
  modalFieldEmailMissing: 'Falta un correo válido.',
  modalReviewInProgress:
    'Tu historia está en revisión. Te escribiremos cuando aparezca en el mapa.',
  modalSaveImage: 'Guardar imagen',
  modalShareTextShort:
    'Conté una historia y me devolvió sus colores. Tú también tienes una. https://www.almamundi.org/contar',
  modalShareTextLong:
    'Todos guardamos una historia que vale la pena contar. Yo conté la mía en AlmaMundi y estos son sus colores. Te toca. https://www.almamundi.org/contar',
  modalShareEmailSubject: 'Conté una historia en AlmaMundi',
  modalCopyImageFailed: 'No pudimos copiar la imagen. Prueba con Descargar.',
  modalShareImageFailed:
    'No pudimos compartir. Descarga la imagen y compártela desde tu dispositivo.',
  modalImprintAlt: 'Cintas de colores creadas a partir de tu historia «{titulo}»',
  modalShareMenuTitle: 'Compartir',
  modalShareFacebook: 'Facebook',
  modalShareX: 'X',
  modalShareLinkedIn: 'LinkedIn',
  modalShareInstagram: 'Instagram',
  modalShareTikTok: 'TikTok',
  modalShareAppHandoff:
    'Descargamos tu imagen y copiamos el texto. Te abrimos la app en otra pestaña para que los subas.',
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
  modalAnsweringPrefix: 'Respondes a:',
  modalAskAdviceTexto: 'Escribe lo que te contó, con sus palabras si puedes.',
  modalAskAdviceAudio: 'Graba la conversación: tú preguntas y la otra persona responde.',
  modalAskAdviceVideo: 'Pon el celular horizontal y que se vean ambos.',
  modalAskAdviceFoto: 'Pídele una foto de esa época y cuéntanos qué hay en ella.',
};

const pt: StoryFlowMessages = {
  ...es,
  modalReadyTitleVideo: 'Vídeo pronto',
  modalReadyTitleAudio: 'Áudio pronto',
  modalChangeFile: 'Mudar ficheiro',
  modalRecordingName: 'Gravação',
  modalFileTypeVideo: 'Este formato de vídeo não é compatível. Tente .mp4, .webm ou .mov.',
  modalFileTypeAudio: 'Este formato de áudio não é compatível. Tente .mp3, .m4a ou .wav.',
  modalFileTooHeavy: 'Este ficheiro supera os {max} MB. Tente um mais leve.',
  modalFileTooLongVideo: 'Este vídeo dura mais de 5 minutos. Pode cortá-lo ou enviar outro.',
  modalFileTooLongAudio: 'Este áudio dura mais de 5 minutos. Pode cortá-lo ou enviar outro.',
  modalUploadProgress: 'Progresso do envio',
  modalUploadColorsWait:
    'Seu arquivo já foi enviado. Agora criamos suas cores, pode levar alguns segundos.',
  modalCreatingColors: 'Criando suas cores…',
  modalPreviewVersion: 'Versão de teste · {sha}',
  modalPhotoTypeError: 'Esse ficheiro não é uma foto. Use JPG, PNG, WEBP ou HEIC.',
  modalPhotoSizeError: 'Essa foto pesa mais de 10 MB. Tente uma mais leve.',
  modalPhotoConverting: 'A converter a sua foto…',
  modalPhotoUploadFailed: 'Não foi possível enviar esta foto.',
  modalPhotoRetry: 'Tentar de novo',
  modalPhotoAltLabel:
    'Descreva esta foto numa frase. Assim, pessoas cegas ou com baixa visão também poderão conhecê-la. (opcional)',
  modalPhotoName: 'Nome da foto *',
  modalPhotoYear: 'Ano *',
  modalPhotoYearUnknown: 'Não sei o ano exato',
  modalPhotoDecade: 'Década *',
  modalPhotoDecadeChoose: 'Escolha uma década',
  modalPhotoPlace: 'Lugar *',
  modalPhotoChoose: 'Escolha suas fotos',
  modalPhotoAddAnother: 'Adicione outra foto',
  modalPhotoDecadeOption: 'anos {year}',
  modalPhotoMissingName: 'Falta o nome da foto {foto}.',
  modalPhotoMissingYear: 'Falta o ano da foto {foto}.',
  modalPhotoInvalidYear: 'O ano da foto {foto} deve ter 4 dígitos, entre 1850 e {max}.',
  modalPhotoMissingDecade: 'Falta a década da foto {foto}.',
  modalPhotoMissingPlace: 'Falta o lugar da foto {foto}.',
  modalRequiredFieldsNote: 'Os campos com * são obrigatórios.',
  modalShareTextShort:
    'Contei uma história e ela me devolveu suas cores. Você também tem uma. https://www.almamundi.org/contar',
  modalShareTextLong:
    'Todos guardamos uma história que vale a pena contar. Eu contei a minha no AlmaMundi e estas são as cores dela. Agora é a sua vez. https://www.almamundi.org/contar',
  modalShareEmailSubject: 'Contei uma história no AlmaMundi',
  modalShareImageFailed:
    'Não foi possível partilhar. Descarregue a imagem e partilhe-a a partir do seu dispositivo.',
  modalShareInstagram: 'Instagram',
  modalShareTikTok: 'TikTok',
  modalShareAppHandoff:
    'Baixamos sua imagem e copiamos o texto. Abrimos o app em outra aba para você publicar.',
  modalShareEmail: 'E-mail',
  modalShareLinkCopied: 'Link copiado',
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
  modalCaptchaFailed: 'Não conseguimos confirmar o envio. Espere alguns segundos e tente de novo.',
  modalAnsweringPrefix: 'Você está respondendo:',
  modalAskAdviceTexto: 'Escreva o que a pessoa contou, com as palavras dela se puder.',
  modalAskAdviceAudio: 'Grave a conversa: você pergunta e a outra pessoa responde.',
  modalAskAdviceVideo: 'Deixe o celular na horizontal e que os dois apareçam.',
  modalAskAdviceFoto: 'Peça uma foto daquela época e conte o que há nela.',
};

const en: StoryFlowMessages = {
  ...es,
  modalReadyTitleVideo: 'Video ready',
  modalReadyTitleAudio: 'Audio ready',
  modalChangeFile: 'Change file',
  modalRecordingName: 'Recording',
  modalFileTypeVideo: 'This video format is not supported. Try .mp4, .webm, or .mov.',
  modalFileTypeAudio: 'This audio format is not supported. Try .mp3, .m4a, or .wav.',
  modalFileTooHeavy: 'This file is over {max} MB. Try a smaller one.',
  modalFileTooLongVideo: 'This video is longer than 5 minutes. You can trim it or upload another.',
  modalFileTooLongAudio: 'This audio is longer than 5 minutes. You can trim it or upload another.',
  modalUploadProgress: 'Upload progress',
  modalUploadColorsWait:
    'Your file is uploaded. We\'re creating your colors now, it may take a few seconds.',
  modalCreatingColors: 'Creating your colors…',
  modalPreviewVersion: 'Test version · {sha}',
  modalPhotoTypeError: 'That file is not a photo. Use JPG, PNG, WEBP, or HEIC.',
  modalPhotoSizeError: 'That photo is over 10 MB. Try a smaller one.',
  modalPhotoConverting: 'Converting your photo…',
  modalPhotoUploadFailed: 'We could not upload this photo.',
  modalPhotoRetry: 'Try again',
  modalPhotoAltLabel:
    'Describe this photo in one sentence so people who are blind or have low vision can know it too. (optional)',
  modalPhotoName: 'Photo name *',
  modalPhotoYear: 'Year *',
  modalPhotoYearUnknown: 'I do not know the exact year',
  modalPhotoDecade: 'Decade *',
  modalPhotoDecadeChoose: 'Choose a decade',
  modalPhotoPlace: 'Place *',
  modalPhotoChoose: 'Choose your photos',
  modalPhotoAddAnother: 'Add another photo',
  modalPhotoDecadeOption: '{year}s',
  modalPhotoMissingName: 'Photo {foto} is missing a name.',
  modalPhotoMissingYear: 'Photo {foto} is missing the year.',
  modalPhotoInvalidYear: 'The year of photo {foto} must be 4 digits, from 1850 to {max}.',
  modalPhotoMissingDecade: 'Photo {foto} is missing a decade.',
  modalPhotoMissingPlace: 'Photo {foto} is missing the place.',
  modalRequiredFieldsNote: 'Fields marked with * are required.',
  modalShareTextShort:
    'I told a story and it gave me back its colors. You have one too. https://www.almamundi.org/contar',
  modalShareTextLong:
    'We all carry a story worth telling. I told mine on AlmaMundi and these are its colors. Your turn. https://www.almamundi.org/contar',
  modalShareEmailSubject: 'I told a story on AlmaMundi',
  modalShareImageFailed:
    'We could not share this. Download the image and share it from your device.',
  modalShareMenuTitle: 'Share',
  modalShareInstagram: 'Instagram',
  modalShareTikTok: 'TikTok',
  modalShareAppHandoff:
    'We downloaded your image and copied the text. We opened the app in another tab so you can post them.',
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
  modalCaptchaFailed: 'We could not confirm the submission. Wait a few seconds and try again.',
  modalAnsweringPrefix: "You're answering:",
  modalAskAdviceTexto: 'Write what they told you, in their own words if you can.',
  modalAskAdviceAudio: 'Record the conversation: you ask, the other person answers.',
  modalAskAdviceVideo: 'Hold your phone horizontally so you both appear.',
  modalAskAdviceFoto: "Ask them for a photo from that time and tell us what's in it.",
};

export const STORY_FLOW_MESSAGES: Record<AlmaLocale, StoryFlowMessages> = { es, pt, en };
