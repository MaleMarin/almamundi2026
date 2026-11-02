import type { AlmaLocale } from '@/lib/i18n/locale';
import { formatPublicName } from '@/lib/historias/story-ubicacion';

type L3 = Record<AlmaLocale, string>;

export const PREGUNTA_COPY = {
  intro: {
    es: 'Además de contar tu historia, aquí puedes responder. Cada semana lanzamos una pregunta al mundo, y cada respuesta enciende un punto en el mapa.',
    pt: 'Além de contar sua história, aqui você pode responder. Toda semana lançamos uma pergunta ao mundo, e cada resposta acende um ponto no mapa.',
    en: 'Besides telling your story, here you can answer. Every week we ask the world a question, and every answer lights up a point on the map.',
  },
  homeEyebrow: {
    es: 'La pregunta de la semana',
    pt: 'A pergunta da semana',
    en: "This week's question",
  },
  submit: {
    es: 'Enviar mi respuesta',
    pt: 'Enviar minha resposta',
    en: 'Send my answer',
  },
  waitVoice: {
    es: 'Termina de grabar tu voz',
    pt: 'Termine de gravar sua voz',
    en: 'Finish recording your voice',
  },
  waitPhoto: {
    es: 'Espera a que tu foto esté lista',
    pt: 'Aguarde sua foto ficar pronta',
    en: 'Wait until your photo is ready',
  },
  thanksTitle: {
    es: 'Tu respuesta llegó, [alias]',
    pt: 'Sua resposta chegou, [alias]',
    en: 'Your answer arrived, [alias]',
  },
  thanksMail: {
    es: 'Una persona del equipo la leerá antes de publicarla. Mientras tanto, ¿te animas con otra pregunta?',
    pt: 'Uma pessoa da equipe vai lê-la antes de publicá-la. Enquanto isso, que tal responder outra pergunta?',
    en: "Someone on our team will read it before it's published. Meanwhile, how about another question?",
  },
  thanksMap: {
    es: 'Una persona del equipo la leerá antes de publicarla. Mientras tanto, ¿te animas con otra pregunta?',
    pt: 'Uma pessoa da equipe vai lê-la antes de publicá-la. Enquanto isso, que tal responder outra pergunta?',
    en: "Someone on our team will read it before it's published. Meanwhile, how about another question?",
  },
  another: {
    es: 'Responde otra pregunta',
    pt: 'Responda outra pergunta',
    en: 'Answer another question',
  },
  sending: {
    es: 'Enviando…',
    pt: 'Enviando…',
    en: 'Sending…',
  },
  share: {
    es: 'Comparte la pregunta',
    pt: 'Compartilhe a pergunta',
    en: 'Share the question',
  },
  seeWorld: {
    es: 'Ver respuestas en el mapa',
    pt: 'Ver respostas no mapa',
    en: 'See answers on the map',
  },
  seeAll: {
    es: 'Ver todas las respuestas',
    pt: 'Ver todas as respostas',
    en: 'See all answers',
  },
  weekKicker: {
    es: 'La pregunta de la semana',
    pt: 'A pergunta da semana',
    en: "This week's question",
  },
  pastKicker: {
    es: 'Pregunta anterior',
    pt: 'Pergunta anterior',
    en: 'Previous question',
  },
  answers: {
    es: 'Respuestas',
    pt: 'Respostas',
    en: 'Answers',
  },
  empty: {
    es: 'Todavía no hay respuestas. Sé la primera persona en responder.',
    pt: 'Ainda não há respostas. Seja a primeira pessoa a responder.',
    en: 'No answers yet. Be the first to answer.',
  },
  how: {
    es: '¿Cómo quieres responder?',
    pt: 'Como você quer responder?',
    en: 'How do you want to answer?',
  },
  write: { es: 'Escribir', pt: 'Escrever', en: 'Write' },
  kindVoice: { es: 'Tu voz', pt: 'Sua voz', en: 'Your voice' },
  kindPhoto: { es: 'Foto', pt: 'Foto', en: 'Photo' },
  tapRecord: { es: 'Toca para grabar', pt: 'Toque para gravar', en: 'Tap to record' },
  tapStop: { es: 'Toca para detener', pt: 'Toque para parar', en: 'Tap to stop' },
  recordAgain: { es: 'Grabar de nuevo', pt: 'Gravar de novo', en: 'Record again' },
  orUpload: { es: 'o sube un audio', pt: 'ou envie um áudio', en: 'or upload audio' },
  choosePhoto: { es: 'Elige una foto', pt: 'Escolha uma foto', en: 'Choose a photo' },
  record: { es: 'Grabar tu voz', pt: 'Gravar sua voz', en: 'Record your voice' },
  uploadAudio: { es: 'Subir un audio', pt: 'Enviar um áudio', en: 'Upload audio' },
  photo: { es: 'Una foto con una frase', pt: 'Uma foto com uma frase', en: 'A photo with a sentence' },
  caption: { es: 'Frase de la foto', pt: 'Frase da foto', en: 'Photo caption' },
  errText: {
    es: 'El texto puede tener hasta 1000 caracteres.',
    pt: 'O texto pode ter até 1000 caracteres.',
    en: 'Your text can be up to 1000 characters.',
  },
  errAudio: {
    es: 'Este audio dura más de 2 minutos.',
    pt: 'Este áudio dura mais de 2 minutos.',
    en: 'This audio is longer than 2 minutes.',
  },
  errAudioSize: {
    es: 'Este audio pesa más de 5 MB.',
    pt: 'Este áudio tem mais de 5 MB.',
    en: 'This audio is larger than 5 MB.',
  },
  errPhotoType: {
    es: 'Esa foto debe ser JPG, PNG, WEBP o HEIC.',
    pt: 'A foto deve ser JPG, PNG, WEBP ou HEIC.',
    en: 'The photo must be JPG, PNG, WEBP or HEIC.',
  },
  errPhotoSize: {
    es: 'Esa foto pesa más de 10 MB.',
    pt: 'A foto tem mais de 10 MB.',
    en: 'The photo is larger than 10 MB.',
  },
  photoPreparing: {
    es: 'Preparando tu foto…',
    pt: 'Preparando sua foto…',
    en: 'Preparing your photo…',
  },
  errPhotoRead: {
    es: 'No pudimos leer esta foto. Prueba con una en JPG o PNG.',
    pt: 'Não conseguimos ler esta foto. Tente uma em JPG ou PNG.',
    en: "We couldn't read this photo. Try one in JPG or PNG.",
  },
  errCaption: {
    es: 'Falta la frase de la foto.',
    pt: 'Falta a frase da foto.',
    en: 'Add a caption to your photo.',
  },
  errCaptionLong: {
    es: 'La frase de la foto puede tener hasta 200 caracteres.',
    pt: 'A frase da foto pode ter até 200 caracteres.',
    en: 'The caption can be up to 200 characters.',
  },
  errSend: {
    es: 'No pudimos enviar tu respuesta. Lo que escribiste sigue aquí.',
    pt: 'Não conseguimos enviar sua resposta. O que você escreveu continua aqui.',
    en: "We couldn't send your answer. What you wrote is still here.",
  },
  errEmail: {
    es: 'Revisa tu correo, parece incompleto.',
    pt: 'Confira seu e-mail, parece incompleto.',
    en: 'Check your email, it looks incomplete.',
  },
  errAudioType: {
    es: 'Este formato de audio no es compatible. Prueba con .mp3, .m4a o .wav.',
    pt: 'Este formato de áudio não é compatível. Tente .mp3, .m4a ou .wav.',
    en: "This audio format isn't supported. Try .mp3, .m4a or .wav.",
  },
  emailLabel: {
    es: 'Correo electrónico (opcional)',
    pt: 'E-mail (opcional)',
    en: 'Email (optional)',
  },
  emailHint: {
    es: 'Si quieres saber cuándo publicamos tu respuesta, déjanos tu correo y te avisaremos. Tu correo no será público.',
    pt: 'Se quiser saber quando publicarmos sua resposta, deixe seu e-mail e avisaremos você. Seu e-mail não será público.',
    en: "If you'd like to know when we publish your answer, leave your email and we'll let you know. Your email won't be public.",
  },
  shareBody: {
    es: 'AlmaMundi pregunta: [pregunta] Yo ya respondí. ¿Y tú? [enlace]',
    pt: 'O AlmaMundi pergunta: [pergunta] Eu já respondi. E você? [enlace]',
    en: 'AlmaMundi asks: [pregunta] I already answered. What about you? [enlace]',
  },
  shareInvite: {
    es: 'Esta semana AlmaMundi le pregunta al mundo: [pregunta] ¿Tú qué responderías? [enlace]',
    pt: 'Esta semana o AlmaMundi pergunta ao mundo: [pergunta] O que você responderia? [enlace]',
    en: 'This week AlmaMundi is asking the world: [pregunta] What would you answer? [enlace]',
  },
} as const satisfies Record<string, L3>;

