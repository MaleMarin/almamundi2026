import type { AlmaLocale } from '@/lib/i18n/locale';

export const HILO_IDS = [
  'infancia',
  'familia',
  'amor',
  'amistad',
  'crecer',
  'aprender',
  'trabajo',
  'creencias',
  'ausentes',
  'justicia',
  'viajes',
  'historia',
] as const;

export type HiloId = (typeof HILO_IDS)[number];

export type NivelPregunta = 'empezar' | 'hondo' | 'chispa';

export type Hilo = {
  id: HiloId;
  nombre: Record<AlmaLocale, string>;
  color: string;
  imagen: string;
  aspecto: number;
};

export type PreguntaHilo = {
  id: string;
  hiloId: HiloId | null;
  nivel: NivelPregunta;
  texto: Record<AlmaLocale, string>;
};

export const HILOS: Hilo[] = [
  {
    id: 'infancia',
    nombre: {
      es: 'Infancia',
      pt: 'Infância',
      en: 'Childhood',
    },
    color: '#DBA81D',
    imagen: '/cintas/web/amarillo.webp',
    aspecto: 0.2211,
  },
  {
    id: 'familia',
    nombre: {
      es: 'Familia',
      pt: 'Família',
      en: 'Family',
    },
    color: '#CF4C12',
    imagen: '/cintas/web/naranja.webp',
    aspecto: 0.2222,
  },
  {
    id: 'amor',
    nombre: {
      es: 'Amor',
      pt: 'Amor',
      en: 'Love',
    },
    color: '#BD1A21',
    imagen: '/cintas/web/rojo.webp',
    aspecto: 0.26,
  },
  {
    id: 'amistad',
    nombre: {
      es: 'Amistad',
      pt: 'Amizade',
      en: 'Friendship',
    },
    color: '#DA6D94',
    imagen: '/cintas/web/rosado.webp',
    aspecto: 0.2956,
  },
  {
    id: 'crecer',
    nombre: {
      es: 'Crecer y criar',
      pt: 'Crescer e criar',
      en: 'Growing up and raising',
    },
    color: '#AAB127',
    imagen: '/cintas/web/limon.webp',
    aspecto: 0.2611,
  },
  {
    id: 'aprender',
    nombre: {
      es: 'Aprender',
      pt: 'Aprender',
      en: 'Learning',
    },
    color: '#278D46',
    imagen: '/cintas/web/verde.webp',
    aspecto: 0.26,
  },
  {
    id: 'trabajo',
    nombre: {
      es: 'Trabajo',
      pt: 'Trabalho',
      en: 'Work',
    },
    color: '#0F49A4',
    imagen: '/cintas/web/azul.webp',
    aspecto: 0.2578,
  },
  {
    id: 'creencias',
    nombre: {
      es: 'Creencias',
      pt: 'Crenças',
      en: 'Beliefs',
    },
    color: '#6D228A',
    imagen: '/cintas/web/morado.webp',
    aspecto: 0.2522,
  },
  {
    id: 'ausentes',
    nombre: {
      es: 'Los que ya no están',
      pt: 'Os que já não estão',
      en: 'Those who are gone',
    },
    color: '#9775AD',
    imagen: '/cintas/web/lila.webp',
    aspecto: 0.19,
  },
  {
    id: 'justicia',
    nombre: {
      es: 'Justicia',
      pt: 'Justiça',
      en: 'Justice',
    },
    color: '#BC1459',
    imagen: '/cintas/web/fucsia.webp',
    aspecto: 0.2211,
  },
  {
    id: 'viajes',
    nombre: {
      es: 'Viajes',
      pt: 'Viagens',
      en: 'Travel',
    },
    color: '#1A8684',
    imagen: '/cintas/web/calipso.webp',
    aspecto: 0.26,
  },
  {
    id: 'historia',
    nombre: {
      es: 'Historia',
      pt: 'História',
      en: 'History',
    },
    color: '#681224',
    imagen: '/cintas/web/burdeo.webp',
    aspecto: 0.24,
  },
];

