import type { UploadModalCopy } from '@/lib/subir-upload-modal-copy';
import type { AlmaLocale } from '@/lib/i18n/locale';

export type SiteUiMessages = {
  footerInitiativeOf: string;
  footerLegalAria: string;
  footerPrivacy: string;
  footerTerms: string;
  footerMyData: string;
  footerConductGuide: string;
  footerConductGuideTitle: string;
  footerContact: string;
  cookieAria: string;
  cookieBody: string;
  cookiePrivacyLink: string;
  cookieAccept: string;
  listHeroTitle: string;
  listHeroSubtitle: string;
  listFilterAria: string;
  listFilterCountry: string;
  listFilterClear: string;
  listFilterShowing: string;
  listKickerVideos: string;
  listKickerAudios: string;
  listKickerEscrito: string;
  listKickerFotos: string;
  listExpoVideos: string;
  listExpoAudios: string;
  listExpoEscrito: string;
  listExpoFotos: string;
  listShareLabel: string;
  listShareText: string;
  subirH1: string;
  subirBackHome: string;
  modalClose: string;
  modalContinue: string;
  modalWaitVoice: string;
  modalWaitPhoto: string;
  modalWaitVideo: string;
  modalCapture: string;
  modalConfirmSend: string;
  modalDetailsTitle: string;
  modalDetailsSubtitle: string;
  modalSendVideo: string;
  modalSendAudio: string;
  modalSendText: string;
  modalSendPhoto: string;
  modalSendPhotos: string;
  modalSendingVideo: string;
  modalSendingAudio: string;
  modalSendingText: string;
  modalSendingPhotos: string;
  modalSectionStory: string;
  modalStoryName: string;
  modalAlias: string;
  modalExtras: string;
  modalCancionRelacionada: string;
  modalFiles: string;
  modalAttach: string;
  modalProfilePhoto: string;
  modalUpload: string;
  modalChange: string;
  modalRemove: string;
  modalCountry: string;
  modalCity: string;
  modalAge: string;
  modalAgeChoose: string;
  modalAgeMenos18: string;
  modalAge60: string;
  modalAgePreferNot: string;
  modalGender: string;
  modalGenderBlank: string;
  modalGenderFemale: string;
  modalGenderMale: string;
  modalGenderNb: string;
  modalGenderPreferNot: string;
  modalGenderOther: string;
  modalEmail: string;
  modalEmailHint: string;
  modalLegalNote: string;
  modalBack: string;
  modalSending: string;
  modalSend: string;
  modalRecord: string;
  modalRecording: string;
  modalReviewVideo: string;
  modalReviewAudio: string;
  modalRecordVoice: string;
  modalRerecord: string;
  modalStop: string;
  modalListenClip: string;
  modalChars: string;
  modalReceivedNamed: string;
  modalReceivedAnon: string;
  modalReceivedAfterName: string;
  modalReceivedAnonBefore: string;
  modalReceivedEmph: string;
  modalImprintAria: string;
  modalDownloadImprint: string;
  modalShareImprint: string;
  modalShareCopied: string;
  modalShareDownloaded: string;
  modalShareFailed: string;
  modalCopyLink: string;
  modalAnotherStory: string;
  modalLinkCopied: string;
  modalImprintWhat: string;
  modalImprintExplain: string;
  modalBackToMap: string;
  modalTopicActive: string;
  upload: Record<'video' | 'audio' | 'texto' | 'foto', UploadModalCopy>;
};

