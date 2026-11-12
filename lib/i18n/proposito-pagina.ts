import type { AlmaLocale } from '@/lib/i18n/locale';

/**
 * Página institucional /proposito (es), /pt/proposito y /en/proposito.
 * Es independiente del modal «Propósito» de la home (lib/i18n/proposito.ts), que no cambia.
 * En los párrafos, **texto** se muestra destacado.
 */

export type PropositoSeccion = {
  id: string;
  titulo: string;
  parrafos: string[];
  /** Solo en «Elige cómo contarlo»: los cuatro formatos, en lista. */
  formatos?: { nombre: string; texto: string }[];
  /** Párrafos que van después de la lista de formatos. */
  parrafosFinales?: string[];
};

export type PropositoPaginaCopy = {
  metaTitulo: string;
  metaDescripcion: string;
  marca: string;
  titulo: string;
  bajadaLema: string;
  bajada: string[];
  secciones: PropositoSeccion[];
  enlacesTitulo: string;
  enlaces: { precisar: string; terminos: string; privacidad: string; contacto: string };
  cierreTitulo: string;
  cierreTexto: string;
  cierreLema: string;
  botones: { contar: string; inspirate: string; descubre: string };
  idiomasAria: string;
  volver: string;
};

export const PROPOSITO_PAGINA: Record<AlmaLocale, PropositoPaginaCopy> = {
  es: {
    metaTitulo: 'Cómo funciona AlmaMundi: cuenta tu historia y conoce otras',
    metaDescripcion:
      'AlmaMundi es una iniciativa sin fines de lucro de Fundación Democracia Abierta, desarrollada por Precisar, para compartir historias personales en texto, audio, video o fotografía y conocer las de otras personas.',
    marca: 'AlmaMundi',
    titulo: 'Cómo funciona AlmaMundi',
    bajadaLema: 'Cuenta tu historia. Conoce otras historias.',
    bajada: [
      'AlmaMundi es un espacio para compartir lo que vivimos, recordar lo que nos marcó y descubrir las experiencias de otras personas.',
      'Todas las historias son extraordinarias.',
    ],
    secciones: [
      {
        id: 'scroll',
        titulo: 'Tu historia no se pierde en el scroll',
        parrafos: [
          'Cada día compartimos imágenes, pensamientos y momentos en internet. Muchos quedan atrás rápidamente, desplazados por nuevas publicaciones.',
          'AlmaMundi propone algo diferente: un espacio donde las historias de las personas se reúnen y organizan para que otras puedan encontrarlas, conocerlas y volver a ellas.',
          'Aquí las historias valen por lo que cuentan, sin rankings de popularidad ni competencias por sumar reacciones.',
          'Nos interesa lo que las personas tienen para contar.',
          '**Tu historia no se pierde en el scroll.**',
        ],
      },
      {
        id: 'todas',
        titulo: 'Todas las personas tenemos algo que contar',
        parrafos: [
          'Una conversación que todavía recuerdas. Algo que ocurrió en tu primer trabajo. Un viaje inesperado. Una amistad. Un momento de alegría, de aprendizaje o de cambio.',
          'AlmaMundi recibe historias, recuerdos, anécdotas y experiencias personales. Pueden ser momentos importantes o escenas aparentemente pequeñas de la vida cotidiana.',
          'Cada persona decide qué quiere compartir y cómo hacerlo.',
        ],
      },
      {
        id: 'formatos',
        titulo: 'Elige cómo contarlo',
        parrafos: ['Puedes compartir tu experiencia mediante cuatro formatos:'],
        formatos: [
          { nombre: 'Texto.', texto: 'Escribe una historia con tus propias palabras.' },
          { nombre: 'Audio.', texto: 'Dale voz a lo que recuerdas.' },
          { nombre: 'Video.', texto: 'Cuenta tu experiencia frente a una cámara.' },
          { nombre: 'Fotografía.', texto: 'Comparte una imagen y la historia que hay detrás.' },
        ],
        parrafosFinales: [
          'Para compartir una historia basta con tener algo que contar. Puedes hacerlo con tus propias palabras y a tu manera.',
          'Lo importante es aquello que quieres contar.',
          'Antes de publicarse, cada envío lo revisa una persona del equipo, conforme a las normas editoriales del proyecto.',
        ],
      },
      {
        id: 'pregunta',
        titulo: 'Una historia también puede comenzar con una pregunta',
        parrafos: [
          'A veces sabemos que tenemos algo que contar, pero no sabemos por dónde empezar.',
          'Por eso AlmaMundi tiene una sección llamada **«Inspírate»**, donde encontrarás preguntas agrupadas en distintos temas de la vida.',
          'Puedes elegir una pregunta y responderla desde tu propia experiencia.',
          'También puedes conocer las preguntas que han dejado otras personas, responderlas o proponer una pregunta propia.',
          'Una pregunta puede despertar un recuerdo, una experiencia o una historia que todavía no habías pensado compartir.',
          'En AlmaMundi, participar puede empezar con una pregunta en lugar de una página en blanco.',
        ],
      },
      {
        id: 'conoce',
        titulo: 'Conoce otras historias',
        parrafos: [
          'AlmaMundi también es un lugar para escuchar, leer, mirar y descubrir las experiencias de otras personas.',
          'Puedes explorar historias compartidas mediante textos, audios, fotografías y videos.',
          'Sus recuerdos pueden ser diferentes de los tuyos. O quizá encuentres experiencias que te resulten sorprendentemente familiares.',
          'Cada relato abre una posibilidad de conocer cómo otras personas viven, recuerdan e interpretan sus experiencias.',
          'Al compartir nuestras historias, hacemos posible que otras personas las conozcan.',
        ],
      },
      {
        id: 'memorias',
        titulo: 'Memorias que construyen AlmaMundi',
        parrafos: [
          'AlmaMundi reúne experiencias personales para construir una memoria colectiva diversa y abierta a distintas voces.',
          'Nos interesan tanto los acontecimientos significativos como los momentos cotidianos: aquello que cada persona recuerda y considera importante compartir.',
          'El valor del proyecto está en la diversidad de historias, generaciones, experiencias y maneras de mirar la vida.',
          'Cada experiencia aporta una mirada distinta. Juntas, las historias permiten conocer diferentes maneras de vivir y recordar.',
          'Queremos que muchas personas puedan compartir sus propias experiencias y conocer las de otras.',
        ],
      },
      {
        id: 'quienes',
        titulo: 'Quiénes estamos detrás',
        parrafos: [
          'AlmaMundi es una iniciativa sin fines de lucro de Fundación Democracia Abierta, desarrollada por Precisar.',
          'Fundación Democracia Abierta es una organización con domicilio en Santiago de Chile que trabaja en cultura digital y alfabetización mediática.',
          'El proyecto busca ampliar las oportunidades de expresión, participación y encuentro mediante las experiencias compartidas por las personas.',
          'Las historias, preguntas y respuestas las revisan personas del equipo antes de publicarse.',
          'Quienes participan conservan sus derechos sobre los contenidos que comparten y pueden solicitar su retiro conforme a los términos de uso de la plataforma.',
          'Para conocer las condiciones de participación y el tratamiento de los datos personales, consulta los documentos institucionales de AlmaMundi.',
        ],
      },
    ],
    enlacesTitulo: 'Documentos y contacto',
    enlaces: { precisar: 'Precisar', terminos: 'Términos de uso', privacidad: 'Aviso de privacidad', contacto: 'Contacto' },
    cierreTitulo: 'Tu historia también tiene un lugar.',
    cierreTexto:
      'Puedes contar algo que viviste, responder una pregunta que te inspire o conocer las experiencias que otras personas ya compartieron.',
    cierreLema: 'La vida no es solo la que viviste, sino cómo la recuerdas, y tú eliges cómo contarla',
    botones: { contar: 'Cuenta tu historia', inspirate: 'Inspírate', descubre: 'Descubre historias' },
    idiomasAria: 'Idioma de esta página',
    volver: '← Volver al inicio',
  },
  pt: {
    metaTitulo: 'Como funciona o AlmaMundi: conte sua história e conheça outras',
    metaDescripcion:
      'O AlmaMundi é uma iniciativa sem fins lucrativos da Fundación Democracia Abierta, desenvolvida pela Precisar, para compartilhar histórias pessoais em texto, áudio, vídeo ou fotografia e conhecer as de outras pessoas.',
    marca: 'AlmaMundi',
    titulo: 'Como funciona o AlmaMundi',
    bajadaLema: 'Conte sua história. Conheça outras histórias.',
    bajada: [
      'O AlmaMundi é um espaço para compartilhar o que vivemos, lembrar o que nos marcou e descobrir as experiências de outras pessoas.',
      'Todas as histórias são extraordinárias.',
    ],
    secciones: [
      {
        id: 'scroll',
        titulo: 'Sua história não se perde no scroll',
        parrafos: [
          'Todos os dias compartilhamos imagens, pensamentos e momentos na internet. Muitos ficam para trás rapidamente, empurrados por novas publicações.',
          'O AlmaMundi propõe algo diferente: um espaço onde as histórias das pessoas se reúnem e se organizam para que outras possam encontrá-las, conhecê-las e voltar a elas.',
          'Aqui as histórias valem pelo que contam, sem rankings de popularidade nem disputas por mais reações.',
          'O que nos interessa é o que as pessoas têm para contar.',
          '**Sua história não se perde no scroll.**',
        ],
      },
      {
        id: 'todas',
        titulo: 'Todas as pessoas têm algo para contar',
        parrafos: [
          'Uma conversa que você ainda lembra. Algo que aconteceu no seu primeiro emprego. Uma viagem inesperada. Uma amizade. Um momento de alegria, de aprendizado ou de mudança.',
          'O AlmaMundi recebe histórias, lembranças, episódios e experiências pessoais. Podem ser momentos importantes ou cenas aparentemente pequenas do dia a dia.',
          'Cada pessoa decide o que quer compartilhar e como fazê-lo.',
        ],
      },
      {
        id: 'formatos',
        titulo: 'Escolha como contar',
        parrafos: ['Você pode compartilhar sua experiência em quatro formatos:'],
        formatos: [
          { nombre: 'Texto.', texto: 'Escreva uma história com suas próprias palavras.' },
          { nombre: 'Áudio.', texto: 'Dê voz ao que você lembra.' },
          { nombre: 'Vídeo.', texto: 'Conte sua experiência diante de uma câmera.' },
          { nombre: 'Fotografia.', texto: 'Compartilhe uma imagem e a história por trás dela.' },
        ],
        parrafosFinales: [
          'Para compartilhar uma história, basta ter algo para contar. Você pode fazer isso com suas próprias palavras e do seu jeito.',
          'O importante é aquilo que você quer contar.',
          'Antes de ser publicado, cada envio é revisado por uma pessoa da equipe, de acordo com as normas editoriais do projeto.',
        ],
      },
      {
        id: 'pregunta',
        titulo: 'Uma história também pode começar com uma pergunta',
        parrafos: [
          'Às vezes sabemos que temos algo para contar, mas não sabemos por onde começar.',
          'Por isso o AlmaMundi tem uma seção chamada **«Inspire-se»**, onde você encontra perguntas agrupadas em diferentes temas da vida.',
          'Você pode escolher uma pergunta e respondê-la a partir da sua própria experiência.',
          'Também pode conhecer as perguntas que outras pessoas deixaram, respondê-las ou propor uma pergunta sua.',
          'Uma pergunta pode despertar uma lembrança, uma experiência ou uma história que você ainda não tinha pensado em compartilhar.',
          'No AlmaMundi, participar pode começar com uma pergunta em vez de uma página em branco.',
        ],
      },
      {
        id: 'conoce',
        titulo: 'Conheça outras histórias',
        parrafos: [
          'O AlmaMundi também é um lugar para ouvir, ler, olhar e descobrir as experiências de outras pessoas.',
          'Você pode explorar histórias compartilhadas em textos, áudios, fotografias e vídeos.',
          'As lembranças delas podem ser diferentes das suas. Ou talvez você encontre experiências surpreendentemente familiares.',
          'Cada relato abre a possibilidade de conhecer como outras pessoas vivem, lembram e interpretam suas experiências.',
          'Ao compartilhar nossas histórias, tornamos possível que outras pessoas as conheçam.',
        ],
      },
      {
        id: 'memorias',
        titulo: 'Memórias que constroem o AlmaMundi',
        parrafos: [
          'O AlmaMundi reúne experiências pessoais para construir uma memória coletiva diversa e aberta a diferentes vozes.',
          'Interessam-nos tanto os acontecimentos marcantes quanto os momentos do dia a dia: aquilo que cada pessoa lembra e considera importante compartilhar.',
          'O valor do projeto está na diversidade de histórias, gerações, experiências e maneiras de olhar a vida.',
          'Cada experiência traz um olhar diferente. Juntas, as histórias permitem conhecer diferentes maneiras de viver e lembrar.',
          'Queremos que muitas pessoas possam compartilhar suas próprias experiências e conhecer as de outras.',
        ],
      },
      {
        id: 'quienes',
        titulo: 'Quem está por trás',
        parrafos: [
          'O AlmaMundi é uma iniciativa sem fins lucrativos da Fundación Democracia Abierta, desenvolvida pela Precisar.',
          'A Fundación Democracia Abierta é uma organização com sede em Santiago, no Chile, que atua em cultura digital e educação midiática.',
          'O projeto busca ampliar as oportunidades de expressão, participação e encontro por meio das experiências compartilhadas pelas pessoas.',
          'As histórias, perguntas e respostas são revisadas por pessoas da equipe antes de serem publicadas.',
          'Quem participa mantém seus direitos sobre o conteúdo que compartilha e pode pedir sua retirada conforme os termos de uso da plataforma.',
          'Para conhecer as condições de participação e o tratamento dos dados pessoais, consulte os documentos institucionais do AlmaMundi.',
        ],
      },
    ],
    enlacesTitulo: 'Documentos e contato',
    enlaces: { precisar: 'Precisar', terminos: 'Termos de uso', privacidad: 'Aviso de privacidade', contacto: 'Contato' },
    cierreTitulo: 'Sua história também tem um lugar.',
    cierreTexto:
      'Você pode contar algo que viveu, responder a uma pergunta que te inspire ou conhecer as experiências que outras pessoas já compartilharam.',
    cierreLema: 'A vida não é só a que você viveu, mas como você se lembra dela, e você escolhe como contá-la',
    botones: { contar: 'Conte sua história', inspirate: 'Inspire-se', descubre: 'Descubra histórias' },
    idiomasAria: 'Idioma desta página',
    volver: '← Voltar ao início',
  },
  en: {
    metaTitulo: 'How AlmaMundi works: tell your story and discover others',
    metaDescripcion:
      'AlmaMundi is a nonprofit initiative of Fundación Democracia Abierta, developed by Precisar, where people share personal stories in text, audio, video, or photography and discover the stories of others.',
    marca: 'AlmaMundi',
    titulo: 'How AlmaMundi works',
    bajadaLema: 'Tell your story. Discover other stories.',
    bajada: [
      'AlmaMundi is a space to share what we have lived, remember what shaped us, and discover the experiences of other people.',
      'All stories are extraordinary.',
    ],
    secciones: [
      {
        id: 'scroll',
        titulo: 'Your story doesn’t get lost in the scroll',
        parrafos: [
          'Every day we share images, thoughts, and moments online. Many are quickly left behind, pushed aside by new posts.',
          'AlmaMundi offers something different: a space where people’s stories are gathered and organized so others can find them, get to know them, and come back to them.',
          'Here, stories matter for what they tell, with no popularity rankings and no race for more reactions.',
          'What interests us is what people have to tell.',
          '**Your story doesn’t get lost in the scroll.**',
        ],
      },
      {
        id: 'todas',
        titulo: 'We all have a story to tell',
        parrafos: [
          'A conversation you still remember. Something that happened at your first job. An unexpected trip. A friendship. A moment of joy, of learning, or of change.',
          'AlmaMundi welcomes stories, memories, anecdotes, and personal experiences. They can be major moments or seemingly small scenes from everyday life.',
          'Each person decides what to share and how to share it.',
        ],
      },
      {
        id: 'formatos',
        titulo: 'Choose how to tell it',
        parrafos: ['You can share your experience in four formats:'],
        formatos: [
          { nombre: 'Text.', texto: 'Write a story in your own words.' },
          { nombre: 'Audio.', texto: 'Give voice to what you remember.' },
          { nombre: 'Video.', texto: 'Tell your experience on camera.' },
          { nombre: 'Photography.', texto: 'Share an image and the story behind it.' },
        ],
        parrafosFinales: [
          'To share a story, all you need is something to tell. You can do it in your own words, in your own way.',
          'What matters is what you want to tell.',
          'Before it is published, every submission is reviewed by a person on our team, following the project’s editorial guidelines.',
        ],
      },
      {
        id: 'pregunta',
        titulo: 'A story can also begin with a question',
        parrafos: [
          'Sometimes we know we have something to tell, but we don’t know where to start.',
          'That’s why AlmaMundi has a section called **“Get inspired”**, where you’ll find questions grouped into different themes of life.',
          'You can choose a question and answer it from your own experience.',
          'You can also explore the questions other people have left, answer them, or propose a question of your own.',
          'A question can bring back a memory, an experience, or a story you hadn’t yet thought of sharing.',
          'At AlmaMundi, taking part can start with a question instead of a blank page.',
        ],
      },
      {
        id: 'conoce',
        titulo: 'Discover other stories',
        parrafos: [
          'AlmaMundi is also a place to listen, read, look, and discover the experiences of other people.',
          'You can explore stories shared through text, audio, photographs, and videos.',
          'Their memories may be different from yours. Or you may find experiences that feel surprisingly familiar.',
          'Each story opens a chance to learn how other people live, remember, and make sense of their experiences.',
          'By sharing our stories, we make it possible for others to know them.',
        ],
      },
      {
        id: 'memorias',
        titulo: 'Memories that build AlmaMundi',
        parrafos: [
          'AlmaMundi brings together personal experiences to build a collective memory that is diverse and open to many voices.',
          'We care about significant events as much as everyday moments: whatever each person remembers and finds important to share.',
          'The value of the project lies in the diversity of stories, generations, experiences, and ways of seeing life.',
          'Every experience brings a different perspective. Together, the stories reveal different ways of living and remembering.',
          'We want many people to be able to share their own experiences and discover those of others.',
        ],
      },
      {
        id: 'quienes',
        titulo: 'Who is behind it',
        parrafos: [
          'AlmaMundi is a nonprofit initiative of Fundación Democracia Abierta, developed by Precisar.',
          'Fundación Democracia Abierta is an organization based in Santiago, Chile, that works on digital culture and media literacy.',
          'The project seeks to expand opportunities for expression, participation, and connection through the experiences people share.',
          'Stories, questions, and answers are reviewed by people on our team before they are published.',
          'Participants keep their rights over the content they share and can request its removal under the platform’s terms of use.',
          'To learn about the conditions for taking part and how personal data is handled, see AlmaMundi’s institutional documents.',
        ],
      },
    ],
    enlacesTitulo: 'Documents and contact',
    enlaces: { precisar: 'Precisar', terminos: 'Terms of use', privacidad: 'Privacy notice', contacto: 'Contact' },
    cierreTitulo: 'Your story has a place here too.',
    cierreTexto:
      'You can tell something you lived, answer a question that inspires you, or discover the experiences other people have already shared.',
    cierreLema: 'Life is not only the one you lived, but how you remember it, and you choose how to tell it',
    botones: { contar: 'Tell your story', inspirate: 'Get inspired', descubre: 'Discover stories' },
    idiomasAria: 'Language of this page',
    volver: '← Back to home',
  },
};

/** Ruta de la página institucional en cada idioma. */
export const PROPOSITO_RUTAS: Record<AlmaLocale, string> = {
  es: '/proposito',
  pt: '/pt/proposito',
  en: '/en/proposito',
};

export function propositoHref(locale: AlmaLocale): string {
  return PROPOSITO_RUTAS[locale];
}

/** true si la ruta es una de las tres versiones de la página institucional. */
export function esRutaProposito(pathname: string | null | undefined): boolean {
  const p = (pathname ?? '').replace(/\/$/, '');
  return p === '/proposito' || p === '/pt/proposito' || p === '/en/proposito';
}

/** Texto del enlace del modal hacia la página. */
export const PROPOSITO_LEER_MAS: Record<AlmaLocale, string> = {
  es: 'Leer más',
  pt: 'Ler mais',
  en: 'Read more',
};