const TEMAS: PreguntaHilo[] = [
  {
    id: 'infancia-1',
    hiloId: 'infancia',
    nivel: 'empezar',
    texto: {
      es: '¿Cuál es el primer recuerdo que tienes?',
      pt: 'Qual é a primeira lembrança que você tem?',
      en: 'What is your very first memory?',
    },
  },
  {
    id: 'infancia-2',
    hiloId: 'infancia',
    nivel: 'empezar',
    texto: {
      es: '¿Cómo era la casa donde creciste? Recorre una habitación.',
      pt: 'Como era a casa onde você cresceu? Percorra um cômodo.',
      en: 'What was the house you grew up in like? Walk through one room.',
    },
  },
  {
    id: 'infancia-3',
    hiloId: 'infancia',
    nivel: 'empezar',
    texto: {
      es: '¿A qué jugabas cuando nadie te estaba mirando?',
      pt: 'Do que você brincava quando ninguém estava olhando?',
      en: 'What did you play when no one was watching?',
    },
  },
  {
    id: 'infancia-4',
    hiloId: 'infancia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué olor te devuelve de golpe a tu infancia?',
      pt: 'Que cheiro te leva de volta à infância de repente?',
      en: 'What smell takes you straight back to your childhood?',
    },
  },
  {
    id: 'infancia-5',
    hiloId: 'infancia',
    nivel: 'empezar',
    texto: {
      es: '¿Quién te cuidaba y cómo lo hacía?',
      pt: 'Quem cuidava de você e como fazia isso?',
      en: 'Who took care of you, and how?',
    },
  },
  {
    id: 'infancia-6',
    hiloId: 'infancia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué travesura todavía te da risa?',
      pt: 'Que travessura ainda te faz rir?',
      en: 'What mischief still makes you laugh?',
    },
  },
  {
    id: 'infancia-7',
    hiloId: 'infancia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué querías ser de grande, y qué pasó con ese sueño?',
      pt: 'O que você queria ser quando crescesse, e o que aconteceu com esse sonho?',
      en: 'What did you want to be when you grew up, and what happened to that dream?',
    },
  },
  {
    id: 'infancia-8',
    hiloId: 'infancia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué te daba miedo cuando eras niño o niña?',
      pt: 'Do que você tinha medo quando era criança?',
      en: 'What were you afraid of as a child?',
    },
  },
  {
    id: 'familia-1',
    hiloId: 'familia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué historia de tu familia se cuenta una y otra vez en la mesa?',
      pt: 'Que história da sua família é contada sempre à mesa?',
      en: 'What family story gets told again and again at the table?',
    },
  },
  {
    id: 'familia-2',
    hiloId: 'familia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué heredaste de tu madre o de tu padre que te alegra tener?',
      pt: 'O que você herdou da sua mãe ou do seu pai que te alegra ter?',
      en: 'What did you inherit from your mother or father that you\'re glad to have?',
    },
  },
  {
    id: 'familia-3',
    hiloId: 'familia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué recuerdas de tus abuelos, o qué te contaron de ellos?',
      pt: 'O que você lembra dos seus avós, ou o que te contaram deles?',
      en: 'What do you remember about your grandparents, or what were you told about them?',
    },
  },
  {
    id: 'familia-4',
    hiloId: 'familia',
    nivel: 'empezar',
    texto: {
      es: '¿De dónde viene tu familia?',
      pt: 'De onde vem a sua família?',
      en: 'Where does your family come from?',
    },
  },
  {
    id: 'familia-5',
    hiloId: 'familia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué objeto de tu familia salvarías de un incendio?',
      pt: 'Que objeto da sua família você salvaria de um incêndio?',
      en: 'What family object would you save from a fire?',
    },
  },
  {
    id: 'familia-6',
    hiloId: 'familia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué receta pasa de mano en mano en tu familia?',
      pt: 'Que receita passa de mão em mão na sua família?',
      en: 'What recipe gets passed from hand to hand in your family?',
    },
  },
  {
    id: 'familia-7',
    hiloId: 'familia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué frase de alguien de tu familia repites sin darte cuenta?',
      pt: 'Que frase de alguém da sua família você repete sem perceber?',
      en: 'What saying from someone in your family do you repeat without noticing?',
    },
  },
  {
    id: 'familia-8',
    hiloId: 'familia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué te hubiera gustado preguntarle a alguien de tu familia?',
      pt: 'O que você gostaria de ter perguntado a alguém da sua família?',
      en: 'What do you wish you had asked someone in your family?',
    },
  },
  {
    id: 'amor-1',
    hiloId: 'amor',
    nivel: 'empezar',
    texto: {
      es: '¿Cómo supiste que estabas enamorado o enamorada?',
      pt: 'Como você soube que estava apaixonado ou apaixonada?',
      en: 'How did you know you were in love?',
    },
  },
  {
    id: 'amor-2',
    hiloId: 'amor',
    nivel: 'empezar',
    texto: {
      es: '¿Cómo conociste a la persona que más has querido?',
      pt: 'Como você conheceu a pessoa que mais amou?',
      en: 'How did you meet the person you\'ve loved most?',
    },
  },
  {
    id: 'amor-3',
    hiloId: 'amor',
    nivel: 'empezar',
    texto: {
      es: '¿Qué canción no puedes escuchar sin pensar en alguien?',
      pt: 'Que música você não consegue ouvir sem pensar em alguém?',
      en: 'What song can\'t you hear without thinking of someone?',
    },
  },
  {
    id: 'amor-4',
    hiloId: 'amor',
    nivel: 'empezar',
    texto: {
      es: '¿Cuál fue la cita más rara o más linda que tuviste?',
      pt: 'Qual foi o encontro mais estranho ou mais bonito que você teve?',
      en: 'What was the strangest or loveliest date you ever had?',
    },
  },
  {
    id: 'amor-5',
    hiloId: 'amor',
    nivel: 'empezar',
    texto: {
      es: '¿Qué aprendiste de un amor que terminó?',
      pt: 'O que você aprendeu com um amor que terminou?',
      en: 'What did you learn from a love that ended?',
    },
  },
  {
    id: 'amor-6',
    hiloId: 'amor',
    nivel: 'empezar',
    texto: {
      es: '¿Qué gesto pequeño te hace sentir querido o querida?',
      pt: 'Que gesto pequeno faz você se sentir amado ou amada?',
      en: 'What small gesture makes you feel loved?',
    },
  },
  {
    id: 'amor-7',
    hiloId: 'amor',
    nivel: 'empezar',
    texto: {
      es: '¿Cómo era el amor en la época de tus padres o de tus abuelos?',
      pt: 'Como era o amor na época dos seus pais ou dos seus avós?',
      en: 'What was love like in your parents\' or grandparents\' time?',
    },
  },
  {
    id: 'amor-8',
    hiloId: 'amor',
    nivel: 'empezar',
    texto: {
      es: '¿Qué le dirías a tu primer amor si lo encontraras hoy?',
      pt: 'O que você diria ao seu primeiro amor se o encontrasse hoje?',
      en: 'What would you say to your first love if you met them today?',
    },
  },
  {
    id: 'amistad-1',
    hiloId: 'amistad',
    nivel: 'empezar',
    texto: {
      es: '¿Quién es la persona que te conoce desde hace más tiempo?',
      pt: 'Quem é a pessoa que te conhece há mais tempo?',
      en: 'Who has known you the longest?',
    },
  },
  {
    id: 'amistad-2',
    hiloId: 'amistad',
    nivel: 'empezar',
    texto: {
      es: '¿Cómo empezó tu amistad más importante?',
      pt: 'Como começou a sua amizade mais importante?',
      en: 'How did your most important friendship begin?',
    },
  },
  {
    id: 'amistad-3',
    hiloId: 'amistad',
    nivel: 'empezar',
    texto: {
      es: '¿Qué aventura viviste con tus amigos que nadie más creería?',
      pt: 'Que aventura você viveu com seus amigos que ninguém acreditaria?',
      en: 'What adventure did you have with your friends that no one would believe?',
    },
  },
  {
    id: 'amistad-4',
    hiloId: 'amistad',
    nivel: 'empezar',
    texto: {
      es: '¿Quién apareció justo cuando más lo necesitabas?',
      pt: 'Quem apareceu justo quando você mais precisava?',
      en: 'Who showed up just when you needed them most?',
    },
  },
  {
    id: 'amistad-5',
    hiloId: 'amistad',
    nivel: 'empezar',
    texto: {
      es: '¿Qué amistad perdiste y por qué la sigues recordando?',
      pt: 'Que amizade você perdeu e por que ainda se lembra dela?',
      en: 'What friendship did you lose, and why do you still remember it?',
    },
  },
  {
    id: 'amistad-6',
    hiloId: 'amistad',
    nivel: 'empezar',
    texto: {
      es: '¿Qué aprendiste de un compañero o compañera de trabajo?',
      pt: 'O que você aprendeu com um colega de trabalho?',
      en: 'What did you learn from a coworker?',
    },
  },
  {
    id: 'amistad-7',
    hiloId: 'amistad',
    nivel: 'empezar',
    texto: {
      es: '¿Cuál es la broma que solo entienden ustedes?',
      pt: 'Qual é a piada que só vocês entendem?',
      en: 'What\'s the joke only the two of you understand?',
    },
  },
  {
    id: 'amistad-8',
    hiloId: 'amistad',
    nivel: 'empezar',
    texto: {
      es: '¿Qué harías si pudieras pasar un día con un amigo de la infancia?',
      pt: 'O que você faria se pudesse passar um dia com um amigo de infância?',
      en: 'What would you do if you could spend a day with a childhood friend?',
    },
  },
  {
    id: 'crecer-1',
    hiloId: 'crecer',
    nivel: 'empezar',
    texto: {
      es: '¿Cuándo sentiste que dejabas de ser niño o niña?',
      pt: 'Quando você sentiu que estava deixando de ser criança?',
      en: 'When did you feel you were no longer a child?',
    },
  },
  {
    id: 'crecer-2',
    hiloId: 'crecer',
    nivel: 'empezar',
    texto: {
      es: '¿Qué te pasó en la adolescencia que todavía recuerdas con detalle?',
      pt: 'O que aconteceu na sua adolescência que você ainda lembra em detalhes?',
      en: 'What happened in your teenage years that you still remember in detail?',
    },
  },
  {
    id: 'crecer-3',
    hiloId: 'crecer',
    nivel: 'empezar',
    texto: {
      es: '¿Quién te ayudó a descubrir quién eras?',
      pt: 'Quem te ajudou a descobrir quem você era?',
      en: 'Who helped you discover who you were?',
    },
  },
  {
    id: 'crecer-4',
    hiloId: 'crecer',
    nivel: 'empezar',
    texto: {
      es: '¿En qué momento te sentiste adulto o adulta por primera vez?',
      pt: 'Em que momento você se sentiu adulto ou adulta pela primeira vez?',
      en: 'When did you first feel like an adult?',
    },
  },
  {
    id: 'crecer-5',
    hiloId: 'crecer',
    nivel: 'empezar',
    texto: {
      es: '¿Cómo cambió tu vida cuando te tocó criar o cuidar a alguien?',
      pt: 'Como a sua vida mudou quando você teve que criar ou cuidar de alguém?',
      en: 'How did your life change when you had to raise or care for someone?',
    },
  },
  {
    id: 'crecer-6',
    hiloId: 'crecer',
    nivel: 'empezar',
    texto: {
      es: '¿Qué hiciste distinto de como te criaron a ti?',
      pt: 'O que você fez diferente de como foi criado ou criada?',
      en: 'What did you do differently from how you were raised?',
    },
  },
  {
    id: 'crecer-7',
    hiloId: 'crecer',
    nivel: 'empezar',
    texto: {
      es: '¿Qué te enseñó alguien a quien viste crecer?',
      pt: 'O que te ensinou alguém que você viu crescer?',
      en: 'What did someone you watched grow up teach you?',
    },
  },
  {
    id: 'crecer-8',
    hiloId: 'crecer',
    nivel: 'empezar',
    texto: {
      es: '¿Qué esperas que recuerden de ti quienes criaste o acompañaste?',
      pt: 'O que você espera que lembrem de você as pessoas que você criou ou acompanhou?',
      en: 'What do you hope the people you raised or cared for will remember about you?',
    },
  },
  {
    id: 'aprender-1',
    hiloId: 'aprender',
    nivel: 'empezar',
    texto: {
      es: '¿Qué profesor o profesora te cambió la vida?',
      pt: 'Que professor ou professora mudou a sua vida?',
      en: 'Which teacher changed your life?',
    },
  },
  {
    id: 'aprender-2',
    hiloId: 'aprender',
    nivel: 'empezar',
    texto: {
      es: '¿Cómo era tu escuela y cómo llegabas a ella?',
      pt: 'Como era a sua escola e como você chegava até ela?',
      en: 'What was your school like, and how did you get there?',
    },
  },
  {
    id: 'aprender-3',
    hiloId: 'aprender',
    nivel: 'empezar',
    texto: {
      es: '¿Qué aprendiste fuera de la sala de clases que nadie te enseñó adentro?',
      pt: 'O que você aprendeu fora da sala de aula que ninguém te ensinou lá dentro?',
      en: 'What did you learn outside the classroom that no one taught you inside?',
    },
  },
  {
    id: 'aprender-4',
    hiloId: 'aprender',
    nivel: 'empezar',
    texto: {
      es: '¿Qué momento de la escuela todavía te da vergüenza o risa?',
      pt: 'Que momento da escola ainda te dá vergonha ou riso?',
      en: 'What school moment still makes you blush or laugh?',
    },
  },
  {
    id: 'aprender-5',
    hiloId: 'aprender',
    nivel: 'empezar',
    texto: {
      es: '¿Qué libro, película o canción te abrió los ojos?',
      pt: 'Que livro, filme ou música abriu os seus olhos?',
      en: 'What book, film or song opened your eyes?',
    },
  },
  {
    id: 'aprender-6',
    hiloId: 'aprender',
    nivel: 'empezar',
    texto: {
      es: '¿Qué aprendiste de grande que te hizo sentir capaz?',
      pt: 'O que você aprendeu já adulto que te fez sentir capaz?',
      en: 'What did you learn as an adult that made you feel capable?',
    },
  },
  {
    id: 'aprender-7',
    hiloId: 'aprender',
    nivel: 'empezar',
    texto: {
      es: '¿Quién te enseñó a hacer algo con las manos?',
      pt: 'Quem te ensinou a fazer algo com as mãos?',
      en: 'Who taught you to make something with your hands?',
    },
  },
  {
    id: 'aprender-8',
    hiloId: 'aprender',
    nivel: 'empezar',
    texto: {
      es: '¿Qué te gustaría aprender todavía?',
      pt: 'O que você ainda gostaria de aprender?',
      en: 'What would you still like to learn?',
    },
  },
  {
    id: 'trabajo-1',
    hiloId: 'trabajo',
    nivel: 'empezar',
    texto: {
      es: '¿Cuál fue tu primer trabajo y qué hiciste con tu primer sueldo?',
      pt: 'Qual foi o seu primeiro trabalho e o que você fez com o primeiro salário?',
      en: 'What was your first job, and what did you do with your first paycheck?',
    },
  },
  {
    id: 'trabajo-2',
    hiloId: 'trabajo',
    nivel: 'empezar',
    texto: {
      es: '¿Qué oficio aprendiste mirando a alguien?',
      pt: 'Que ofício você aprendeu observando alguém?',
      en: 'What craft did you learn by watching someone?',
    },
  },
  {
    id: 'trabajo-3',
    hiloId: 'trabajo',
    nivel: 'empezar',
    texto: {
      es: '¿Qué día de trabajo nunca vas a olvidar?',
      pt: 'Que dia de trabalho você nunca vai esquecer?',
      en: 'What workday will you never forget?',
    },
  },
  {
    id: 'trabajo-4',
    hiloId: 'trabajo',
    nivel: 'empezar',
    texto: {
      es: '¿Quién fue tu mejor jefe o jefa, y por qué?',
      pt: 'Quem foi a melhor chefia que você teve, e por quê?',
      en: 'Who was your best boss, and why?',
    },
  },
  {
    id: 'trabajo-5',
    hiloId: 'trabajo',
    nivel: 'empezar',
    texto: {
      es: '¿De qué trabajo te sientes más satisfecho o satisfecha?',
      pt: 'De qual trabalho você se sente mais satisfeito ou satisfeita?',
      en: 'What work are you most satisfied with?',
    },
  },
  {
    id: 'trabajo-6',
    hiloId: 'trabajo',
    nivel: 'empezar',
    texto: {
      es: '¿Cómo era tu lugar de trabajo: sus ruidos, su gente, sus olores?',
      pt: 'Como era o seu lugar de trabalho: seus ruídos, suas pessoas, seus cheiros?',
      en: 'What was your workplace like: its sounds, its people, its smells?',
    },
  },
  {
    id: 'trabajo-7',
    hiloId: 'trabajo',
    nivel: 'empezar',
    texto: {
      es: '¿Qué hiciste cuando un trabajo se terminó?',
      pt: 'O que você fez quando um trabalho terminou?',
      en: 'What did you do when a job came to an end?',
    },
  },
  {
    id: 'trabajo-8',
    hiloId: 'trabajo',
    nivel: 'empezar',
    texto: {
      es: '¿Qué te gustaría que la gente supiera de tu oficio?',
      pt: 'O que você gostaria que as pessoas soubessem do seu ofício?',
      en: 'What would you like people to know about your work?',
    },
  },
  {
    id: 'creencias-1',
    hiloId: 'creencias',
    nivel: 'empezar',
    texto: {
      es: '¿Qué tradición de tu familia sigues haciendo?',
      pt: 'Que tradição da sua família você continua fazendo?',
      en: 'What family tradition do you still keep?',
    },
  },
  {
    id: 'creencias-2',
    hiloId: 'creencias',
    nivel: 'empezar',
    texto: {
      es: '¿En qué creías cuando eras niño o niña que hoy ves distinto?',
      pt: 'Em que você acreditava quando criança que hoje vê de outro jeito?',
      en: 'What did you believe as a child that you see differently today?',
    },
  },
  {
    id: 'creencias-3',
    hiloId: 'creencias',
    nivel: 'empezar',
    texto: {
      es: '¿Qué lugar te da paz?',
      pt: 'Que lugar te dá paz?',
      en: 'What place gives you peace?',
    },
  },
  {
    id: 'creencias-4',
    hiloId: 'creencias',
    nivel: 'empezar',
    texto: {
      es: '¿Hubo un momento que cambió tu forma de creer o de no creer?',
      pt: 'Houve um momento que mudou a sua forma de acreditar ou de não acreditar?',
      en: 'Was there a moment that changed the way you believe, or don\'t?',
    },
  },
  {
    id: 'creencias-5',
    hiloId: 'creencias',
    nivel: 'empezar',
    texto: {
      es: '¿Qué fiesta religiosa o popular recuerdas con más cariño?',
      pt: 'Que festa religiosa ou popular você lembra com mais carinho?',
      en: 'What religious or popular celebration do you remember most fondly?',
    },
  },
  {
    id: 'creencias-6',
    hiloId: 'creencias',
    nivel: 'empezar',
    texto: {
      es: '¿Qué te ayuda a seguir adelante en los días difíciles?',
      pt: 'O que te ajuda a seguir em frente nos dias difíceis?',
      en: 'What helps you keep going on hard days?',
    },
  },
  {
    id: 'creencias-7',
    hiloId: 'creencias',
    nivel: 'empezar',
    texto: {
      es: '¿Qué valor aprendiste en casa que guía tus decisiones?',
      pt: 'Que valor você aprendeu em casa que guia as suas decisões?',
      en: 'What value did you learn at home that guides your decisions?',
    },
  },
  {
    id: 'creencias-8',
    hiloId: 'creencias',
    nivel: 'empezar',
    texto: {
      es: '¿Qué pregunta grande sobre la vida te sigue acompañando?',
      pt: 'Que grande pergunta sobre a vida continua te acompanhando?',
      en: 'What big question about life still stays with you?',
    },
  },
  {
    id: 'ausentes-1',
    hiloId: 'ausentes',
    nivel: 'empezar',
    texto: {
      es: '¿A quién extrañas y qué te gustaría contar de esa persona?',
      pt: 'De quem você sente falta e o que gostaria de contar sobre essa pessoa?',
      en: 'Who do you miss, and what would you like to tell about them?',
    },
  },
  {
    id: 'ausentes-2',
    hiloId: 'ausentes',
    nivel: 'empezar',
    texto: {
      es: '¿Qué te enseñó alguien que ya no está?',
      pt: 'O que te ensinou alguém que já não está?',
      en: 'What did someone who is gone teach you?',
    },
  },
  {
    id: 'ausentes-3',
    hiloId: 'ausentes',
    nivel: 'empezar',
    texto: {
      es: '¿Qué objeto guardas que fue de esa persona?',
      pt: 'Que objeto você guarda que foi dessa pessoa?',
      en: 'What object do you keep that once belonged to them?',
    },
  },
  {
    id: 'ausentes-4',
    hiloId: 'ausentes',
    nivel: 'empezar',
    texto: {
      es: '¿Cómo era su risa, su voz, su manera de llegar a un lugar?',
      pt: 'Como era a risada, a voz, o jeito de chegar a um lugar?',
      en: 'What were their laugh, their voice, their way of entering a room like?',
    },
  },
  {
    id: 'ausentes-5',
    hiloId: 'ausentes',
    nivel: 'empezar',
    texto: {
      es: '¿Qué historia de esa persona no quieres que se pierda?',
      pt: 'Que história dessa pessoa você não quer que se perca?',
      en: 'What story about them do you not want to be lost?',
    },
  },
  {
    id: 'ausentes-6',
    hiloId: 'ausentes',
    nivel: 'empezar',
    texto: {
      es: '¿Qué haces para recordarla?',
      pt: 'O que você faz para lembrar dela?',
      en: 'What do you do to remember them?',
    },
  },
  {
    id: 'ausentes-7',
    hiloId: 'ausentes',
    nivel: 'empezar',
    texto: {
      es: '¿Qué le dirías si pudieras hablarle una vez más?',
      pt: 'O que você diria se pudesse falar com ela mais uma vez?',
      en: 'What would you say if you could talk to them one more time?',
    },
  },
  {
    id: 'ausentes-8',
    hiloId: 'ausentes',
    nivel: 'empezar',
    texto: {
      es: '¿Qué de esa persona ves hoy en ti?',
      pt: 'O que dessa pessoa você vê hoje em você?',
      en: 'What of them do you see in yourself today?',
    },
  },
  {
    id: 'justicia-1',
    hiloId: 'justicia',
    nivel: 'empezar',
    texto: {
      es: '¿Cuándo sentiste por primera vez que algo era injusto?',
      pt: 'Quando você sentiu pela primeira vez que algo era injusto?',
      en: 'When did you first feel that something was unfair?',
    },
  },
  {
    id: 'justicia-2',
    hiloId: 'justicia',
    nivel: 'empezar',
    texto: {
      es: '¿Alguna vez defendiste a alguien? ¿Qué pasó?',
      pt: 'Você já defendeu alguém? O que aconteceu?',
      en: 'Have you ever stood up for someone? What happened?',
    },
  },
  {
    id: 'justicia-3',
    hiloId: 'justicia',
    nivel: 'empezar',
    texto: {
      es: '¿Quién te enseñó a no quedarte callado o callada?',
      pt: 'Quem te ensinou a não ficar calado ou calada?',
      en: 'Who taught you not to stay silent?',
    },
  },
  {
    id: 'justicia-4',
    hiloId: 'justicia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué causa te ha movido a actuar?',
      pt: 'Que causa já te levou a agir?',
      en: 'What cause has moved you to act?',
    },
  },
  {
    id: 'justicia-5',
    hiloId: 'justicia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué cambio en tu barrio o en tu país viste nacer de la gente?',
      pt: 'Que mudança no seu bairro ou no seu país você viu nascer das pessoas?',
      en: 'What change in your neighborhood or country did you see grow from the people?',
    },
  },
  {
    id: 'justicia-6',
    hiloId: 'justicia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué injusticia te gustaría que nadie volviera a vivir?',
      pt: 'Que injustiça você gostaria que ninguém voltasse a viver?',
      en: 'What injustice would you like no one to live through again?',
    },
  },
  {
    id: 'justicia-7',
    hiloId: 'justicia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué gesto de solidaridad diste o recibiste y no olvidas?',
      pt: 'Que gesto de solidariedade você deu ou recebeu e não esquece?',
      en: 'What act of solidarity did you give or receive that you\'ll never forget?',
    },
  },
  {
    id: 'justicia-8',
    hiloId: 'justicia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué significa para ti vivir en un lugar justo?',
      pt: 'O que significa para você viver em um lugar justo?',
      en: 'What does living in a fair place mean to you?',
    },
  },
  {
    id: 'viajes-1',
    hiloId: 'viajes',
    nivel: 'empezar',
    texto: {
      es: '¿Cuál es el primer viaje que recuerdas?',
      pt: 'Qual é a primeira viagem de que você se lembra?',
      en: 'What is the first trip you remember?',
    },
  },
  {
    id: 'viajes-2',
    hiloId: 'viajes',
    nivel: 'empezar',
    texto: {
      es: '¿Qué lugar te sorprendió tanto que cambió tu forma de ver algo?',
      pt: 'Que lugar te surpreendeu tanto que mudou a sua forma de ver algo?',
      en: 'What place surprised you so much it changed how you saw something?',
    },
  },
  {
    id: 'viajes-3',
    hiloId: 'viajes',
    nivel: 'empezar',
    texto: {
      es: '¿Te fuiste a vivir lejos alguna vez? ¿Qué llevaste en la maleta?',
      pt: 'Você já foi morar longe? O que levou na mala?',
      en: 'Did you ever move far away? What did you pack?',
    },
  },
  {
    id: 'viajes-4',
    hiloId: 'viajes',
    nivel: 'empezar',
    texto: {
      es: '¿Qué viaje salió mal y hoy es tu mejor anécdota?',
      pt: 'Que viagem deu errado e hoje é a sua melhor história?',
      en: 'What trip went wrong and is now your best story?',
    },
  },
  {
    id: 'viajes-5',
    hiloId: 'viajes',
    nivel: 'empezar',
    texto: {
      es: '¿Qué desconocido te ayudó en un viaje?',
      pt: 'Que desconhecido te ajudou em uma viagem?',
      en: 'What stranger helped you on a trip?',
    },
  },
  {
    id: 'viajes-6',
    hiloId: 'viajes',
    nivel: 'empezar',
    texto: {
      es: '¿Qué comida probaste lejos y todavía extrañas?',
      pt: 'Que comida você provou longe e ainda sente falta?',
      en: 'What food did you try far away that you still miss?',
    },
  },
  {
    id: 'viajes-7',
    hiloId: 'viajes',
    nivel: 'empezar',
    texto: {
      es: '¿A qué lugar vuelves siempre, aunque sea en la memoria?',
      pt: 'A que lugar você sempre volta, nem que seja na memória?',
      en: 'What place do you always return to, even if only in memory?',
    },
  },
  {
    id: 'viajes-8',
    hiloId: 'viajes',
    nivel: 'empezar',
    texto: {
      es: '¿Qué viaje te gustaría hacer todavía, y con quién?',
      pt: 'Que viagem você ainda gostaria de fazer, e com quem?',
      en: 'What trip would you still like to take, and with whom?',
    },
  },
  {
    id: 'historia-1',
    hiloId: 'historia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué acontecimiento de tu país viviste de cerca?',
      pt: 'Que acontecimento do seu país você viveu de perto?',
      en: 'What event in your country did you live through up close?',
    },
  },
  {
    id: 'historia-2',
    hiloId: 'historia',
    nivel: 'empezar',
    texto: {
      es: '¿Dónde estabas cuando pasó algo que cambió la historia?',
      pt: 'Onde você estava quando aconteceu algo que mudou a história?',
      en: 'Where were you when something happened that changed history?',
    },
  },
  {
    id: 'historia-3',
    hiloId: 'historia',
    nivel: 'empezar',
    texto: {
      es: '¿Cómo vivió tu familia una época difícil del país?',
      pt: 'Como a sua família viveu uma época difícil do país?',
      en: 'How did your family live through a hard time in the country?',
    },
  },
  {
    id: 'historia-4',
    hiloId: 'historia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué recuerdas de la primera vez que votaste?',
      pt: 'O que você lembra da primeira vez que votou?',
      en: 'What do you remember about the first time you voted?',
    },
  },
  {
    id: 'historia-5',
    hiloId: 'historia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué invento o cambio llegó a tu vida y la transformó?',
      pt: 'Que invenção ou mudança chegou à sua vida e a transformou?',
      en: 'What invention or change came into your life and transformed it?',
    },
  },
  {
    id: 'historia-6',
    hiloId: 'historia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué lugar ya no existe, pero sigue vivo en tu memoria?',
      pt: 'Que lugar já não existe, mas continua vivo na sua memória?',
      en: 'What place no longer exists but is still alive in your memory?',
    },
  },
  {
    id: 'historia-7',
    hiloId: 'historia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué noticia recuerdas haber escuchado en familia, frente a la radio o la tele?',
      pt: 'Que notícia você lembra de ter ouvido em família, diante do rádio ou da TV?',
      en: 'What news do you remember hearing with your family, around the radio or the TV?',
    },
  },
  {
    id: 'historia-8',
    hiloId: 'historia',
    nivel: 'empezar',
    texto: {
      es: '¿Qué te gustaría que las próximas generaciones supieran de tu época?',
      pt: 'O que você gostaria que as próximas gerações soubessem da sua época?',
      en: 'What would you like future generations to know about your time?',
    },
  },
];