const es: SiteUiMessages = {
  footerInitiativeOf: 'Un proyecto sin fines de lucro de',
  footerLegalAria: 'Información legal y datos personales',
  footerPrivacy: 'Aviso de privacidad',
  footerTerms: 'Términos de uso',
  footerMyData: 'Mis datos personales',
  footerConductGuide: 'Guía de conducta',
  footerConductGuideTitle:
    'Guía de conducta AlmaMundi (PDF): respeto, cuidado y uso responsable del sitio',
  footerContact: 'Contacto',
  cookieAria: 'Aviso de cookies',
  cookieBody: 'AlmaMundi usa cookies esenciales y analítica básica.',
  cookiePrivacyLink: 'Política de privacidad',
  cookieAccept: 'Entendido',
  listHeroTitle: 'El mundo tiene millones de historias que nadie conoce.',
  listHeroSubtitle: 'Estas son algunas.',
  listFilterAria: 'Filtros de historias',
  listFilterCountry: 'País',
  listFilterClear: 'Limpiar filtros',
  listFilterShowing: 'Mostrando {shown} de {total} historias.',
  listKickerVideos: 'Historias en video',
  listKickerAudios: 'Historias en audio',
  listKickerEscrito: 'Historias en texto',
  listKickerFotos: 'Historias en foto',
  listExpoVideos: 'alma.mundi / historias en video',
  listExpoAudios: 'alma.mundi / historias en audio',
  listExpoEscrito: 'alma.mundi / historias en texto',
  listExpoFotos: 'alma.mundi / historias en foto',
  listShareLabel: 'Compartir',
  listShareText:
    'Compartir la historia con respeto: crédito a quien la cuenta, enlace y tarjeta descargable.',
  subirH1: 'Elegir formato de participación',
  subirBackHome: '← Volver al inicio',
  modalClose: 'Cerrar',
  modalContinue: 'Continuar',
  modalWaitVoice: 'Termina de grabar tu voz',
  modalWaitPhoto: 'Espera a que tu foto esté lista',
  modalWaitVideo: 'Termina de grabar tu video',
  modalCapture: 'Captura',
  modalConfirmSend: 'Confirmación de envío',
  modalDetailsTitle: 'Cuéntanos un poco de ti',
  modalDetailsSubtitle:
    'Así podremos ubicar tu historia en el mapa y avisarte cuando esté publicada.',
  modalSendVideo: 'Enviar mi video',
  modalSendAudio: 'Enviar mi audio',
  modalSendText: 'Enviar mi texto',
  modalSendPhoto: 'Enviar mi foto',
  modalSendPhotos: 'Enviar mis fotos',
  modalSendingVideo: 'Enviando tu video…',
  modalSendingAudio: 'Enviando tu audio…',
  modalSendingText: 'Enviando tu texto…',
  modalSendingPhotos: 'Enviando tus fotos…',
  modalSectionStory: 'Historia',
  modalStoryName: 'Título de tu historia *',
  modalAlias: 'Nombre o alias *',
  modalExtras: '¿Algo más que quieras contarnos? (opcional)',
  modalCancionRelacionada: 'Una canción para esta historia (opcional)',
  modalFiles: 'Fotos extra (opcional, hasta 10 MB cada una)',
  modalAttach: 'Agregar fotos',
  modalProfilePhoto: 'Tu foto (opcional, hasta 10 MB)',
  modalUpload: 'Subir',
  modalChange: 'Cambiar',
  modalRemove: 'Quitar',
  modalCountry: 'País *',
  modalCity: 'Ciudad o localidad *',
  modalAge: 'Edad *',
  modalAgeChoose: 'Elige una opción',
  modalAgeMenos18: 'Menos de 18',
  modalAge60: '60 o más',
  modalAgePreferNot: 'Prefiero no decirlo',
  modalGender: 'Género (opcional)',
  modalGenderBlank: 'Elige una opción',
  modalGenderFemale: 'Femenino',
  modalGenderMale: 'Masculino',
  modalGenderNb: 'No binario',
  modalGenderPreferNot: 'Prefiero no decirlo',
  modalGenderOther: 'Otro',
  modalEmail: 'Correo electrónico',
  modalEmailHint:
    'Te avisaremos por correo cuando tu historia esté en el mapa (tras la revisión). No se muestra en público.',
  modalLegalNote: 'Tu historia quedará en revisión antes de formar parte de AlmaMundi.',
  modalBack: 'Volver',
  modalSending: 'Enviando…',
  modalSend: 'Enviar mi historia',
  modalRecord: 'Grabar',
  modalRecording: 'Grabando…',
  modalReviewVideo: 'Revisa tu video',
  modalReviewAudio: 'Revisa tu audio',
  modalRecordVoice: 'Grabar voz',
  modalRerecord: 'Volver a grabar',
  modalStop: 'Detener',
  modalListenClip: 'Escúchalo antes de continuar. Si no te convence, vuelve a grabar.',
  modalChars: '{n} / {max} caracteres',
  modalReceivedNamed: '{name},\ntu relato en colores.',
  modalReceivedAnon: 'Tu relato en colores.',
  modalReceivedAfterName: 'tu relato en colores.',
  modalReceivedAnonBefore: 'Tu relato en colores.',
  modalReceivedEmph: 'colores.',
  modalImprintAria: 'Tu relato en colores',
  modalDownloadImprint: 'Descargar',
  modalShareImprint: 'Compartir',
  modalShareCopied: 'Imagen copiada. Puedes pegarla donde quieras.',
  modalShareDownloaded: 'Tu navegador no pudo copiar la imagen; se descargó el PNG.',
  modalShareFailed: 'No pudimos compartir la imagen. Guárdala y compártela desde tu galería.',
  modalCopyLink: 'Copiar enlace',
  modalAnotherStory: 'Otra historia',
  modalLinkCopied: 'Enlace copiado',
  modalImprintWhat: '¿De dónde salen estos colores?',
  modalImprintExplain: 'Esta imagen nace de tu historia y es solo tuya.',
  modalBackToMap: 'Explorar el mapa',
  modalTopicActive: 'Tema guía activo',
  upload: {
    video: {
      title: 'Graba el momento que todavía vive en ti',
      subtitle: 'Tu historia merece verse.',
      limit: 'Hasta 5 minutos de video.',
      uploadLabel: 'o subir un video desde tu dispositivo',
    },
    audio: {
      title: 'Hay historias que se cuentan mejor en voz alta',
      subtitle: 'Tu voz guarda lo que las palabras escritas no siempre pueden.',
      limit: 'Hasta 5 minutos de audio.',
      uploadLabel: 'o subir un audio desde tu dispositivo',
    },
    texto: {
      title: 'Escribe lo que no le contaste a nadie,\no lo que le contaste a todos',
      subtitle: 'Aquí no se pierde en el scroll. Queda.',
      limit: 'Hasta 5000 caracteres.',
      uploadLabel: '',
    },
    foto: {
      title: 'Una imagen puede guardar\nlo que las palabras no alcanzan',
      subtitle: 'Sube hasta 8 fotos. Cada una lleva su nombre, el año y el lugar donde fue tomada.',
      limit: 'Hasta 10 MB por foto.',
      uploadLabel: '',
    },
  },
};

