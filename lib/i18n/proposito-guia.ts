import type { AlmaLocale } from '@/lib/i18n/locale';

/**
 * Bloques explicativos de «Cómo funciona AlmaMundi» (/proposito, /pt/proposito, /en/proposito).
 * Se suman a los textos institucionales de lib/i18n/proposito-pagina.ts dentro de la misma página.
 * En los párrafos, **texto** se muestra destacado. {n} se reemplaza por el límite real del sitio.
 */

export type PropositoGuiaCopy = {
  ceja: string;
  tituloAntes: string;
  tituloMarca: string;
  navAria: string;
  tarjeta: { titulo: string; texto: string };
  cuenta: {
    ceja: string;
    intro: string;
    formatos: { video: string; audio: string; texto: string; foto: string };
    limites: { minutos: string; caracteres: string; fotos: string };
    cintas: { ceja: string; titulo: string; parrafos: string[]; nota: string; alt: string };
    pasosAria: string;
    pasos: string[];
    pasosNota: string;
  };
  inspirate: {
    ceja: string;
    cintasAyuda: string;
    dosCeja: string;
    dosTitulo: string;
    tema: string;
    recorridos: { ceja: string; texto: string; enlace: string }[];
    notas: string[];
  };
  descubre: {
    ceja: string;
    intro: string;
    capturaAlt: string;
    capturaCeja: string;
    opciones: string[];
    sonidos: string;
    pasos: { titulo: string; texto: string }[];
    enlace: string;
  };
  historias: { ceja: string; intro: string; nota: string; enlace: string; filtros: string[]; filtrosAria: string };
  algoritmo: { ceja: string; titulo: string; tituloFuerte: string; parrafos: string[]; destacado: string };
  construir: { ceja: string; titulo: string; parrafos: string[] };
  sonder: { ceja: string; titulo: string; texto: string; nota: string; boton: string };
  quienesCeja: string;
};