const AZAR: PreguntaHilo[] = [
  {
    id: 'azar-1',
    hiloId: null,
    nivel: 'empezar',
    texto: {
      es: '¿Qué momento de tu vida te gustaría volver a vivir?',
      pt: 'Que momento da sua vida você gostaria de viver de novo?',
      en: 'What moment of your life would you like to live again?',
    },
  },
  {
    id: 'azar-2',
    hiloId: null,
    nivel: 'empezar',
    texto: {
      es: '¿Qué consejo le darías a tu yo de quince años?',
      pt: 'Que conselho você daria a você mesmo aos quinze anos?',
      en: 'What advice would you give your fifteen-year-old self?',
    },
  },
  {
    id: 'azar-3',
    hiloId: null,
    nivel: 'empezar',
    texto: {
      es: '¿Cuál ha sido el día más feliz de tu vida?',
      pt: 'Qual foi o dia mais feliz da sua vida?',
      en: 'What has been the happiest day of your life?',
    },
  },
  {
    id: 'azar-4',
    hiloId: null,
    nivel: 'empezar',
    texto: {
      es: '¿De qué te sientes agradecido o agradecida?',
      pt: 'Pelo que você se sente grato ou grata?',
      en: 'What are you grateful for?',
    },
  },
  {
    id: 'azar-5',
    hiloId: null,
    nivel: 'empezar',
    texto: {
      es: '¿Qué decisión cambió el rumbo de tu vida?',
      pt: 'Que decisão mudou o rumo da sua vida?',
      en: 'What decision changed the course of your life?',
    },
  },
  {
    id: 'azar-6',
    hiloId: null,
    nivel: 'empezar',
    texto: {
      es: '¿Qué cosa pequeña te hace feliz?',
      pt: 'Que coisa pequena te faz feliz?',
      en: 'What small thing makes you happy?',
    },
  },
  {
    id: 'azar-7',
    hiloId: null,
    nivel: 'empezar',
    texto: {
      es: '¿Cómo te gustaría que te recordaran?',
      pt: 'Como você gostaria de ser lembrado ou lembrada?',
      en: 'How would you like to be remembered?',
    },
  },
  {
    id: 'azar-8',
    hiloId: null,
    nivel: 'empezar',
    texto: {
      es: '¿Qué historia tuya merece ser contada y nunca encontró a quién?',
      pt: 'Que história sua merece ser contada e nunca encontrou quem a ouvisse?',
      en: 'What story of yours deserves to be told but never found a listener?',
    },
  },
];

