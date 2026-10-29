import type { UploadModalCopy } from '@/lib/subir-upload-modal-copy';
import type { AlmaLocale } from '@/lib/i18n/locale';

export type SiteUiMessages = {
  footerClosingLine: string;
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
  listFilterBlockTitle: string;
  listFilterCountry: string;
  listFilterYear: string;
  listFilterAllYears: string;
  listFilterKeywords: string;
  listFilterClear: string;
  listFilterNoMatch: string;
  listFilterShowing: string;
  listCarouselAria: string;
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
  listLetterLabel: string;
  listLetterText: string;
  coleccionKicker: string;
  coleccionTitle: string;
  coleccionSubtitle: string;
  coleccionEmpty: string;
  coleccionEmptyHint: string;
  coleccionGoStories: string;
  coleccionShare: string;
  coleccionCopied: string;
  coleccionCreateInspired: string;
  coleccionRemove: string;
  coleccionRemoveAria: string;
  coleccionUntitled: string;
  archivoBack: string;
  archivoTitle: string;
  archivoLead: string;
  archivoTabWeek: string;
  archivoTabTheme: string;
  archivoTabMuestras: string;
  archivoLoading: string;
  archivoEmpty: string;
  archivoAll: string;
  archivoEmptyTheme: string;
  archivoMuestrasCount: string;
  archivoViewMuestra: string;
  archivoEmptyMuestras: string;
  archivoWeekTitle: string;
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
  footerClosingLine:
    'Historias que no se pierden, sino que despiertan otras historias.',
  footerInitiativeOf: 'Una iniciativa de',
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
  listFilterBlockTitle: 'Buscar por país, año o palabras clave',
  listFilterCountry: 'País',
  listFilterYear: 'Año',
  listFilterAllYears: 'Todos los años',
  listFilterKeywords: 'Palabras clave',
  listFilterClear: 'Limpiar filtros',
  listFilterNoMatch:
    'Ninguna historia coincide con los filtros. El carrusel muestra las {count} historias disponibles. Ajusta los filtros o pulsa «Limpiar filtros».',
  listFilterShowing: 'Mostrando {shown} de {total} historias.',
  listCarouselAria: 'Carrusel de historias',
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
  listLetterLabel: 'Mensaje a quien cuenta',
  listLetterText:
    'Escribir un mensaje breve de resonancia para quien narra este relato. AlmaMundi recibe tu mensaje, lo revisa con cuidado (incluye un filtro automático de respeto) y, cuando corresponda, puede acercárselo a quien lo contó. Es un proceso con pausa: no hay envío directo sin este resguardo.',
  coleccionKicker: 'Tu colección',
  coleccionTitle: 'Historias que guardaste',
  coleccionSubtitle: 'Compártelas o úsalas como inspiración para crear la tuya.',
  coleccionEmpty: 'Aún no has guardado ninguna historia.',
  coleccionEmptyHint:
    'En Videos o Audios, elige una historia y haz clic en "Guardar en mi colección".',
  coleccionGoStories: 'Ir a Historias',
  coleccionShare: 'Compartir',
  coleccionCopied: 'Copiado',
  coleccionCreateInspired: 'Crear inspirado en esta',
  coleccionRemove: 'Quitar',
  coleccionRemoveAria: 'Quitar de mi colección',
  coleccionUntitled: 'Sin título',
  archivoBack: '← AlmaMundi',
  archivoTitle: 'Archivo',
  archivoLead: 'Historias que ya pasaron por el mapa y permanecen en el archivo.',
  archivoTabWeek: 'Por semana',
  archivoTabTheme: 'Por tema',
  archivoTabMuestras: 'Muestras',
  archivoLoading: 'Cargando…',
  archivoEmpty: 'El archivo se construye con las historias que ya recorrieron el mapa. La tuya también puede llegar.',
  archivoAll: 'Todos',
  archivoEmptyTheme: 'Este tema, en el archivo, se escribe con historias como la tuya.',
  archivoMuestrasCount: 'AlmaMundi · {n} historias',
  archivoViewMuestra: 'Ver muestra',
  archivoEmptyMuestras: 'No hay muestras publicadas.',
  archivoWeekTitle: '{week}, {day} {month} {year}',
  subirH1: 'Elegir formato de participación',
  subirBackHome: '← Volver al inicio',
  modalClose: 'Cerrar',
  modalContinue: 'Continuar',
  modalWaitVoice: 'Termina de grabar tu voz',
  modalWaitPhoto: 'Espera a que tu foto esté lista',
  modalWaitVideo: 'Termina de grabar tu video',
  modalCapture: 'Captura',
  modalConfirmSend: 'Confirmación de envío',
  modalDetailsTitle: 'Por favor, déjanos tus datos',
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
      limit: '',
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
  footerClosingLine:
    'Histórias que não se perdem, mas despertam outras histórias.',
  footerInitiativeOf: 'Uma iniciativa de',
  footerLegalAria: 'Informação legal e dados pessoais',
  footerPrivacy: 'Aviso de privacidade',
  footerTerms: 'Termos de uso',
  footerMyData: 'Os meus dados pessoais',
  footerConductGuide: 'Guia de conduta',
  footerConductGuideTitle:
    'Guia de conduta AlmaMundi (PDF): respeito, cuidado e uso responsável do site',
  footerContact: 'Contacto',
  cookieAria: 'Aviso de cookies',
  cookieBody: 'AlmaMundi usa cookies essenciais e análise básica.',
  cookiePrivacyLink: 'Política de privacidade',
  cookieAccept: 'Entendido',
  listHeroTitle: 'O mundo tem milhões de histórias que ninguém conhece.',
  listHeroSubtitle: 'Estas são algumas.',
  listFilterAria: 'Filtros de histórias',
  listFilterBlockTitle: 'Procurar por país, ano ou palavras-chave',
  listFilterCountry: 'País',
  listFilterYear: 'Ano',
  listFilterAllYears: 'Todos os anos',
  listFilterKeywords: 'Palavras-chave',
  listFilterClear: 'Limpar filtros',
  listFilterNoMatch:
    'Nenhuma história coincide com os filtros. O carrossel mostra as {count} histórias disponíveis. Ajuste os filtros ou toque em «Limpar filtros».',
  listFilterShowing: 'A mostrar {shown} de {total} histórias.',
  listCarouselAria: 'Carrossel de histórias',
  listKickerVideos: 'Histórias em vídeo',
  listKickerAudios: 'Histórias em áudio',
  listKickerEscrito: 'Histórias em texto',
  listKickerFotos: 'Histórias em foto',
  listExpoVideos: 'alma.mundi / histórias em vídeo',
  listExpoAudios: 'alma.mundi / histórias em áudio',
  listExpoEscrito: 'alma.mundi / histórias em texto',
  listExpoFotos: 'alma.mundi / histórias em foto',
  listShareLabel: 'Partilhar',
  listShareText:
    'Partilhar a história com respeito: crédito a quem a conta, ligação e cartão para descarregar.',
  listLetterLabel: 'Mensagem a quem conta',
  listLetterText:
    'Escrever uma mensagem breve de ressonância para quem narra este relato. AlmaMundi recebe a sua mensagem, revê-a com cuidado (inclui um filtro automático de respeito) e, quando corresponder, pode aproximá-la de quem a contou. É um processo com pausa: não há envio direto sem este resguardo.',
  coleccionKicker: 'A sua coleção',
  coleccionTitle: 'Histórias que guardou',
  coleccionSubtitle: 'Partilhe-as ou use-as como inspiração para criar a sua.',
  coleccionEmpty: 'Ainda não guardou nenhuma história.',
  coleccionEmptyHint:
    'Em Vídeos ou Áudios, escolha uma história e toque em "Guardar na minha coleção".',
  coleccionGoStories: 'Ir a Histórias',
  coleccionShare: 'Partilhar',
  coleccionCopied: 'Copiado',
  coleccionCreateInspired: 'Criar inspirado nesta',
  coleccionRemove: 'Remover',
  coleccionRemoveAria: 'Remover da minha coleção',
  coleccionUntitled: 'Sem título',
  archivoBack: '← AlmaMundi',
  archivoTitle: 'Arquivo',
  archivoLead: 'Histórias que já passaram pelo mapa e permanecem no arquivo.',
  archivoTabWeek: 'Por semana',
  archivoTabTheme: 'Por tema',
  archivoTabMuestras: 'Amostras',
  archivoLoading: 'A carregar…',
  archivoEmpty: 'O arquivo se constrói com as histórias que já percorreram o mapa. A sua também pode chegar.',
  archivoAll: 'Todos',
  archivoEmptyTheme: 'Este tema, no arquivo, se escreve com histórias como a sua.',
  archivoMuestrasCount: 'AlmaMundi · {n} histórias',
  archivoViewMuestra: 'Ver amostra',
  archivoEmptyMuestras: 'Não há amostras publicadas.',
  archivoWeekTitle: '{week}, {day} {month} {year}',
  subirH1: 'Escolher formato de participação',
  subirBackHome: '← Voltar ao início',
  modalClose: 'Fechar',
  modalContinue: 'Continuar',
  modalWaitVoice: 'Termine de gravar sua voz',
  modalWaitPhoto: 'Aguarde sua foto ficar pronta',
  modalWaitVideo: 'Termine de gravar seu vídeo',
  modalCapture: 'Captura',
  modalConfirmSend: 'Confirmação de envio',
  modalDetailsTitle: 'Por favor, deixe-nos os seus dados',
  modalDetailsSubtitle:
    'Assim podemos colocar a sua história no mapa e avisá-lo quando estiver publicada.',
  modalSendVideo: 'Enviar o meu vídeo',
  modalSendAudio: 'Enviar o meu áudio',
  modalSendText: 'Enviar o meu texto',
  modalSendPhoto: 'Enviar a minha foto',
  modalSendPhotos: 'Enviar as minhas fotos',
  modalSendingVideo: 'A enviar o seu vídeo…',
  modalSendingAudio: 'A enviar o seu áudio…',
  modalSendingText: 'A enviar o seu texto…',
  modalSendingPhotos: 'A enviar as suas fotos…',
  modalSectionStory: 'História',
  modalStoryName: 'Título da sua história *',
  modalAlias: 'Nome ou alias *',
  modalExtras: 'Quer contar mais alguma coisa? (opcional)',
  modalCancionRelacionada:
    'Existe uma canção que se liga a esta história? Pode deixar o nome ou um link (opcional).',
  modalFiles: 'Ficheiros · máx. {mb}MB cada',
  modalAttach: 'Anexar',
  modalProfilePhoto: 'Foto de perfil (opc.) · máx. {mb}MB',
  modalUpload: 'Enviar',
  modalChange: 'Mudar',
  modalRemove: 'Remover',
  modalCountry: 'País *',
  modalCity: 'Cidade ou localidade *',
  modalAge: 'Faixa etária *',
  modalAgeChoose: 'Escolha uma opção',
  modalAgeMenos18: 'Menos de 18',
  modalAge60: '60 ou mais',
  modalAgePreferNot: 'Prefiro não dizer',
  modalGender: 'Género (opcional)',
  modalGenderBlank: 'Prefiro não indicar',
  modalGenderFemale: 'Feminino',
  modalGenderMale: 'Masculino',
  modalGenderNb: 'Não binário',
  modalGenderPreferNot: 'Prefiro não dizer',
  modalGenderOther: 'Outro',
  modalEmail: 'Correio eletrónico',
  modalEmailHint:
    'Avisamo-lo por correio quando a sua história estiver no mapa (após a revisão). Não se mostra em público.',
  modalLegalNote: 'A sua história ficará em revisão antes de fazer parte de AlmaMundi.',
  modalBack: 'Voltar',
  modalSending: 'A enviar…',
  modalSend: 'Enviar',
  modalRecord: 'Gravar',
  modalRecording: 'A gravar…',
  modalReviewVideo: 'Reveja o seu vídeo',
  modalReviewAudio: 'Reveja o seu áudio',
  modalRecordVoice: 'Gravar voz',
  modalRerecord: 'Voltar a gravar',
  modalStop: 'Parar',
  modalListenClip: 'Escute o clip completo antes de continuar.',
  modalChars: '{n} / {max} caracteres',
  modalReceivedNamed: '{name},\no seu relato em cores.',
  modalReceivedAnon: 'Seu relato em cores.',
  modalReceivedAfterName: 'o seu relato em cores.',
  modalReceivedAnonBefore: 'Seu relato em cores.',
  modalReceivedEmph: 'cores.',
  modalImprintAria: 'Seu relato em cores',
  modalDownloadImprint: 'Descarregar',
  modalShareImprint: 'Partilhar',
  modalShareCopied: 'Imagem copiada. Pode colá-la onde quiser.',
  modalShareDownloaded: 'O seu navegador não pôde copiar a imagem; o PNG foi descarregado.',
  modalShareFailed: 'Não foi possível partilhar a imagem.',
  modalCopyLink: 'Copiar ligação',
  modalAnotherStory: 'Outra história',
  modalLinkCopied: 'Ligação copiada',
  modalImprintWhat: 'De onde vêm estas cores?',
  modalImprintExplain: 'Esta imagem nasce da sua história e é só sua.',
  modalBackToMap: 'Explorar o mapa',
  modalTopicActive: 'Tema guia ativo',
  upload: {
    video: {
      title: 'Grave o momento que ainda vive em si',
      subtitle: 'A sua história merece ser vista.',
      limit: 'Até 5 minutos de vídeo.',
      uploadLabel: 'ou enviar um vídeo do seu dispositivo',
    },
    audio: {
      title: 'Há histórias que se entendem melhor quando se escutam',
      subtitle: 'A sua voz guarda o que as palavras escritas nem sempre podem.',
      limit: 'Até 5 minutos de áudio.',
      uploadLabel: 'ou enviar um áudio do seu dispositivo',
    },
    texto: {
      title: 'Escreva o que não contou a ninguém,\nou o que contou a todos',
      subtitle: 'Aqui não se perde no scroll. Fica.',
      limit: '',
      uploadLabel: '',
    },
    foto: {
      title: 'Uma imagem pode guardar\no que as palavras não alcançam',
      subtitle: 'Envie até 8 fotos. Cada uma leva o seu nome, o ano e o lugar onde foi tirada.',
      limit: 'Até 10 MB por foto.',
      uploadLabel: '',
    },
  },
};

