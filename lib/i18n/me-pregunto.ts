import type { AlmaLocale } from '@/lib/i18n/locale';

/** Textos aprobados por Ana (3 nov 2026) para «Me pregunto…». */
export const ME_PREGUNTO_UI: Record<
  AlmaLocale,
  {
    nombre: string;
    capa: string;
    bajada: string;
    dejar: string;
    vacio: string;
    loPregunta: (alias: string, lugar: string) => string;
    campo: string;
    ayuda: string;
    alias: string;
    pais: string;
    ciudad: string;
    correo: string;
    correoAyuda: string;
    enviar: string;
    enviando: string;
    cancelar: string;
    gracias: (alias: string) => string;
    graciasTexto: string;
    respondesA: string;
    consentAdulto: string;
    consentPublicar: string;
    graciasRespuesta: string;
    respuestaDe: (alias: string, lugar: string) => string;
    compartir: (pregunta: string) => string;
    errores: Record<string, string>;
  }
> = {
  es: {
    nombre: 'Me pregunto…',
    capa: 'Me pregunto',
    bajada: 'Preguntas que dejan personas de todo el mundo. Responde la que te llame o deja una nueva.',
    dejar: 'Dejar mi pregunta',
    vacio: 'Sé la primera persona en dejar una pregunta.',
    loPregunta: (alias, lugar) => `Lo pregunta ${alias}${lugar ? ` desde ${lugar}` : ''}`,
    campo: '¿Qué te preguntas?',
    ayuda: 'Hasta 140 caracteres. Una pregunta que te gustaría que el mundo te respondiera.',
    alias: 'Nombre o alias',
    pais: 'País',
    ciudad: 'Ciudad o localidad',
    correo: 'Correo electrónico (opcional)',
    correoAyuda: 'Si nos dejas tu correo, te avisaremos cuando alguien la responda. Tu correo no será público.',
    enviar: 'Enviar mi pregunta',
    enviando: 'Enviando…',
    cancelar: 'Cancelar',
    gracias: (alias) => `Tu pregunta llegó, ${alias}`,
    graciasTexto:
      'Una persona del equipo la leerá antes de publicarla. Cuando aparezca en Me pregunto…, cualquiera podrá responderla.',
    respondesA: 'Respondes a:',
    consentAdulto: 'Soy mayor de 18 años, o adulto responsable o representante de una institución.',
    consentPublicar: 'Autorizo que mi pregunta y mi nombre o alias se publiquen en AlmaMundi.',
    graciasRespuesta:
      'Una persona del equipo la leerá antes de publicarla. Cuando se publique, le avisaremos a quien hizo la pregunta. Mientras tanto, ¿te animas con otra?',
    respuestaDe: (alias, lugar) => `Respuesta a una pregunta de ${alias}${lugar ? ` · ${lugar}` : ''}`,
    compartir: (pregunta) => `Respondí una pregunta que alguien dejó en AlmaMundi: ${pregunta} ¿Qué responderías tú?`,
    errores: {
      question_required: 'Escribe tu pregunta (al menos 8 caracteres).',
      question_too_long: 'La pregunta puede tener hasta 140 caracteres.',
      alias_required: 'Escribe tu nombre o alias.',
      country_required: 'Escribe tu país.',
      city_required: 'Escribe tu ciudad o localidad.',
      email_required: 'Revisa tu correo electrónico.',
      consent_required: 'Marca las tres casillas para enviar.',
      captcha_required: 'No pudimos verificar el envío. Inténtalo de nuevo.',
      rate_limited: 'Enviaste varias preguntas seguidas. Inténtalo más tarde.',
      send_failed: 'No pudimos enviar tu pregunta. Inténtalo de nuevo.',
    },
  },
  pt: {
    nombre: 'Me pergunto…',
    capa: 'Me pergunto',
    bajada: 'Perguntas deixadas por pessoas do mundo todo. Responda a que chamar sua atenção ou deixe uma nova.',
    dejar: 'Deixar minha pergunta',
    vacio: 'Seja a primeira pessoa a deixar uma pergunta.',
    loPregunta: (alias, lugar) => `Pergunta de ${alias}${lugar ? `, de ${lugar}` : ''}`,
    campo: 'O que você se pergunta?',
    ayuda: 'Até 140 caracteres. Uma pergunta que você gostaria que o mundo respondesse.',
    alias: 'Nome ou apelido',
    pais: 'País',
    ciudad: 'Cidade ou localidade',
    correo: 'E-mail (opcional)',
    correoAyuda: 'Se você deixar seu e-mail, avisaremos quando alguém responder. Seu e-mail não será público.',
    enviar: 'Enviar minha pergunta',
    enviando: 'Enviando…',
    cancelar: 'Cancelar',
    gracias: (alias) => `Sua pergunta chegou, ${alias}`,
    graciasTexto:
      'Uma pessoa da equipe vai lê-la antes de publicá-la. Quando aparecer em Me pergunto…, qualquer pessoa poderá respondê-la.',
    respondesA: 'Você responde a:',
    consentAdulto: 'Tenho 18 anos ou mais, ou sou adulto responsável ou representante de uma instituição.',
    consentPublicar: 'Autorizo que minha pergunta e meu nome ou apelido sejam publicados no AlmaMundi.',
    graciasRespuesta:
      'Uma pessoa da equipe vai lê-la antes de publicá-la. Quando for publicada, avisaremos quem fez a pergunta. Enquanto isso, que tal outra?',
    respuestaDe: (alias, lugar) => `Resposta a uma pergunta de ${alias}${lugar ? ` · ${lugar}` : ''}`,
    compartir: (pergunta) => `Respondi uma pergunta que alguém deixou no AlmaMundi: ${pergunta} O que você responderia?`,
    errores: {
      question_required: 'Escreva sua pergunta (pelo menos 8 caracteres).',
      question_too_long: 'A pergunta pode ter até 140 caracteres.',
      alias_required: 'Escreva seu nome ou apelido.',
      country_required: 'Escreva seu país.',
      city_required: 'Escreva sua cidade ou localidade.',
      email_required: 'Confira seu e-mail.',
      consent_required: 'Marque as três caixas para enviar.',
      captcha_required: 'Não conseguimos verificar o envio. Tente de novo.',
      rate_limited: 'Você enviou várias perguntas seguidas. Tente mais tarde.',
      send_failed: 'Não conseguimos enviar sua pergunta. Tente de novo.',
    },
  },
  en: {
    nombre: 'I wonder…',
    capa: 'I wonder',
    bajada: 'Questions left by people from all over the world. Answer the one that calls you or leave a new one.',
    dejar: 'Leave my question',
    vacio: 'Be the first person to leave a question.',
    loPregunta: (alias, lugar) => `Asked by ${alias}${lugar ? ` from ${lugar}` : ''}`,
    campo: 'What do you wonder?',
    ayuda: 'Up to 140 characters. A question you would like the world to answer.',
    alias: 'Name or nickname',
    pais: 'Country',
    ciudad: 'City or town',
    correo: 'Email (optional)',
    correoAyuda: "If you leave your email, we'll let you know when someone answers. Your email won't be public.",
    enviar: 'Send my question',
    enviando: 'Sending…',
    cancelar: 'Cancel',
    gracias: (alias) => `Your question arrived, ${alias}`,
    graciasTexto:
      "Someone on our team will read it before it's published. Once it appears in I wonder…, anyone can answer it.",
    respondesA: "You're answering:",
    consentAdulto: 'I am 18 or older, or a responsible adult or institutional representative.',
    consentPublicar: 'I authorize my question and my name or alias to be published on AlmaMundi.',
    graciasRespuesta:
      "Someone on our team will read it before it's published. Once it is, we'll let the person who asked know. Meanwhile, up for another one?",
    respuestaDe: (alias, lugar) => `Answer to a question from ${alias}${lugar ? ` · ${lugar}` : ''}`,
    compartir: (question) => `I answered a question someone left on AlmaMundi: ${question} What would you answer?`,
    errores: {
      question_required: 'Write your question (at least 8 characters).',
      question_too_long: 'The question can be up to 140 characters.',
      alias_required: 'Write your name or nickname.',
      country_required: 'Write your country.',
      city_required: 'Write your city or town.',
      email_required: 'Check your email address.',
      consent_required: 'Tick the three boxes to send.',
      captcha_required: "We couldn't verify your submission. Please try again.",
      rate_limited: 'You sent several questions in a row. Try again later.',
      send_failed: "We couldn't send your question. Please try again.",
    },
  },
};

