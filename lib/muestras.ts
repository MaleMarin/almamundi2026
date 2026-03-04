/**
 * Muestras: tipos y mock data local. Por tema; piezas mixtas (video/audio/texto/foto).
 * Sin Firebase. Muestras NO se muestran en el mapa.
 */

export const MUESTRAS_TEMAS = [
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
    title: "Huellas compartidas",
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

export function getMuestraBySlug(slug: string): Muestra | undefined {
  return MUESTRAS_MOCK.find((m) => m.slug === slug);
}