export const PROPOSITO_GUIA: Record<AlmaLocale, PropositoGuiaCopy> = {
  es: {
    ceja: 'Una guía para participar',
    tituloAntes: 'Cómo funciona',
    tituloMarca: 'AlmaMundi',
    navAria: 'Secciones de esta página',
    tarjeta: {
      titulo: 'Cuenta lo que quieras compartir.',
      texto: 'Un recuerdo, una conversación, una anécdota o una experiencia importante para ti. Tú eliges.',
    },
    cuenta: {
      ceja: '01 / Participar',
      intro:
        'Tú decides qué contar y cómo hacerlo. Elige texto, audio, video o fotografía. Al enviar tu historia, podrás descargar una imagen de cintas creada a partir de tu relato.',
      formatos: { video: 'Video', audio: 'Audio', texto: 'Texto', foto: 'Fotografía' },
      limites: { minutos: 'Máx. {n} minutos', caracteres: 'Máx. {n} caracteres', fotos: 'Hasta {n} fotografías' },
      cintas: {
        ceja: 'Una imagen propia',
        titulo: 'Tu historia también tiene colores.',
        parrafos: [
          'AlmaMundi crea una composición de cintas a partir de las palabras, los colores y el tono de tu relato. Si compartes fotografías, también considera sus colores; si envías audio o video, lo que cuentas con tu voz.',
          '**La imagen es tuya:** puedes descargarla y compartirla al terminar el envío. La volverás a recibir por correo cuando se publique tu historia.',
        ],
        nota: 'Vista ilustrativa de una composición individual. Su distribución cambia según cada historia. Es distinta de la imagen de colores que identifica al sitio al compartirlo.',
        alt: 'Ejemplo de una imagen de cintas: franjas verticales de colores de distintos anchos.',
      },
      pasosAria: 'Qué ocurre al enviar tu historia',
      pasos: [
        'Elige un formato',
        'Cuenta tu experiencia',
        'Envía',
        'Descarga tu imagen de cintas',
        'Revisión editorial',
        'Correo al publicarse',
      ],
      pasosNota:
        'Cuando la historia es aprobada, la persona recibe un correo con el enlace a su publicación y nuevamente su imagen de cintas.',
    },
    inspirate: {
      ceja: '02 / Empezar por una pregunta',
      cintasAyuda: 'Elige una cinta para explorar el tema',
      dosCeja: '12 temas · Preguntas abiertas',
      dosTitulo: 'Hay dos maneras de participar.',
      tema: 'Tema',
      recorridos: [
        {
          ceja: '01 · AlmaMundi',
          texto:
            'Elige un tema, explora sus preguntas, responde y conoce las respuestas publicadas. Cada cinta guarda ocho preguntas, y puedes responder con un texto, con tu voz o con una fotografía.',
          enlace: 'Elegir una pregunta',
        },
        {
          ceja: '02 · Las personas',
          texto:
            'Explora las preguntas que proponen otras personas y conoce sus respuestas. Puedes responder, por escrito o con tu voz, o proponer una pregunta nueva.',
          enlace: 'Conocer preguntas',
        },
      ],
      notas: [
        'La pregunta permanece a la vista mientras respondes, y puedes volver atrás conservando lo que escribiste.',
        'Las respuestas pasan por revisión antes de publicarse.',
      ],
    },
    descubre: {
      ceja: '03 / Explorar el universo',
      intro:
        'En el universo de AlmaMundi, el menú permite elegir qué explorar. Los puntos conectan lugares con historias, preguntas y respuestas.',
      capturaAlt: 'El globo de AlmaMundi, con su menú y los puntos de las historias.',
      capturaCeja: 'El Alma del Mundo · El universo',
      opciones: [
        'Muestra las historias publicadas en el globo y permite abrir el listado para elegir una.',
        'Reúne las respuestas de las personas a las preguntas de los doce temas de AlmaMundi. Puedes explorar sus aportes desde el mapa.',
        'Muestra preguntas propuestas por las personas que participan y las respuestas que han recibido. Puedes abrir una pregunta y conocer su conversación.',
        'Activa la capa de lugares que tienen su propia ficha. Selecciona uno de sus puntos para descubrir lo que cuenta ese lugar.',
        'Abre el buscador para localizar historias por título, ciudad o tema.',
      ],
      sonidos: 'tiene su propio control, aparte del menú.',
      pasos: [
        { titulo: 'Elige una opción del menú', texto: 'Historias, respuestas, preguntas, lugares o búsqueda.' },
        { titulo: 'Selecciona un punto', texto: 'Abre el contenido asociado a ese lugar.' },
        { titulo: 'Arrastra el globo', texto: 'Gíralo con el mouse o con el dedo para seguir explorando.' },
      ],
      enlace: 'Ver el globo',
    },
    historias: {
      ceja: '04 / Explorar el archivo',
      intro:
        'Todos los relatos publicados, en un solo lugar. Busca por palabras, utiliza los filtros y abre una historia para leerla, escucharla o mirarla.',
      nota: 'Entra directamente al catálogo y explora las historias a tu ritmo.',
      enlace: 'Conoce las historias',
      filtros: ['Todos', 'Texto', 'Audio', 'Video', 'Fotografía'],
      filtrosAria: 'Filtros y búsqueda del catálogo',
    },
    algoritmo: {
      ceja: '05 / Por qué importan estas historias',
      titulo: 'Hay más vidas que las que te muestra',
      tituloFuerte: 'un algoritmo.',
      parrafos: [
        'Todos los días vemos historias seleccionadas y ordenadas para llamar nuestra atención. Pero hay muchas otras experiencias que probablemente nunca llegaríamos a conocer.',
        '**AlmaMundi propone descubrirlas de otra manera.**',
        'Aquí las historias no compiten por popularidad. Puedes detenerte en un recuerdo, escuchar a alguien de otro lugar o conocer una experiencia muy distinta de la tuya.',
      ],
      destacado: 'No importa cuántas personas hayan visto una historia. Importa lo que esa persona tiene para contar.',
    },
    construir: {
      ceja: 'Lo que queremos construir',
      titulo: 'Y queremos llevarlas más allá de la plataforma.',
      parrafos: [
        'A medida que crezca la colección, queremos crear **exposiciones temáticas digitales** que permitan descubrir relaciones entre historias y conocer distintas experiencias alrededor de un mismo tema.',
        'Cada exposición tendrá su propia propuesta, que definiremos cuando llegue el momento.',
        'Precisar estará a cargo de conservar la colección y sus exposiciones, incluso si AlmaMundi deja de funcionar como plataforma, respetando los derechos de quienes participan.',
      ],
    },
    sonder: {
      ceja: 'Sonder · Boletín mensual',
      titulo: 'Hay más historias por descubrir.',
      texto:
        'Suscríbete a Sonder, el boletín mensual de AlmaMundi. Una vez al mes, recibe en tu correo una selección de historias de AlmaMundi.',
      nota: 'Puedes darte de baja cuando quieras.',
      boton: 'Suscribirme a Sonder',
    },
    quienesCeja: 'El proyecto y sus derechos',
  },
  pt: {
    ceja: 'Um guia para participar',
    tituloAntes: 'Como funciona o',
    tituloMarca: 'AlmaMundi',
    navAria: 'Seções desta página',
    tarjeta: {
      titulo: 'Conte o que quiser compartilhar.',
      texto: 'Uma lembrança, uma conversa, um episódio ou uma experiência importante para você. Você escolhe.',
    },
    cuenta: {
      ceja: '01 / Participar',
      intro:
        'Você decide o que contar e como fazer isso. Escolha texto, áudio, vídeo ou fotografia. Ao enviar sua história, você poderá baixar uma imagem de fitas criada a partir do seu relato.',
      formatos: { video: 'Vídeo', audio: 'Áudio', texto: 'Texto', foto: 'Fotografia' },
      limites: { minutos: 'Máx. {n} minutos', caracteres: 'Máx. {n} caracteres', fotos: 'Até {n} fotografias' },
      cintas: {
        ceja: 'Uma imagem própria',
        titulo: 'Sua história também tem cores.',
        parrafos: [
          'O AlmaMundi cria uma composição de fitas a partir das palavras, das cores e do tom do seu relato. Se você compartilha fotografias, também considera as cores delas; se envia áudio ou vídeo, o que você conta com a sua voz.',
          '**A imagem é sua:** você pode baixá-la e compartilhá-la ao concluir o envio. Você a receberá de novo por e-mail quando sua história for publicada.',
        ],
        nota: 'Vista ilustrativa de uma composição individual. Sua distribuição muda conforme cada história. É diferente da imagem de cores que identifica o site ao compartilhá-lo.',
        alt: 'Exemplo de uma imagem de fitas: faixas verticais de cores com larguras diferentes.',
      },
      pasosAria: 'O que acontece ao enviar sua história',
      pasos: [
        'Escolha um formato',
        'Conte sua experiência',
        'Envie',
        'Baixe sua imagem de fitas',
        'Revisão editorial',
        'E-mail na publicação',
      ],
      pasosNota:
        'Quando a história é aprovada, a pessoa recebe um e-mail com o link da publicação e, novamente, sua imagem de fitas.',
    },
    inspirate: {
      ceja: '02 / Começar por uma pergunta',
      cintasAyuda: 'Escolha uma fita para explorar o tema',
      dosCeja: '12 temas · Perguntas abertas',
      dosTitulo: 'Há duas maneiras de participar.',
      tema: 'Tema',
      recorridos: [
        {
          ceja: '01 · AlmaMundi',
          texto:
            'Escolha um tema, explore suas perguntas, responda e conheça as respostas publicadas. Cada fita guarda oito perguntas, e você pode responder com um texto, com a sua voz ou com uma fotografia.',
          enlace: 'Escolher uma pergunta',
        },
        {
          ceja: '02 · As pessoas',
          texto:
            'Explore as perguntas propostas por outras pessoas e conheça suas respostas. Você pode responder, por escrito ou com a sua voz, ou propor uma nova pergunta.',
          enlace: 'Conhecer perguntas',
        },
      ],
      notas: [
        'A pergunta fica à vista enquanto você responde, e você pode voltar atrás mantendo o que escreveu.',
        'As respostas passam por revisão antes de serem publicadas.',
      ],
    },
    descubre: {
      ceja: '03 / Explorar o universo',
      intro:
        'No universo do AlmaMundi, o menu permite escolher o que explorar. Os pontos conectam lugares com histórias, perguntas e respostas.',
      capturaAlt: 'O globo do AlmaMundi, com seu menu e os pontos das histórias.',
      capturaCeja: 'A Alma do Mundo · O universo',
      opciones: [
        'Mostra as histórias publicadas no globo e permite abrir a lista para escolher uma.',
        'Reúne as respostas das pessoas às perguntas dos doze temas do AlmaMundi. Você pode explorar suas contribuições a partir do mapa.',
        'Mostra perguntas propostas pelas pessoas que participam e as respostas que receberam. Você pode abrir uma pergunta e conhecer sua conversa.',
        'Ativa a camada de lugares que têm sua própria ficha. Selecione um de seus pontos para descobrir o que esse lugar conta.',
        'Abre o buscador para localizar histórias por título, cidade ou tema.',
      ],
      sonidos: 'tem seu próprio controle, separado do menu.',
      pasos: [
        { titulo: 'Escolha uma opção do menu', texto: 'Histórias, respostas, perguntas, lugares ou busca.' },
        { titulo: 'Selecione um ponto', texto: 'Abre o conteúdo associado a esse lugar.' },
        { titulo: 'Arraste o globo', texto: 'Gire-o com o mouse ou com o dedo para continuar explorando.' },
      ],
      enlace: 'Ver o globo',
    },
    historias: {
      ceja: '04 / Explorar o acervo',
      intro:
        'Todos os relatos publicados, em um só lugar. Busque por palavras, use os filtros e abra uma história para ler, ouvir ou assistir.',
      nota: 'Entre diretamente no catálogo e explore as histórias no seu ritmo.',
      enlace: 'Conheça as histórias',
      filtros: ['Todos', 'Texto', 'Áudio', 'Vídeo', 'Fotografia'],
      filtrosAria: 'Filtros e busca do catálogo',
    },
    algoritmo: {
      ceja: '05 / Por que essas histórias importam',
      titulo: 'Há mais vidas do que as que mostra',
      tituloFuerte: 'um algoritmo.',
      parrafos: [
        'Todos os dias vemos histórias selecionadas e ordenadas para chamar nossa atenção. Mas há muitas outras experiências que provavelmente nunca chegaríamos a conhecer.',
        '**O AlmaMundi propõe descobri-las de outra maneira.**',
        'Aqui as histórias não competem por popularidade. Você pode se deter em uma lembrança, ouvir alguém de outro lugar ou conhecer uma experiência muito diferente da sua.',
      ],
      destacado: 'Não importa quantas pessoas viram uma história. Importa o que essa pessoa tem para contar.',
    },
    construir: {
      ceja: 'O que queremos construir',
      titulo: 'E queremos levá-las além da plataforma.',
      parrafos: [
        'À medida que a coleção crescer, queremos criar **exposições temáticas digitais** que permitam descobrir relações entre histórias e conhecer diferentes experiências em torno de um mesmo tema.',
        'Cada exposição terá sua própria proposta, que definiremos quando chegar o momento.',
        'A Precisar ficará encarregada de conservar a coleção e suas exposições, mesmo que o AlmaMundi deixe de funcionar como plataforma, respeitando os direitos de quem participa.',
      ],
    },
    sonder: {
      ceja: 'Sonder · Boletim mensal',
      titulo: 'Há mais histórias por descobrir.',
      texto:
        'Assine a Sonder, o boletim mensal do AlmaMundi. Uma vez por mês, receba no seu e-mail uma seleção de histórias do AlmaMundi.',
      nota: 'Você pode cancelar quando quiser.',
      boton: 'Assinar a Sonder',
    },
    quienesCeja: 'O projeto e seus direitos',
  },
  en: {
    ceja: 'A guide to taking part',
    tituloAntes: 'How',
    tituloMarca: 'AlmaMundi works',
    navAria: 'Sections of this page',
    tarjeta: {
      titulo: 'Tell whatever you want to share.',
      texto: 'A memory, a conversation, an anecdote, or an experience that matters to you. You choose.',
    },
    cuenta: {
      ceja: '01 / Take part',
      intro:
        'You decide what to tell and how to tell it. Choose text, audio, video, or photography. When you send your story, you can download a ribbon image created from it.',
      formatos: { video: 'Video', audio: 'Audio', texto: 'Text', foto: 'Photography' },
      limites: { minutos: 'Max. {n} minutes', caracteres: 'Max. {n} characters', fotos: 'Up to {n} photos' },
      cintas: {
        ceja: 'An image of your own',
        titulo: 'Your story has colors too.',
        parrafos: [
          'AlmaMundi creates a ribbon composition from the words, colors, and tone of your story. If you share photos, it also considers their colors; if you send audio or video, what you tell with your voice.',
          '**The image is yours:** you can download and share it when you finish sending. You will receive it again by email when your story is published.',
        ],
        nota: 'Illustrative view of an individual composition. Its layout changes with each story. It is different from the color image that identifies the site when it is shared.',
        alt: 'Example of a ribbon image: vertical bands of color in different widths.',
      },
      pasosAria: 'What happens when you send your story',
      pasos: [
        'Choose a format',
        'Tell your experience',
        'Send',
        'Download your ribbon image',
        'Editorial review',
        'Email when published',
      ],
      pasosNota:
        'When the story is approved, the person receives an email with the link to it and, once again, their ribbon image.',
    },
    inspirate: {
      ceja: '02 / Start with a question',
      cintasAyuda: 'Choose a ribbon to explore the theme',
      dosCeja: '12 themes · Open questions',
      dosTitulo: 'There are two ways to take part.',
      tema: 'Theme',
      recorridos: [
        {
          ceja: '01 · AlmaMundi',
          texto:
            'Choose a theme, explore its questions, answer, and read the published answers. Each ribbon holds eight questions, and you can answer with text, with your voice, or with a photo.',
          enlace: 'Choose a question',
        },
        {
          ceja: '02 · People',
          texto:
            'Explore the questions other people propose and read their answers. You can answer, in writing or with your voice, or propose a new question.',
          enlace: 'See the questions',
        },
      ],
      notas: [
        'The question stays in view while you answer, and you can go back and keep what you wrote.',
        'Answers are reviewed before they are published.',
      ],
    },
    descubre: {
      ceja: '03 / Explore the universe',
      intro:
        'In the AlmaMundi universe, the menu lets you choose what to explore. The points connect places with stories, questions, and answers.',
      capturaAlt: 'The AlmaMundi globe, with its menu and the points of the stories.',
      capturaCeja: 'The Soul of the World · The universe',
      opciones: [
        'Shows the published stories on the globe and lets you open the list to choose one.',
        'Gathers people’s answers to the questions of AlmaMundi’s twelve themes. You can explore them from the map.',
        'Shows questions proposed by participants and the answers they have received. You can open a question and follow its conversation.',
        'Turns on the layer of places that have their own entry. Select one of its points to discover what that place tells.',
        'Opens the search to find stories by title, city, or theme.',
      ],
      sonidos: 'has its own control, separate from the menu.',
      pasos: [
        { titulo: 'Choose a menu option', texto: 'Stories, answers, questions, places, or search.' },
        { titulo: 'Select a point', texto: 'It opens the content linked to that place.' },
        { titulo: 'Drag the globe', texto: 'Spin it with your mouse or finger to keep exploring.' },
      ],
      enlace: 'See the globe',
    },
    historias: {
      ceja: '04 / Explore the archive',
      intro:
        'Every published story, in one place. Search by words, use the filters, and open a story to read, listen to, or watch it.',
      nota: 'Go straight to the catalog and explore the stories at your own pace.',
      enlace: 'Discover the stories',
      filtros: ['All', 'Text', 'Audio', 'Video', 'Photography'],
      filtrosAria: 'Catalog filters and search',
    },
    algoritmo: {
      ceja: '05 / Why these stories matter',
      titulo: 'There are more lives than the ones shown to you by',
      tituloFuerte: 'an algorithm.',
      parrafos: [
        'Every day we see stories selected and ordered to grab our attention. But there are many other experiences we would probably never come across.',
        '**AlmaMundi proposes discovering them another way.**',
        'Here, stories do not compete for popularity. You can linger on a memory, listen to someone from another place, or discover an experience very different from your own.',
      ],
      destacado: 'It does not matter how many people have seen a story. What matters is what that person has to tell.',
    },
    construir: {
      ceja: 'What we want to build',
      titulo: 'And we want to take them beyond the platform.',
      parrafos: [
        'As the collection grows, we want to create **digital thematic exhibitions** that reveal connections between stories and show different experiences around a shared theme.',
        'Each exhibition will have its own proposal, which we will define when the time comes.',
        'Precisar will be in charge of preserving the collection and its exhibitions, even if AlmaMundi stops operating as a platform, respecting the rights of those who take part.',
      ],
    },
    sonder: {
      ceja: 'Sonder · Monthly newsletter',
      titulo: 'There are more stories to discover.',
      texto:
        'Subscribe to Sonder, AlmaMundi’s monthly newsletter. Once a month, receive a selection of AlmaMundi stories in your inbox.',
      nota: 'You can unsubscribe whenever you like.',
      boton: 'Subscribe to Sonder',
    },
    quienesCeja: 'The project and your rights',
  },
};