/** Panel «Me pregunto» del mapa. */
export const ME_PREGUNTO_MAPA: Record<
  AlmaLocale,
  {
    titulo: string;
    intro: string;
    vacio: string;
    ir: string;
    sinResultados: string;
    buscar: string;
    cuantas: (n: number) => string;
    primera: string;
    mas: string;
    voz: string;
    foto: string;
  }
> = {
  es: {
    titulo: 'Respuestas de Me pregunto',
    intro: 'Preguntas que dejó la gente y lo que respondieron personas de todo el mundo.',
    vacio: 'Aquí aparecerán las preguntas de la gente y sus respuestas. ¿Te animas a dejar la primera?',
    ir: 'Ir a Me pregunto…',
    buscar: 'Busca por palabra: abuela, mar, miedo…',
    sinResultados: 'Prueba con otra palabra.',
    cuantas: (n) => (n === 1 ? '1 respuesta' : `${n} respuestas`),
    primera: 'Sé la primera persona en responder',
    mas: 'Ver más preguntas',
    voz: 'Respuesta en voz',
    foto: 'Respuesta con foto',
  },
  pt: {
    titulo: 'Respostas de Me pergunto',
    intro: 'Perguntas deixadas pelas pessoas e o que responderam pessoas do mundo todo.',
    vacio: 'Aqui vão aparecer as perguntas das pessoas e suas respostas. Que tal deixar a primeira?',
    ir: 'Ir para Me pergunto…',
    buscar: 'Busque por palavra: avó, mar, medo…',
    sinResultados: 'Tente outra palavra.',
    cuantas: (n) => (n === 1 ? '1 resposta' : `${n} respostas`),
    primera: 'Seja a primeira pessoa a responder',
    mas: 'Ver mais perguntas',
    voz: 'Resposta em voz',
    foto: 'Resposta com foto',
  },
  en: {
    titulo: 'Answers from I wonder',
    intro: 'Questions people left and what people from all over the world answered.',
    vacio: 'Questions from people and their answers will appear here. Want to leave the first one?',
    ir: 'Go to I wonder…',
    buscar: 'Search by word: grandma, sea, fear…',
    sinResultados: 'Try another word.',
    cuantas: (n) => (n === 1 ? '1 answer' : `${n} answers`),
    primera: 'Be the first person to answer',
    mas: 'See more questions',
    voz: 'Voice answer',
    foto: 'Photo answer',
  },
};
