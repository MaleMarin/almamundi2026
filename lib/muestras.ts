/**
 * Muestras: tipos y mock data local. Por tema; piezas mixtas (video/audio/texto/foto).
 * Sin Firebase. Muestras NO se muestran en el mapa.
 */

export const MUESTRAS_TEMAS = [
  "tiempo",
  "memoria",
  "migración",
  "ciudad",
  "naturaleza",
  "política",
  "cuidado",
] as const;

export type MuestraTema = (typeof MUESTRAS_TEMAS)[number];

export type MuestraItemType = "video" | "audio" | "texto" | "foto";

export type MuestraItem = {
  id: string;
  type: MuestraItemType;
  title: string;
  alias: string;
  date: string;
  context: string;
  mediaUrl?: string;
  textBody?: string;
  duration?: number; // segundos si aplica
};

export type Muestra = {
  slug: string;
  title: string;
  theme: MuestraTema;
  description: string;
  intro: string;
  cover: string;
  items: MuestraItem[];
};

const MUESTRAS_MOCK: Muestra[] = [
  {
    slug: "el-verano-que-duro-para-siempre",
    title: "El verano que duró para siempre",
    theme: "tiempo",
    description:
      "Algunos veranos se quedan grabados como si fueran eternos. Historias de un tiempo que el cuerpo recuerda aunque la mente lo haya olvidado.",
    intro: "",
    cover: "/muestra1.jpg",
    items: [
      {
        id: "1",
        type: "texto",
        title: "La casa de la abuela",
        alias: "—",
        date: "—",
        context: "Infancia y memoria del hogar.",
        textBody: "",
      },
      {
        id: "2",
        type: "texto",
        title: "El último día de clases",
        alias: "—",
        date: "—",
        context: "Un cierre que se alarga en el recuerdo.",
        textBody: "",
      },
      {
        id: "3",
        type: "texto",
        title: "Cuando no había hora",
        alias: "—",
        date: "—",
        context: "El tiempo vivido sin medir.",
        textBody: "",
      },
      {
        id: "4",
        type: "texto",
        title: "El ritual del desayuno",
        alias: "—",
        date: "—",
        context: "Rutinas que marcan el paso de los días.",
        textBody: "",
      },
    ],
  },
  {
    slug: "lo-que-pasa-mientras-se-espera",
    title: "Lo que pasa mientras se espera",
    theme: "tiempo",
    description:
      "Salas de hospital, aeropuertos, filas interminables. El tiempo suspendido que a veces es el más honesto.",
    intro: "",
    cover: "/muestra2.jpg",
    items: [
      {
        id: "1",
        type: "texto",
        title: "Sala de urgencias, 3 am",
        alias: "—",
        date: "—",
        context: "La madrugada en la espera.",
        textBody: "",
      },
      {
        id: "2",
        type: "texto",
        title: "El vuelo cancelado",
        alias: "—",
        date: "—",
        context: "Tiempo detenido en tránsito.",
        textBody: "",
      },
      {
        id: "3",
        type: "texto",
        title: "Esperando el diagnóstico",
        alias: "—",
        date: "—",
        context: "Cada minuto pesa distinto.",
        textBody: "",
      },
      {
        id: "4",
        type: "texto",
        title: "La fila del pan",
        alias: "—",
        date: "—",
        context: "La espera cotidiana.",
        textBody: "",
      },
    ],
  },
  {
    slug: "cuando-el-tiempo-se-vuelve-visible",
    title: "Cuando el tiempo se vuelve visible",
    theme: "tiempo",
    description:
      "Las manos arrugadas, los pasos más lentos, la memoria que elige qué guardar. Historias de quienes han vivido mucho tiempo.",
    intro: "",
    cover: "/muestra1.jpg",
    items: [
      {
        id: "1",
        type: "texto",
        title: "Mis manos ya no son mías",
        alias: "—",
        date: "—",
        context: "El cuerpo como calendario.",
        textBody: "",
      },
      {
        id: "2",
        type: "texto",
        title: "El mismo camino, distinto",
        alias: "—",
        date: "—",
        context: "Recorrer lo conocido con otros ojos.",
        textBody: "",
      },
      {
        id: "3",
        type: "texto",
        title: "Lo que ya no recuerdo",
        alias: "—",
        date: "—",
        context: "Huecos y presencias en la memoria.",
        textBody: "",
      },
      {
        id: "4",
        type: "texto",
        title: "La última fotografía",
        alias: "—",
        date: "—",
        context: "Un instante que queda.",
        textBody: "",
      },
    ],
  },
  {
    slug: "voces-del-desplazamiento",
    title: "Voces del desplazamiento",
    theme: "migración",
    description: "Cuando dejar un lugar es también empezar otro.",
    intro: "Historias que cruzan fronteras físicas y emocionales.",
    cover: "/muestra1.jpg",
    items: [
      {
        id: "1",
        type: "texto",
        title: "La maleta",
        alias: "Ana",
        date: "2023",
        context: "Lo que cabía en una maleta.",
        textBody: "Solo cabía lo esencial. Fotos, un libro, una carta. El resto se quedó atrás, en la casa que ya no era nuestra. Cada objeto que elegí llevarme cuenta una historia que no olvido.",
      },
      {
        id: "2",
        type: "audio",
        title: "El mar al otro lado",
        alias: "Luis",
        date: "2022",
        context: "La primera vez que vio el océano.",
        mediaUrl: "/audio-sample.mp3",
        duration: 120,
      },
      {
        id: "3",
        type: "texto",
        title: "Primer día en la nueva ciudad",
        alias: "María",
        date: "2024",
        context: "Llegada y desconcierto.",
        textBody: "Nadie me conocía. Las calles tenían otros nombres. Compré un mapa y empecé a caminar. Al cabo de una semana ya tenía un panadero, un kiosco y la sensación de que algo nuevo podía empezar.",
      },
      {
        id: "4",
        type: "foto",
        title: "Retrato en la ventana",
        alias: "Carlos",
        date: "2023",
        context: "Vista desde el nuevo hogar.",
        mediaUrl: "/muestra1.jpg",
      },
    ],
  },
  {
    slug: "huellas-compartidas",
    title: "Resonancias compartidas",
    theme: "naturaleza",
    description: "Relatos que se encuentran en el mismo territorio.",
    intro: "Una curaduría de voces que nombran el lugar desde distintas miradas.",
    cover: "/muestra2.jpg",
    items: [
      {
        id: "1",
        type: "texto",
        title: "El camino de la costa",
        alias: "Rocío",
        date: "2023",
        context: "Senderos y mareas.",
        textBody: "Cada mañana el mar dibuja otro borde. El camino que ayer estaba seco hoy lo cubre el agua. Caminar aquí es aceptar que el territorio cambia y que nosotros con él.",
      },
      {
        id: "2",
        type: "audio",
        title: "Viento y piedras",
        alias: "Pablo",
        date: "2022",
        context: "Paisaje sonoro.",
        mediaUrl: "/audio-sample.mp3",
        duration: 90,
      },
      {
        id: "3",
        type: "foto",
        title: "Nombres que no están en el mapa",
        alias: "Inés",
        date: "2024",
        context: "Lugares que la gente nombra.",
        mediaUrl: "/muestra2.jpg",
      },
    ],
  },
  {
    slug: "memoria-ciudad",
    title: "Memoria de ciudad",
    theme: "ciudad",
    description: "La ciudad como archivo de recuerdos.",
    intro: "Calles, edificios y esquinas que guardan historias.",
    cover: "/muestra1.jpg",
    items: [
      {
        id: "1",
        type: "texto",
        title: "La plaza de siempre",
        alias: "Jorge",
        date: "2023",
        context: "Un punto fijo en el cambio.",
        textBody: "La plaza sigue ahí. Los árboles son otros, los bancos se renovaron, pero el olor a pan del negocio de la esquina es el mismo. Vine aquí el primer día que llegué y sigo viniendo.",
      },
      {
        id: "2",
        type: "video",
        title: "Recorrido",
        alias: "Laura",
        date: "2024",
        context: "Un paseo por el barrio.",
        mediaUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
];

export function getMuestras(): Muestra[] {
  return MUESTRAS_MOCK;
}

export function getMuestrasByTema(tema: MuestraTema | null): Muestra[] {
  if (!tema) return MUESTRAS_MOCK;
  return MUESTRAS_MOCK.filter((m) => m.theme === tema);
}

/** Slugs alternativos para la sala tipo «hilo» (misma experiencia SalaHilo). */
const SALA_HILO_SLUG_ALIASES = new Set(['el-hilo', 'hilo', 'sala-hilo', 'salahilo']);

export function getMuestraBySlug(slug: string): Muestra | undefined {
  const key = slug.trim().toLowerCase();
  if (SALA_HILO_SLUG_ALIASES.has(key)) {
    return (
      MUESTRAS_MOCK.find((m) => m.slug === 'voces-del-desplazamiento') ?? MUESTRAS_MOCK[0]
    );
  }
  return MUESTRAS_MOCK.find((m) => m.slug === slug);
}
