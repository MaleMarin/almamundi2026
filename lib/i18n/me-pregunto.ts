import type { AlmaLocale } from '@/lib/i18n/locale';

/** Textos de «Preguntas de las personas» (antes «Me pregunto…», nombre eliminado el 4 nov 2026). */
export const ME_PREGUNTO_UI: Record<
  AlmaLocale,
  {
    navTePreguntan: string;
    botonTePreguntan: string;
    nombre: string;
    capa: string;
    invitaDejar: string;
    titulo: string;
    respondeAqui: string;
    bajada: string;
    dejar: string;
    vacio: string;
    loPregunta: (alias: string, lugar: string) => string;
    campo: string;
    explica: string;
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
    /** Para redes que muestran la imagen (la pregunta ya va en ella). */
    compartir: string;
    /** Para X, Instagram y TikTok, que no muestran la imagen. */
    compartirConPregunta: (pregunta: string) => string;
    ogTitulo: string;
    ogBajada: string;
    errores: Record<string, string>;
  }
> = {
  es: {
    nombre: 'Preguntas de las personas',
    navTePreguntan: 'Preguntas de las personas',
    botonTePreguntan: 'Otras personas te preguntan. Cuéntales.',
    capa: 'Preguntas de las personas',
    titulo: 'Preguntas de las personas',
    respondeAqui: 'Respóndele aquí',
    bajada: 'Cada pregunta la dejó alguien que quiere conocer tu experiencia. Elige una y cuéntale lo tuyo.',
    invitaDejar: '¿Tú también quieres saber algo de otras personas? Deja tu pregunta.',
    dejar: 'Dejar mi pregunta',
    vacio: 'Aquí aparecerán las preguntas que dejen otras personas.',
    loPregunta: (alias, lugar) => `Lo pregunta ${alias}${lugar ? ` desde ${lugar}` : ''}`,
    campo: '¿Qué te gustaría preguntarles a otras personas?',
    explica:
      'Escribe una pregunta abierta que invite a compartir experiencias. Antes de publicarla, la revisaremos para proteger la privacidad y favorecer una buena convivencia.',
    ayuda: 'Hasta 140 caracteres.',
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
      'Una persona del equipo la leerá antes de publicarla. Cuando aparezca en «Me gustaría saber de ti», otras personas podrán responderla.',
    respondesA: 'Respondes a:',
    consentAdulto: 'Soy mayor de 18 años, o adulto responsable o representante de una institución.',
    consentPublicar: 'Autorizo que mi pregunta y mi nombre o alias se publiquen en AlmaMundi.',
    graciasRespuesta:
      'Una persona del equipo la leerá antes de publicarla. Cuando la publiquemos, quien dejó la pregunta recibirá un correo de AlmaMundi para leerla.',
    respuestaDe: (alias, lugar) => `Respuesta a una pregunta de ${alias}${lugar ? ` · ${lugar}` : ''}`,
    compartir: 'Respondí esta pregunta que alguien dejó en AlmaMundi. ¿Tú qué le contarías?',
    compartirConPregunta: (pregunta) => `Respondí en AlmaMundi esta pregunta que alguien dejó: «${pregunta}» ¿Tú qué le contarías?`,
    ogTitulo: 'Una pregunta abierta en AlmaMundi',
    ogBajada: 'Cualquier persona puede responderla con su propia experiencia.',
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
    nombre: 'Perguntas das pessoas',
    navTePreguntan: 'Perguntas das pessoas',
    botonTePreguntan: 'Outras pessoas te perguntam. Conte para elas.',
    capa: 'Perguntas das pessoas',
    titulo: 'Perguntas das pessoas',
    respondeAqui: 'Responda aqui',
    bajada: 'Cada pergunta foi deixada por alguém que quer conhecer a sua experiência. Escolha uma e conte a sua.',
    invitaDejar: 'Você também quer saber algo de outras pessoas? Deixe a sua pergunta.',
    dejar: 'Deixar minha pergunta',
    vacio: 'Seja a primeira pessoa a deixar uma pergunta.',
    loPregunta: (alias, lugar) => `Pergunta de ${alias}${lugar ? `, de ${lugar}` : ''}`,
    campo: 'O que você gostaria de perguntar a outras pessoas?',
    explica:
      'Escreva uma pergunta aberta que convide a compartilhar experiências. Antes de publicá-la, vamos revisá-la para proteger a privacidade e favorecer uma boa convivência.',
    ayuda: 'Até 140 caracteres.',
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
      'Uma pessoa da equipe vai lê-la antes de publicá-la. Quando aparecer em «Eu gostaria de saber de você», outras pessoas poderão respondê-la.',
    respondesA: 'Você responde a:',
    consentAdulto: 'Tenho 18 anos ou mais, ou sou adulto responsável ou representante de uma instituição.',
    consentPublicar: 'Autorizo que minha pergunta e meu nome ou apelido sejam publicados no AlmaMundi.',
    graciasRespuesta:
      'Uma pessoa da equipe vai lê-la antes de publicá-la. Quando a publicarmos, quem deixou a pergunta vai receber um e-mail do AlmaMundi para lê-la.',
    respuestaDe: (alias, lugar) => `Resposta a uma pergunta de ${alias}${lugar ? ` · ${lugar}` : ''}`,
    compartir: 'Respondi esta pergunta que alguém deixou no AlmaMundi. O que você contaria?',
    compartirConPregunta: (pergunta) => `Respondi no AlmaMundi esta pergunta que alguém deixou: “${pergunta}” O que você contaria?`,
    ogTitulo: 'Uma pergunta aberta no AlmaMundi',
    ogBajada: 'Qualquer pessoa pode respondê-la com a própria experiência.',
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
    nombre: 'People’s questions',
    navTePreguntan: 'People’s questions',
    botonTePreguntan: 'Other people are asking you. Tell them.',
    capa: 'People’s questions',
    titulo: 'People’s questions',
    respondeAqui: 'Answer here',
    bajada: 'Each question was left by someone who wants to hear about your experience. Pick one and tell them yours.',
    invitaDejar: 'Do you also want to know something from other people? Leave your question.',
    dejar: 'Leave my question',
    vacio: 'Be the first person to leave a question.',
    loPregunta: (alias, lugar) => `Asked by ${alias}${lugar ? ` from ${lugar}` : ''}`,
    campo: 'What would you like to ask other people?',
    explica:
      "Write an open question that invites others to share their experiences. Before publishing it, we'll review it to protect privacy and keep the conversation respectful.",
    ayuda: 'Up to 140 characters.',
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
      "Someone on our team will read it before it's published. Once we publish it, the person who asked will get an email from AlmaMundi to read it.",
    respuestaDe: (alias, lugar) => `Answer to a question from ${alias}${lugar ? ` · ${lugar}` : ''}`,
    compartir: 'I answered this question someone left on AlmaMundi. What would you tell them?',
    compartirConPregunta: (question) => `I answered this question someone left on AlmaMundi: “${question}” What would you tell them?`,
    ogTitulo: 'An open question on AlmaMundi',
    ogBajada: 'Anyone can answer it with their own experience.',
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
    dockAlmaMundi: string;
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
    verPreguntasAlmaMundi: string;
    responderEsta: string;
    verTodas: string;
    verPreguntas: string;
    verOtras: string;
    todasLasPreguntas: string;
    verRespuestas: string;
    responderEnMapa: string;
    introRespuestas: string;
    verYResponder: string;
    respondele: (alias: string) => string;
  }
> = {
  es: {
    titulo: 'Preguntas de las personas',
    respondele: (alias) => `Respóndele a ${alias}`,
    verYResponder: 'Ver y responder',
    introRespuestas: 'Lee lo que las personas respondieron a las preguntas de las cintas.',
    dockAlmaMundi: 'Respuestas a las preguntas de AlmaMundi',
    intro: 'Lee las preguntas que dejaron las personas y las respuestas que recibieron.',
    vacio: 'Aquí aparecerán las preguntas de las personas y sus respuestas. ¿Te animas a dejar la primera?',
    ir: 'Ver las preguntas',
    buscar: 'Busca por palabra: abuela, mar, miedo…',
    sinResultados: 'Prueba con otra palabra.',
    cuantas: (n) => (n === 1 ? '1 respuesta' : `${n} respuestas`),
    primera: 'Responder',
    mas: 'Ver más preguntas',
    voz: 'Respuesta en voz',
    foto: 'Respuesta con foto',
    verTodas: 'Ver todas las respuestas',
    verPreguntasAlmaMundi: 'Preguntas para ti',
    responderEsta: 'Responder esta pregunta',
    verPreguntas: 'Ver todas las preguntas',
    verOtras: 'Ver otras preguntas',
    todasLasPreguntas: 'Todas las preguntas',
    verRespuestas: 'Ver respuestas',
    responderEnMapa: 'Responder en el mapa',
  },
  pt: {
    titulo: 'Perguntas das pessoas',
    respondele: (alias) => `Responda para ${alias}`,
    verYResponder: 'Ver e responder',
    introRespuestas: 'Leia o que as pessoas responderam às perguntas das fitas.',
    dockAlmaMundi: 'Respostas às perguntas do AlmaMundi',
    intro: 'Leia as perguntas que as pessoas deixaram e as respostas que receberam.',
    vacio: 'Aqui vão aparecer as perguntas das pessoas e suas respostas. Que tal deixar a primeira?',
    ir: 'Ver as perguntas',
    buscar: 'Busque por palavra: avó, mar, medo…',
    sinResultados: 'Tente outra palavra.',
    cuantas: (n) => (n === 1 ? '1 resposta' : `${n} respostas`),
    primera: 'Responder',
    mas: 'Ver mais perguntas',
    voz: 'Resposta em voz',
    foto: 'Resposta com foto',
    verTodas: 'Ver todas as respostas',
    verPreguntasAlmaMundi: 'Perguntas para você',
    responderEsta: 'Responder esta pergunta',
    verPreguntas: 'Ver todas as perguntas',
    verOtras: 'Ver outras perguntas',
    todasLasPreguntas: 'Todas as perguntas',
    verRespuestas: 'Ver respostas',
    responderEnMapa: 'Responder no mapa',
  },
  en: {
    titulo: 'People’s questions',
    respondele: (alias) => `Answer ${alias}`,
    verYResponder: 'See and answer',
    introRespuestas: 'Read what people answered to the questions in the ribbons.',
    dockAlmaMundi: 'Answers to AlmaMundi’s questions',
    intro: 'Read the questions people left and the answers they received.',
    vacio: 'Questions from people and their answers will appear here. Want to leave the first one?',
    ir: 'See the questions',
    buscar: 'Search by word: grandma, sea, fear…',
    sinResultados: 'Try another word.',
    cuantas: (n) => (n === 1 ? '1 answer' : `${n} answers`),
    primera: 'Answer',
    mas: 'See more questions',
    voz: 'Voice answer',
    foto: 'Photo answer',
    verTodas: 'See all answers',
    verPreguntasAlmaMundi: 'Questions for you',
    responderEsta: 'Answer this question',
    verPreguntas: 'See all questions',
    verOtras: 'See other questions',
    todasLasPreguntas: 'All questions',
    verRespuestas: 'See answers',
    responderEnMapa: 'Answer on the map',
  },
};