const pt: SiteUiMessages = {
  footerInitiativeOf: 'Um projeto sem fins lucrativos da',
  footerLegalAria: 'Informação legal e dados pessoais',
  footerPrivacy: 'Aviso de privacidade',
  footerTerms: 'Termos de uso',
  footerMyData: 'Meus dados pessoais',
  footerConductGuide: 'Guia de conduta',
  footerConductGuideTitle:
    'Guia de conduta AlmaMundi (PDF): respeito, cuidado e uso responsável do site',
  footerContact: 'Contato',
  cookieAria: 'Aviso de cookies',
  cookieBody: 'AlmaMundi usa cookies essenciais e análise básica.',
  cookiePrivacyLink: 'Política de privacidade',
  cookieAccept: 'Entendi',
  listHeroTitle: 'O mundo tem milhões de histórias que ninguém conhece.',
  listHeroSubtitle: 'Estas são algumas.',
  listFilterAria: 'Filtros de histórias',
  listFilterCountry: 'País',
  listFilterClear: 'Limpar filtros',
  listFilterShowing: 'Mostrando {shown} de {total} histórias.',
  listKickerVideos: 'Histórias em vídeo',
  listKickerAudios: 'Histórias em áudio',
  listKickerEscrito: 'Histórias em texto',
  listKickerFotos: 'Histórias em foto',
  listExpoVideos: 'alma.mundi / histórias em vídeo',
  listExpoAudios: 'alma.mundi / histórias em áudio',
  listExpoEscrito: 'alma.mundi / histórias em texto',
  listExpoFotos: 'alma.mundi / histórias em foto',
  listShareLabel: 'Compartilhar',
  listShareText:
    'Compartilhar a história com respeito: crédito a quem conta, link e cartão para baixar.',
  subirH1: 'Escolher formato de participação',
  subirBackHome: '← Voltar ao início',
  modalClose: 'Fechar',
  modalContinue: 'Continuar',
  modalWaitVoice: 'Termine de gravar sua voz',
  modalWaitPhoto: 'Aguarde sua foto ficar pronta',
  modalWaitVideo: 'Termine de gravar seu vídeo',
  modalCapture: 'Captura',
  modalConfirmSend: 'Confirmação de envio',
  modalDetailsTitle: 'Conte um pouco sobre você',
  modalDetailsSubtitle:
    'Assim podemos colocar sua história no mapa e avisar você quando estiver publicada.',
  modalSendVideo: 'Enviar meu vídeo',
  modalSendAudio: 'Enviar meu áudio',
  modalSendText: 'Enviar meu texto',
  modalSendPhoto: 'Enviar minha foto',
  modalSendPhotos: 'Enviar minhas fotos',
  modalSendingVideo: 'Enviando seu vídeo…',
  modalSendingAudio: 'Enviando seu áudio…',
  modalSendingText: 'Enviando seu texto…',
  modalSendingPhotos: 'Enviando suas fotos…',
  modalSectionStory: 'História',
  modalStoryName: 'Título da sua história *',
  modalAlias: 'Nome ou apelido *',
  modalExtras: 'Quer contar mais alguma coisa? (opcional)',
  modalCancionRelacionada: 'Uma música para esta história (opcional)',
  modalFiles: 'Fotos extras (opcional, até 10 MB cada)',
  modalAttach: 'Adicionar fotos',
  modalProfilePhoto: 'Sua foto (opcional, até 10 MB)',
  modalUpload: 'Enviar',
  modalChange: 'Trocar',
  modalRemove: 'Remover',
  modalCountry: 'País *',
  modalCity: 'Cidade ou localidade *',
  modalAge: 'Idade *',
  modalAgeChoose: 'Escolha uma opção',
  modalAgeMenos18: 'Menos de 18',
  modalAge60: '60 ou mais',
  modalAgePreferNot: 'Prefiro não dizer',
  modalGender: 'Gênero (opcional)',
  modalGenderBlank: 'Escolha uma opção',
  modalGenderFemale: 'Feminino',
  modalGenderMale: 'Masculino',
  modalGenderNb: 'Não binário',
  modalGenderPreferNot: 'Prefiro não dizer',
  modalGenderOther: 'Outro',
  modalEmail: 'E-mail',
  modalEmailHint:
    'Avisamos por e-mail quando sua história estiver no mapa (depois da revisão). Não aparece em público.',
  modalLegalNote: 'Sua história ficará em revisão antes de fazer parte do AlmaMundi.',
  modalBack: 'Voltar',
  modalSending: 'Enviando…',
  modalSend: 'Enviar minha história',
  modalRecord: 'Gravar',
  modalRecording: 'Gravando…',
  modalReviewVideo: 'Revise seu vídeo',
  modalReviewAudio: 'Revise seu áudio',
  modalRecordVoice: 'Gravar voz',
  modalRerecord: 'Voltar a gravar',
  modalStop: 'Parar',
  modalListenClip: 'Escute antes de continuar. Se não gostar, grave de novo.',
  modalChars: '{n} / {max} caracteres',
  modalReceivedNamed: '{name},\nseu relato em cores.',
  modalReceivedAnon: 'Seu relato em cores.',
  modalReceivedAfterName: 'seu relato em cores.',
  modalReceivedAnonBefore: 'Seu relato em cores.',
  modalReceivedEmph: 'cores.',
  modalImprintAria: 'Seu relato em cores',
  modalDownloadImprint: 'Baixar',
  modalShareImprint: 'Compartilhar',
  modalShareCopied: 'Imagem copiada. Você pode colar onde quiser.',
  modalShareDownloaded: 'Seu navegador não pôde copiar a imagem; o PNG foi baixado.',
  modalShareFailed: 'Não foi possível compartilhar a imagem. Salve e compartilhe a partir da sua galeria.',
  modalCopyLink: 'Copiar link',
  modalAnotherStory: 'Outra história',
  modalLinkCopied: 'Link copiado',
  modalImprintWhat: 'De onde vêm estas cores?',
  modalImprintExplain: 'Esta imagem nasce da sua história e é só sua.',
  modalBackToMap: 'Explorar o mapa',
  modalTopicActive: 'Tema guia ativo',
  upload: {
    video: {
      title: 'Grave o momento que ainda vive em você',
      subtitle: 'Sua história merece ser vista.',
      limit: 'Até 5 minutos de vídeo.',
      uploadLabel: 'ou enviar um vídeo do seu dispositivo',
    },
    audio: {
      title: 'Há histórias que se contam melhor em voz alta',
      subtitle: 'Sua voz guarda o que as palavras escritas nem sempre podem.',
      limit: 'Até 5 minutos de áudio.',
      uploadLabel: 'ou enviar um áudio do seu dispositivo',
    },
    texto: {
      title: 'Escreva o que você não contou a ninguém,\nou o que contou a todos',
      subtitle: 'Aqui não se perde no scroll. Fica.',
      limit: 'Até 5000 caracteres.',
      uploadLabel: '',
    },
    foto: {
      title: 'Uma imagem pode guardar\no que as palavras não alcançam',
      subtitle: 'Envie até 8 fotos. Cada uma leva seu nome, o ano e o lugar onde foi tirada.',
      limit: 'Até 10 MB por foto.',
      uploadLabel: '',
    },
  },
};