export function preguntaAlias(alias: string): string {
  return formatPublicName(alias);
}

export function preguntaThanksTitle(locale: AlmaLocale, alias: string): string {
  const name = alias.trim();
  // Nombre con mayúscula inicial («ana» → «Ana»), sin tocar el resto.
  const pretty = name ? name.charAt(0).toLocaleUpperCase(locale) + name.slice(1) : name;
  return PREGUNTA_COPY.thanksTitle[locale].replace('[alias]', pretty);
}

function preguntaShareLine(template: string, pregunta: string, enlace: string): string {
  const text = template
    .replace('[pregunta]', pregunta)
    .replace('[pergunta]', pregunta)
    .replace('[enlace]', enlace);
  return text.includes(enlace) ? text : `${text} ${enlace}`;
}

/** Después de responder: la persona ya contestó. */
export function preguntaShareText(locale: AlmaLocale, pregunta: string, enlace: string): string {
  return preguntaShareLine(PREGUNTA_COPY.shareBody[locale], pregunta, enlace);
}

/** Desde el mapa o la página de la pregunta, antes de responder. */
export function preguntaInviteShareText(locale: AlmaLocale, pregunta: string, enlace: string): string {
  return preguntaShareLine(PREGUNTA_COPY.shareInvite[locale], pregunta, enlace);
}