export const PREGUNTAS_HILO: PreguntaHilo[] = TEMAS;

const POR_ID = new Map<string, PreguntaHilo>([...TEMAS, ...AZAR].map((pregunta) => [pregunta.id, pregunta]));

const TEMA_NOMBRE: Record<AlmaLocale, string> = {
  es: 'Al azar',
  pt: 'Ao acaso',
  en: 'At random',
};

function elegir(pool: PreguntaHilo[]): PreguntaHilo | null {
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export function preguntaHiloPorId(id: string | null | undefined): PreguntaHilo | null {
  if (!id) return null;
  return POR_ID.get(id) ?? null;
}

export function hiloPorId(id: string | null | undefined): Hilo | null {
  if (!id) return null;
  return HILOS.find((hilo) => hilo.id === id) ?? null;
}

export function idPreguntaHilo(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return POR_ID.has(value) ? value : null;
}

/** Los 12 temas y «Al azar». Las preguntas viejas de la semana no entran. */
export function idsPreguntaBanco(): readonly string[] {
  return [...POR_ID.keys()];
}

export function textoPreguntaHilo(id: string | null | undefined, locale: AlmaLocale): string | null {
  if (!id) return null;
  return POR_ID.get(id)?.texto[locale] ?? null;
}

export function preguntaParaFormulario(id: string | null | undefined): {
  id: string;
  tema: Record<AlmaLocale, string>;
  tu: Record<AlmaLocale, string>;
  alguien: Record<AlmaLocale, string>;
} | null {
  const pregunta = preguntaHiloPorId(id);
  if (!pregunta) return null;
  const hilo = pregunta.hiloId ? hiloPorId(pregunta.hiloId) : null;
  return {
    id: pregunta.id,
    tema: hilo?.nombre ?? TEMA_NOMBRE,
    tu: pregunta.texto,
    alguien: pregunta.texto,
  };
}

/** Todas las preguntas, incluidas las de «Al azar». */
export function preguntaAlAzar(exceptoId: string | null): PreguntaHilo | null {
  const pool = [...TEMAS, ...AZAR].filter((pregunta) => pregunta.id !== exceptoId);
  return elegir(pool);
}

export function preguntaDeTema(hiloId: string | null | undefined, exceptoId?: string | null): PreguntaHilo | null {
  if (!hiloId || !HILOS.some((hilo) => hilo.id === hiloId)) return null;
  const delTema = TEMAS.filter((pregunta) => pregunta.hiloId === hiloId);
  const pool = delTema.filter((pregunta) => pregunta.id !== exceptoId);
  return elegir(pool.length > 0 ? pool : delTema);
}

/** Una pregunta de otro tema. «Al azar» no es un tema. */
export function preguntaDeOtroHilo(hiloId: string | null, exceptoId: string | null): PreguntaHilo | null {
  const otros = TEMAS.filter((pregunta) => pregunta.hiloId !== hiloId && pregunta.id !== exceptoId);
  const pool = otros.length > 0 ? otros : TEMAS.filter((pregunta) => pregunta.id !== exceptoId);
  return elegir(pool);
}