const en: SiteUiMessages = {
  footerInitiativeOf: 'A nonprofit project by',
  footerLegalAria: 'Legal information and personal data',
  footerPrivacy: 'Privacy notice',
  footerTerms: 'Terms of use',
  footerMyData: 'My personal data',
  footerConductGuide: 'Code of conduct',
  footerConductGuideTitle:
    'AlmaMundi code of conduct (PDF): respect, care, and responsible use of the site',
  footerContact: 'Contact',
  cookieAria: 'Cookie notice',
  cookieBody: 'AlmaMundi uses essential cookies and basic analytics.',
  cookiePrivacyLink: 'Privacy policy',
  cookieAccept: 'Got it',
  listHeroTitle: 'The world holds millions of stories no one knows.',
  listHeroSubtitle: 'These are a few of them.',
  listFilterAria: 'Story filters',
  listFilterCountry: 'Country',
  listFilterClear: 'Clear filters',
  listFilterShowing: 'Showing {shown} of {total} stories.',
  listKickerVideos: 'Stories in video',
  listKickerAudios: 'Stories in audio',
  listKickerEscrito: 'Stories in writing',
  listKickerFotos: 'Stories in photos',
  listExpoVideos: 'alma.mundi / stories in video',
  listExpoAudios: 'alma.mundi / stories in audio',
  listExpoEscrito: 'alma.mundi / stories in writing',
  listExpoFotos: 'alma.mundi / stories in photos',
  listShareLabel: 'Share',
  listShareText:
    'Share the story with care: credit the teller, a link, and a downloadable card.',
  subirH1: 'Choose how to take part',
  subirBackHome: '← Back to home',
  modalClose: 'Close',
  modalContinue: 'Continue',
  modalWaitVoice: 'Finish recording your voice',
  modalWaitPhoto: 'Wait until your photo is ready',
  modalWaitVideo: 'Finish recording your video',
  modalCapture: 'Capture',
  modalConfirmSend: 'Submission confirmation',
  modalDetailsTitle: 'Tell us a little about yourself',
  modalDetailsSubtitle:
    "This is how we can place your story on the map and let you know when it's published.",
  modalSendVideo: 'Send my video',
  modalSendAudio: 'Send my audio',
  modalSendText: 'Send my text',
  modalSendPhoto: 'Send my photo',
  modalSendPhotos: 'Send my photos',
  modalSendingVideo: 'Sending your video…',
  modalSendingAudio: 'Sending your audio…',
  modalSendingText: 'Sending your text…',
  modalSendingPhotos: 'Sending your photos…',
  modalSectionStory: 'Story',
  modalStoryName: 'Title of your story *',
  modalAlias: 'Name or alias *',
  modalExtras: 'Anything else you want to tell us? (optional)',
  modalCancionRelacionada: 'A song for this story (optional)',
  modalFiles: 'Extra photos (optional, up to 10 MB each)',
  modalAttach: 'Add photos',
  modalProfilePhoto: 'Your photo (optional, up to 10 MB)',
  modalUpload: 'Upload',
  modalChange: 'Change',
  modalRemove: 'Remove',
  modalCountry: 'Country *',
  modalCity: 'City or town *',
  modalAge: 'Age *',
  modalAgeChoose: 'Choose an option',
  modalAgeMenos18: 'Under 18',
  modalAge60: '60 or over',
  modalAgePreferNot: 'Prefer not to say',
  modalGender: 'Gender (optional)',
  modalGenderBlank: 'Choose an option',
  modalGenderFemale: 'Female',
  modalGenderMale: 'Male',
  modalGenderNb: 'Non-binary',
  modalGenderPreferNot: 'Prefer not to say',
  modalGenderOther: 'Other',
  modalEmail: 'Email',
  modalEmailHint:
    "We'll email you when your story is on the map (after review). It's not shown publicly.",
  modalLegalNote: 'Your story will be reviewed before it becomes part of AlmaMundi.',
  modalBack: 'Back',
  modalSending: 'Sending…',
  modalSend: 'Send my story',
  modalRecord: 'Record',
  modalRecording: 'Recording…',
  modalReviewVideo: 'Review your video',
  modalReviewAudio: 'Review your audio',
  modalRecordVoice: 'Record voice',
  modalRerecord: 'Record again',
  modalStop: 'Stop',
  modalListenClip: "Listen to it before continuing. If you're not happy with it, record again.",
  modalChars: '{n} / {max} characters',
  modalReceivedNamed: '{name},\nyour story in colors.',
  modalReceivedAnon: 'Your story in colors.',
  modalReceivedAfterName: 'your story in colors.',
  modalReceivedAnonBefore: 'Your story in colors.',
  modalReceivedEmph: 'colors.',
  modalImprintAria: 'Your story in colors',
  modalDownloadImprint: 'Download',
  modalShareImprint: 'Share',
  modalShareCopied: 'Image copied. You can paste it wherever you like.',
  modalShareDownloaded: "Your browser couldn't copy the image; the PNG was downloaded instead.",
  modalShareFailed: "We couldn't share the image. Save it and share it from your gallery.",
  modalCopyLink: 'Copy link',
  modalAnotherStory: 'Another story',
  modalLinkCopied: 'Link copied',
  modalImprintWhat: 'Where do these colors come from?',
  modalImprintExplain: 'This image comes from your story and is yours alone.',
  modalBackToMap: 'Explore the map',
  modalTopicActive: 'Active guide theme',
  upload: {
    video: {
      title: 'Record the moment that still lives in you',
      subtitle: 'Your story deserves to be seen.',
      limit: 'Up to 5 minutes of video.',
      uploadLabel: 'or upload a video from your device',
    },
    audio: {
      title: 'Some stories are best told out loud',
      subtitle: "Your voice holds what written words can't always carry.",
      limit: 'Up to 5 minutes of audio.',
      uploadLabel: 'or upload audio from your device',
    },
    texto: {
      title: 'Write what you never told anyone,\nor what you told everyone',
      subtitle: "Here, it doesn't get lost in the scroll. It stays.",
      limit: 'Up to 5,000 characters.',
      uploadLabel: '',
    },
    foto: {
      title: "An image can hold\nwhat words can't reach",
      subtitle: 'Upload up to 8 photos. Each one includes its name, the year, and the place where it was taken.',
      limit: 'Up to 10 MB per photo.',
      uploadLabel: '',
    },
  },
};

export const SITE_UI_MESSAGES: Record<AlmaLocale, SiteUiMessages> = { es, pt, en };
