import type { AlmaLocale } from '@/lib/i18n/locale';

type L3 = Record<AlmaLocale, string>;

export const PREGUNTA_COPY = {
  intro: {
    es: 'Cada semana, una pregunta para todo el mundo. Responde en un minuto y descubre cómo contestan otros.',
    pt: 'Toda semana, uma pergunta para o mundo inteiro. Responda em um minuto e descubra como os outros respondem.',
    en: 'Every week, one question for the whole world. Answer in a minute and see how others reply.',
  },
  submit: {
    es: 'Enviar mi respuesta',
    pt: 'Enviar minha resposta',
    en: 'Send my answer',
  },
  thanks: {
    es: 'Gracias, [alias]. Tu respuesta está en revisión. Te escribiremos cuando aparezca en el mapa.',
    pt: 'Obrigado, [alias]. Sua resposta está em revisão. Vamos te avisar quando aparecer no mapa.',
    en: "Thank you, [alias]. Your answer is under review. We'll write to you when it appears on the map.",
  },
  share: {
    es: 'Comparte la pregunta',
    pt: 'Compartilhe a pergunta',
    en: 'Share the question',
  },
  seeWorld: {
    es: 'Mira cómo responde el mundo',
    pt: 'Veja como o mundo responde',
    en: 'See how the world answers',
  },
  empty: {
    es: 'Sé la primera persona en responder.',
    pt: 'Seja a primeira pessoa a responder.',
    en: 'Be the first to answer.',
  },
  write: { es: 'Escribir', pt: 'Escrever', en: 'Write' },
  record: { es: 'Grabar tu voz', pt: 'Gravar sua voz', en: 'Record your voice' },
  uploadAudio: { es: 'Subir un audio', pt: 'Enviar um áudio', en: 'Upload audio' },
  photo: { es: 'Una foto con una frase', pt: 'Uma foto com uma frase', en: 'A photo with a sentence' },
  caption: { es: 'Frase de la foto', pt: 'Frase da foto', en: 'Photo caption' },
  all: { es: 'Todas', pt: 'Todas', en: 'All' },
  you: { es: 'Tú', pt: 'Você', en: 'You' },
  someone: { es: 'Alguien', pt: 'Alguém', en: 'Someone' },
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
  shareBody: {
    es: 'Esta semana AlmaMundi le pregunta al mundo: [pregunta] Yo ya respondí. ¿Y tú? [enlace]',
    pt: 'Esta semana o AlmaMundi pergunta ao mundo: [pregunta] Eu já respondi. E você? [enlace]',
    en: 'This week AlmaMundi is asking the world: [pregunta] I already answered. What about you? [enlace]',
  },
} as const satisfies Record<string, L3>;

export function preguntaThanks(locale: AlmaLocale, alias: string): string {
  return PREGUNTA_COPY.thanks[locale].replace('[alias]', alias.trim());
}

export function preguntaShareText(locale: AlmaLocale, pregunta: string, enlace: string): string {
  return PREGUNTA_COPY.shareBody[locale].replace('[pregunta]', pregunta).replace('[enlace]', enlace);
}