const en: SiteUiMessages = {
  footerClosingLine: 'Stories that are not lost, they awaken other stories.',
  footerInitiativeOf: 'An initiative of',
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
  listFilterBlockTitle: 'Search by country, year, or keywords',
  listFilterCountry: 'Country',
  listFilterYear: 'Year',
  listFilterAllYears: 'All years',
  listFilterKeywords: 'Keywords',
  listFilterClear: 'Clear filters',
  listFilterNoMatch:
    'No stories match the filters. The carousel shows the {count} stories available. Adjust the filters or tap “Clear filters”.',
  listFilterShowing: 'Showing {shown} of {total} stories.',
  listCarouselAria: 'Stories carousel',
  listKickerVideos: 'Stories in video',
  listKickerAudios: 'Stories in audio',
  listKickerEscrito: 'Stories in writing',
  listKickerFotos: 'Stories in photo',
  listExpoVideos: 'alma.mundi / stories in video',
  listExpoAudios: 'alma.mundi / stories in audio',
  listExpoEscrito: 'alma.mundi / stories in writing',
  listExpoFotos: 'alma.mundi / stories in photo',
  listShareLabel: 'Share',
  listShareText:
    'Share the story with care: credit the teller, a link, and a downloadable card.',
  listLetterLabel: 'Message to the teller',
  listLetterText:
    'Write a short resonance message to the person who told this story. AlmaMundi receives your message, reviews it with care (including an automatic respect filter) and, when it is right, may pass it on. There is a pause: nothing is sent through without this safeguard.',
  coleccionKicker: 'Your collection',
  coleccionTitle: 'Stories you saved',
  coleccionSubtitle: 'Share them, or use them as a spark to create yours.',
  coleccionEmpty: 'You have not saved any stories yet.',
  coleccionEmptyHint:
    'In Videos or Audio, choose a story and click “Save to my collection”.',
  coleccionGoStories: 'Go to Stories',
  coleccionShare: 'Share',
  coleccionCopied: 'Copied',
  coleccionCreateInspired: 'Create inspired by this',
  coleccionRemove: 'Remove',
  coleccionRemoveAria: 'Remove from my collection',
  coleccionUntitled: 'Untitled',
  archivoBack: '← AlmaMundi',
  archivoTitle: 'Archive',
  archivoLead: 'Stories that have left the map and remain in the archive.',
  archivoTabWeek: 'By week',
  archivoTabTheme: 'By theme',
  archivoTabMuestras: 'Samples',
  archivoLoading: 'Loading…',
  archivoEmpty: 'The archive is built from stories that have already traveled the map. Yours can arrive too.',
  archivoAll: 'All',
  archivoEmptyTheme: 'This theme in the archive is written with stories like yours.',
  archivoMuestrasCount: 'AlmaMundi · {n} stories',
  archivoViewMuestra: 'View sample',
  archivoEmptyMuestras: 'No samples published.',
  archivoWeekTitle: '{week}, {day} {month} {year}',
  subirH1: 'Choose how to take part',
  subirBackHome: '← Back to home',
  modalClose: 'Close',
  modalContinue: 'Continue',
  modalWaitVoice: 'Finish recording your voice',
  modalWaitPhoto: 'Wait until your photo is ready',
  modalWaitVideo: 'Finish recording your video',
  modalCapture: 'Capture',
  modalConfirmSend: 'Submission confirmation',
  modalDetailsTitle: 'Please leave us your details',
  modalDetailsSubtitle:
    'This is how we can place your story on the map and let you know when it is published.',
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
  modalCancionRelacionada:
    'Is there a song that connects with this story? You can leave the name or a link (optional).',
  modalFiles: 'Files · max. {mb}MB each',
  modalAttach: 'Attach',
  modalProfilePhoto: 'Profile photo (opt.) · max. {mb}MB',
  modalUpload: 'Upload',
  modalChange: 'Change',
  modalRemove: 'Remove',
  modalCountry: 'Country *',
  modalCity: 'City or town *',
  modalAge: 'Age range *',
  modalAgeChoose: 'Choose an option',
  modalAgeMenos18: 'Under 18',
  modalAge60: '60 or over',
  modalAgePreferNot: 'Prefer not to say',
  modalGender: 'Gender (optional)',
  modalGenderBlank: 'Prefer not to say',
  modalGenderFemale: 'Female',
  modalGenderMale: 'Male',
  modalGenderNb: 'Non-binary',
  modalGenderPreferNot: 'Prefer not to say',
  modalGenderOther: 'Other',
  modalEmail: 'Email',
  modalEmailHint:
    'We will email you when your story is on the map (after review). It is not shown publicly.',
  modalLegalNote: 'Your story will be reviewed before it becomes part of AlmaMundi.',
  modalBack: 'Back',
  modalSending: 'Sending…',
  modalSend: 'Send',
  modalRecord: 'Record',
  modalRecording: 'Recording…',
  modalReviewVideo: 'Review your video',
  modalReviewAudio: 'Review your audio',
  modalRecordVoice: 'Record voice',
  modalRerecord: 'Record again',
  modalStop: 'Stop',
  modalListenClip: 'Listen to the full clip before continuing.',
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
  modalShareDownloaded: 'Your browser could not copy the image; the PNG was downloaded instead.',
  modalShareFailed: 'Could not share the image.',
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
      title: 'Some stories are better understood when they are heard',
      subtitle: 'Your voice holds what written words cannot always carry.',
      limit: 'Up to 5 minutes of audio.',
      uploadLabel: 'or upload audio from your device',
    },
    texto: {
      title: 'Write what you never told anyone,\nor what you told everyone',
      subtitle: 'Here it is not lost in the scroll. It stays.',
      limit: '',
      uploadLabel: '',
    },
    foto: {
      title: 'An image can hold\nwhat words cannot reach',
      subtitle: 'Upload up to 8 photos. Each one includes its name, the year, and the place where it was taken.',
      limit: 'Up to 10 MB per photo.',
      uploadLabel: '',
    },
  },
};

export const SITE_UI_MESSAGES: Record<AlmaLocale, SiteUiMessages> = { es, pt, en };
