import { config } from "dotenv";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "./loadFirebase";

config();
config({ path: ".env.local" });

type SeedStory = {
  title: string;
  placeName: string;
  lat: number;
  lng: number;
  country?: string;
  format: "text" | "audio" | "video" | "foto";
  text?: string;
  mediaUrl?: string;
  excerpt?: string;
  quote?: string;
  authorName?: string;
  authorAvatar?: string;
  thumbnailUrl?: string;
  tags?: string[];
  status: "published";
  createdAt: number;
  publishedAt: number;
};

const NOW = Date.now();
const DAY = 86400000;

function cityFromPlaceName(placeName: string): string {
  const idx = placeName.indexOf(",");
  return (idx === -1 ? placeName : placeName.slice(0, idx)).trim();
}

function buildMedia(s: SeedStory): Record<string, string> {
  const out: Record<string, string> = {};
  if (s.format === "video" && s.mediaUrl) out.videoUrl = s.mediaUrl;
  if (s.format === "audio" && s.mediaUrl) out.audioUrl = s.mediaUrl;
  if (s.thumbnailUrl) out.imageUrl = s.thumbnailUrl;
  return out;
}

/** Documento compatible con getStoriesAsync / publicación admin (media.*, city, Timestamps). */
function toFirestoreDoc(s: SeedStory): Record<string, unknown> {
  const tags = [...(s.tags ?? [])];
  if (!tags.includes("demo-seed")) tags.push("demo-seed");
  const themeTags = tags.filter((t) => t !== "demo-seed");

  return {
    status: s.status,
    title: s.title,
    lat: s.lat,
    lng: s.lng,
    city: cityFromPlaceName(s.placeName),
    country: s.country ?? null,
    placeLabel: s.placeName,
    format: s.format,
    text: s.text ?? null,
    media: buildMedia(s),
    tags,
    topic: themeTags[0] ?? null,
    excerpt: s.excerpt ?? null,
    quote: s.quote ?? null,
    authorName: s.authorName ?? null,
    authorAvatar: s.authorAvatar ?? null,
    thumbnailUrl: s.thumbnailUrl ?? null,
    publishedAt: Timestamp.fromMillis(s.publishedAt),
    createdAt: Timestamp.fromMillis(s.createdAt),
    updatedAt: Timestamp.fromMillis(s.publishedAt),
  };
}

const seed: SeedStory[] = [
  // ─── VIDEOS ───────────────────────────────────────────────────────────────
  {
    title: "El último verano en la casa grande",
    placeName: "Santiago, Chile",
    lat: -33.4489,
    lng: -70.6693,
    country: "Chile",
    format: "video",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnailUrl: "https://picsum.photos/seed/am-v2/1920/1080",
    quote: "Vendimos la casa en noviembre. Grabé cada habitación antes de irnos.",
    excerpt: "Una historia sobre lo que queda cuando un hogar deja de serlo.",
    authorName: "Valentina Cruz",
    authorAvatar: "https://i.pravatar.cc/150?img=5",
    tags: ["memoria", "familia", "ciudad", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 2,
    publishedAt: NOW - DAY * 2,
  },
  {
    title: "Mi abuela bailando sola en la cocina",
    placeName: "Ciudad de México, México",
    lat: 19.4326,
    lng: -99.1332,
    country: "México",
    format: "video",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnailUrl: "https://picsum.photos/seed/am-v3/1920/1080",
    quote: "Tenía 84 años y bailaba cumbia. No sabía que la estaba grabando.",
    excerpt: "Un martes cualquiera que se convirtió en el último martes.",
    authorName: "Rodrigo Fuentes",
    authorAvatar: "https://i.pravatar.cc/150?img=11",
    tags: ["familia", "memoria", "amor", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 5,
    publishedAt: NOW - DAY * 5,
  },
  {
    title: "El río que ya no existe",
    placeName: "Valdivia, Chile",
    lat: -39.8142,
    lng: -73.2459,
    country: "Chile",
    format: "video",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnailUrl: "https://picsum.photos/seed/am-v4/1920/1080",
    quote: "El río donde aprendí a nadar se había secado. Grabé el cauce vacío.",
    excerpt: "Volví a mi pueblo después de diez años. El río se había ido.",
    authorName: "Camila Herrera",
    authorAvatar: "https://i.pravatar.cc/150?img=9",
    tags: ["naturaleza", "memoria", "pérdida", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 8,
    publishedAt: NOW - DAY * 8,
  },
  {
    title: "Primera nevada en Berlín",
    placeName: "Berlín, Alemania",
    lat: 52.52,
    lng: 13.405,
    country: "Alemania",
    format: "video",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnailUrl: "https://picsum.photos/seed/am-v5/1920/1080",
    quote: "Lloré de frío y de asombro al mismo tiempo.",
    excerpt: "Llegué de Medellín en enero. La nieve me pareció el fin del mundo.",
    authorName: "María José Pinto",
    authorAvatar: "https://i.pravatar.cc/150?img=16",
    tags: ["migración", "identidad", "naturaleza", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 10,
    publishedAt: NOW - DAY * 10,
  },
  {
    title: "El mercado de mi madre",
    placeName: "Cusco, Perú",
    lat: -13.532,
    lng: -71.9675,
    country: "Perú",
    format: "video",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnailUrl: "https://picsum.photos/seed/am-v6/1920/1080",
    quote: "Mi madre lleva treinta años en el mismo puesto. Este es un día normal con ella.",
    excerpt: "Treinta años en el mismo lugar. Eso también es una historia.",
    authorName: "Isabel Quispe",
    authorAvatar: "https://i.pravatar.cc/150?img=21",
    tags: ["familia", "trabajo", "cuidado", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 12,
    publishedAt: NOW - DAY * 12,
  },
  {
    title: "El barrio antes de la autopista",
    placeName: "Bogotá, Colombia",
    lat: 4.711,
    lng: -74.0721,
    country: "Colombia",
    format: "video",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnailUrl: "https://picsum.photos/seed/am-v8/1920/1080",
    quote: "Filmé cada calle del barrio dos semanas antes de las demoliciones.",
    excerpt: "Lo que había antes de que llegara la autopista.",
    authorName: "Lucía Vargas",
    authorAvatar: "https://i.pravatar.cc/150?img=44",
    tags: ["ciudad", "memoria", "política", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 14,
    publishedAt: NOW - DAY * 14,
  },
  {
    title: "El taller de mi abuelo",
    placeName: "São Paulo, Brasil",
    lat: -23.5505,
    lng: -46.6333,
    country: "Brasil",
    format: "video",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnailUrl: "https://picsum.photos/seed/am-v10/1920/1080",
    quote: "Olía a madera y a él.",
    excerpt: "Mi abuelo era carpintero. Filmé el taller antes de vaciarlo.",
    authorName: "Tomás Medina",
    authorAvatar: "https://i.pravatar.cc/150?img=38",
    tags: ["familia", "trabajo", "pérdida", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 16,
    publishedAt: NOW - DAY * 16,
  },
  {
    title: "Cruzando el Estrecho",
    placeName: "Tánger, Marruecos",
    lat: 35.7595,
    lng: -5.834,
    country: "Marruecos",
    format: "video",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnailUrl: "https://picsum.photos/seed/am-v11/1920/1080",
    quote: "Veintidós minutos. Los más largos de mi vida.",
    excerpt: "El cruce en barco de Tánger a Algeciras.",
    authorName: "Fatima El Alaoui",
    authorAvatar: "https://i.pravatar.cc/150?img=49",
    tags: ["migración", "valentía", "frontera", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 18,
    publishedAt: NOW - DAY * 18,
  },

  // ─── AUDIOS ───────────────────────────────────────────────────────────────
  {
    title: "La voz de mi abuela que casi olvido",
    placeName: "Oaxaca, México",
    lat: 17.0732,
    lng: -96.7266,
    country: "México",
    format: "audio",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    thumbnailUrl: "https://picsum.photos/seed/am-a1/800/800",
    quote: "Encontré el cassette en una caja de cartón. Era su risa.",
    excerpt: "Un cassette guardado. Una risa que casi se pierde.",
    authorName: "Carlos Ibáñez",
    authorAvatar: "https://i.pravatar.cc/150?img=12",
    tags: ["memoria", "familia", "pérdida", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 1,
    publishedAt: NOW - DAY * 1,
  },
  {
    title: "El idioma que no le enseñé a mis hijos",
    placeName: "Lima, Perú",
    lat: -12.0464,
    lng: -77.0428,
    country: "Perú",
    format: "audio",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    thumbnailUrl: "https://picsum.photos/seed/am-a2/800/800",
    quote: "A veces pienso que les robé algo al no enseñárselo.",
    excerpt: "Quechua. Lo hablaba con mi madre. Con mis hijos solo hablo español.",
    authorName: "Ana Quispe",
    authorAvatar: "https://i.pravatar.cc/150?img=32",
    tags: ["identidad", "familia", "pérdida", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 3,
    publishedAt: NOW - DAY * 3,
  },
  {
    title: "La canción que mi padre nunca terminó",
    placeName: "Cali, Colombia",
    lat: 3.4516,
    lng: -76.532,
    country: "Colombia",
    format: "audio",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    thumbnailUrl: "https://picsum.photos/seed/am-a3/800/800",
    quote: "Nunca supo el nombre. Yo tampoco.",
    excerpt: "Una melodía grabada en 1987. Sin título. Sin final.",
    authorName: "Jorge Reyes",
    authorAvatar: "https://i.pravatar.cc/150?img=15",
    tags: ["familia", "música", "memoria", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 6,
    publishedAt: NOW - DAY * 6,
  },
  {
    title: "El sonido de la lluvia en Valdivia",
    placeName: "Valdivia, Chile",
    lat: -39.8142,
    lng: -73.2459,
    country: "Chile",
    format: "audio",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    thumbnailUrl: "https://picsum.photos/seed/am-a6/800/800",
    quote: "La lluvia era constante, molesta, hermosa.",
    excerpt: "Una hora de lluvia un día de agosto. Nada más.",
    authorName: "Martín Soto",
    authorAvatar: "https://i.pravatar.cc/150?img=52",
    tags: ["naturaleza", "memoria", "lugar", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 9,
    publishedAt: NOW - DAY * 9,
  },
  {
    title: "La primera llamada desde el otro lado",
    placeName: "Mexicali, México",
    lat: 32.6996,
    lng: -115.4985,
    country: "México",
    format: "audio",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    thumbnailUrl: "https://picsum.photos/seed/am-a7/800/800",
    quote: "Guardé ese mensaje nueve años.",
    excerpt: "Mi hermano cruzó. Solo dijo: llegué.",
    authorName: "Rosa Núñez",
    authorAvatar: "https://i.pravatar.cc/150?img=29",
    tags: ["migración", "familia", "frontera", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 11,
    publishedAt: NOW - DAY * 11,
  },
  {
    title: "El ruido de la fábrica que cerró",
    placeName: "Rosario, Argentina",
    lat: -32.9442,
    lng: -60.6505,
    country: "Argentina",
    format: "audio",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    thumbnailUrl: "https://picsum.photos/seed/am-a9/800/800",
    quote: "Trabajé veinte años ahí. Ese sonido era mi vida.",
    excerpt: "El último día de la fábrica. Grabé las máquinas.",
    authorName: "Alberto Ramos",
    authorAvatar: "https://i.pravatar.cc/150?img=57",
    tags: ["trabajo", "pérdida", "ciudad", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 13,
    publishedAt: NOW - DAY * 13,
  },
  {
    title: "El árabe de mi infancia",
    placeName: "Buenos Aires, Argentina",
    lat: -34.6037,
    lng: -58.3816,
    country: "Argentina",
    format: "audio",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    thumbnailUrl: "https://picsum.photos/seed/am-a11/800/800",
    quote: "A los veinte ya no hablaba árabe. Este audio es yo intentando recordar.",
    excerpt: "Llegué a Argentina a los cuatro años. A los veinte, el árabe se había ido.",
    authorName: "Nadia Khalil",
    authorAvatar: "https://i.pravatar.cc/150?img=27",
    tags: ["identidad", "migración", "lengua", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 15,
    publishedAt: NOW - DAY * 15,
  },
  {
    title: "La última conversación",
    placeName: "Asunción, Paraguay",
    lat: -25.2867,
    lng: -57.647,
    country: "Paraguay",
    format: "audio",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    thumbnailUrl: "https://picsum.photos/seed/am-a12/800/800",
    quote: "No sabía que sería la última vez.",
    excerpt: "Un mensaje de voz guardado. El 14 de marzo.",
    authorName: "Miguel Ángel Vera",
    authorAvatar: "https://i.pravatar.cc/150?img=61",
    tags: ["pérdida", "familia", "memoria", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 17,
    publishedAt: NOW - DAY * 17,
  },

  // ─── TEXTOS ───────────────────────────────────────────────────────────────
  {
    title: "Carta a la niña que fui",
    placeName: "Buenos Aires, Argentina",
    lat: -34.6037,
    lng: -58.3816,
    country: "Argentina",
    format: "text",
    text: `Eras tan seria para tu edad. Cargabas el mundo en los hombros como si fuera tu responsabilidad que no se cayera.

Quiero que sepas que el día que te sentaste sola en el recreo no fue un fracaso. Fue el primer día que aprendiste a estar contigo misma.

El departamento pequeño que tanto te avergonzaba era hogar. No lo reconociste hasta que lo dejaste.

Eres un puente, no una fractura. Esto que sientes que te parte te está construyendo hacia los dos lados.

Con amor desde el futuro.`,
    thumbnailUrl: "https://picsum.photos/seed/am-t1/1200/800",
    quote: "Eres un puente, no una fractura.",
    excerpt: "Una carta para la niña que fui. Lo que tardé cuarenta años en entender.",
    authorName: "Sofía Mendoza",
    authorAvatar: "https://i.pravatar.cc/150?img=23",
    tags: ["identidad", "escritura", "infancia", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 4,
    publishedAt: NOW - DAY * 4,
  },
  {
    title: "Lo que cabía en una maleta",
    placeName: "Santiago, Chile",
    lat: -33.4489,
    lng: -70.6693,
    country: "Chile",
    format: "text",
    text: `Solo cabía lo esencial. Fotos, un libro, una carta que mi madre escribió en 1994 y que nunca leí hasta ese día.

El resto se quedó atrás. La vajilla que compramos el primer año. La cama donde nacieron mis hijos.

Hay un ejercicio que les propongo a quienes están a punto de emigrar: hagan la maleta sin pensar. Lo que elijan en ese primer instante es lo que realmente son.

Yo elegí las fotos. Siempre supe que era mi memoria lo que necesitaba proteger.`,
    thumbnailUrl: "https://picsum.photos/seed/am-t2/1200/800",
    quote: "Lo que elijan en ese primer instante es lo que realmente son.",
    excerpt: "Una maleta. Un momento. Todo lo que somos.",
    authorName: "Ana Muñoz",
    authorAvatar: "https://i.pravatar.cc/150?img=7",
    tags: ["migración", "memoria", "identidad", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 7,
    publishedAt: NOW - DAY * 7,
  },
  {
    title: "El día que dejé de entender a mi madre",
    placeName: "Ciudad de México, México",
    lat: 19.4326,
    lng: -99.1332,
    country: "México",
    format: "text",
    text: `Fue un miércoles. Me preguntó cómo me llamaba.

Llevaba cincuenta y dos años diciéndole Ricardo. Ese día me dijo que yo no podía ser Ricardo.

El Alzheimer no llega de golpe. Llega como el agua que entra por una rendija.

Lo que sí te queda es esto: el amor no necesita que te recuerden. Puedes amar a alguien que no sabe quién eres. Yo lo hago todos los días.`,
    thumbnailUrl: "https://picsum.photos/seed/am-t3/1200/800",
    quote: "El duelo empieza antes de la muerte.",
    excerpt: "Mi madre me preguntó cómo me llamaba. Llevaba cincuenta años diciéndoselo.",
    authorName: "Ricardo Flores",
    authorAvatar: "https://i.pravatar.cc/150?img=13",
    tags: ["cuidado", "familia", "pérdida", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 19,
    publishedAt: NOW - DAY * 19,
  },
  {
    title: "La receta que no escribimos",
    placeName: "São Paulo, Brasil",
    lat: -23.5505,
    lng: -46.6333,
    country: "Brasil",
    format: "text",
    text: `Mi avó hacía un caldo que ninguna de nosotras aprendimos a hacer porque siempre creímos que habría tiempo.

No lo había.

Murió en 2019 y se llevó la receta con ella. Lo intentamos varias veces. Cada una recuerda un ingrediente diferente.

Hay cosas que solo existen mientras existe la persona que las hace. Eso no es una tragedia. Es solo la forma que tiene el amor de dejar espacio.`,
    thumbnailUrl: "https://picsum.photos/seed/am-t5/1200/800",
    quote: "Hay cosas que solo existen mientras existe la persona que las hace.",
    excerpt: "Una receta que nadie escribió. Un caldo que se fue con ella.",
    authorName: "Laura Batista",
    authorAvatar: "https://i.pravatar.cc/150?img=46",
    tags: ["familia", "memoria", "cuidado", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 21,
    publishedAt: NOW - DAY * 21,
  },
  {
    title: "El nombre que me quitaron en la escuela",
    placeName: "La Paz, Bolivia",
    lat: -16.5,
    lng: -68.15,
    country: "Bolivia",
    format: "text",
    text: `En mi casa me llaman Wiñaypacha. Significa "tiempo eterno" en aymara.

El primer día de escuela la maestra me preguntó mi nombre. Le dije Wiñaypacha. Me dijo que eso no era un nombre, que me pusiera Luisa.

Tenía seis años. Obedecí.

A los veintiocho volví a mi comunidad. Alguien me llamó Wiñaypacha y me di vuelta sin pensar. Ese nombre había estado esperando todo ese tiempo.

Ahora uso los dos. El orden importa.`,
    thumbnailUrl: "https://picsum.photos/seed/am-t7/1200/800",
    quote: "Ahora uso los dos. El orden importa.",
    excerpt: "Me quitaron mi nombre a los seis años. Tardé veintidós en recuperarlo.",
    authorName: "Luisa Quispe",
    authorAvatar: "https://i.pravatar.cc/150?img=60",
    tags: ["identidad", "política", "comunidad", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 23,
    publishedAt: NOW - DAY * 23,
  },
  {
    title: "Lo que guardé de Venezuela",
    placeName: "Caracas, Venezuela",
    lat: 10.4806,
    lng: -66.9036,
    country: "Venezuela",
    format: "text",
    text: `Salí en 2018 con una mochila. Dejé atrás los libros, los muebles, el apartamento donde viví quince años.

Lo que no pude dejar: el acento. La forma de decir chévere en el momento equivocado. La costumbre de abrazar a los desconocidos.

La patria es el olor de la cocina de tu madre un domingo. Es algo tan pequeño y tan enorme que no tiene nombre.

Llevo seis años en Lima. Me gusta. Tiene su propia magia. Pero a veces, cuando el viento pega de cierta manera, cierro los ojos y estoy en otro lugar.`,
    thumbnailUrl: "https://picsum.photos/seed/am-t9/1200/800",
    quote: "La patria es el olor de la cocina de tu madre un domingo.",
    excerpt: "Salí con una mochila. El acento no cabía pero vino igual.",
    authorName: "Ernesto Blanco",
    authorAvatar: "https://i.pravatar.cc/150?img=48",
    tags: ["migración", "identidad", "pérdida", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 25,
    publishedAt: NOW - DAY * 25,
  },
  {
    title: "Aprender a leer a los cuarenta",
    placeName: "Santa Cruz, Bolivia",
    lat: -17.7833,
    lng: -63.1822,
    country: "Bolivia",
    format: "text",
    text: `Tengo cuarenta y tres años y aprendí a leer hace dos.

Toda mi vida tuve estrategias. Pedía a otros que me leyeran los documentos. Memorizaba los colores de los letreros.

Cuando aprendí a leer, lo primero que hice fue leer el nombre de mi calle. Lo sé de memoria, lo había visto mil veces, pero ese día lo leí. Letra por letra.

La segunda cosa fue leer una carta que mi madre me mandó hace veinte años. La había guardado sin abrirla.

Decía que me quería. Lo sabía. Pero es diferente saberlo a leerlo con tus propios ojos.`,
    thumbnailUrl: "https://picsum.photos/seed/am-t11/1200/800",
    quote: "Es diferente saberlo a leerlo con tus propios ojos.",
    excerpt: "Tengo cuarenta y tres años y aprendí a leer hace dos.",
    authorName: "Ramón Suárez",
    authorAvatar: "https://i.pravatar.cc/150?img=65",
    tags: ["educación", "identidad", "valentía", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 27,
    publishedAt: NOW - DAY * 27,
  },
  {
    title: "El año que no salí de casa",
    placeName: "Santiago, Chile",
    lat: -33.4489,
    lng: -70.6693,
    country: "Chile",
    format: "text",
    text: `En 2020 no salí de casa durante nueve meses. No por el virus. Por mí.

Hay dos tipos de encierro: el que te imponen y el que te construís. El mío tenía paredes que solo yo podía ver.

Lo que aprendí es que la recuperación no tiene forma de línea recta. Tiene forma de espiral: volvés al mismo punto pero un poco más arriba cada vez.

Lo que me salvó fue ridículo y real: una planta. Una potus que casi mato tres veces. Cuidarla me obligó a levantarme todos los días.

Todavía la tengo. La llamo Remedios.`,
    thumbnailUrl: "https://picsum.photos/seed/am-t12/1200/800",
    quote: "La recuperación no tiene forma de línea recta. Tiene forma de espiral.",
    excerpt: "Nueve meses sin salir. No por el virus. Por mí.",
    authorName: "Javiera Cortés",
    authorAvatar: "https://i.pravatar.cc/150?img=22",
    tags: ["cuidado", "salud", "ciudad", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 29,
    publishedAt: NOW - DAY * 29,
  },

  // ─── FOTOS ────────────────────────────────────────────────────────────────
  {
    title: "Las manos de mi padre",
    placeName: "Guadalajara, México",
    lat: 20.6597,
    lng: -103.3496,
    country: "México",
    format: "foto",
    thumbnailUrl: "https://picsum.photos/seed/hands1/1200/900",
    quote: "No guardé fotos de su cara. Solo una de sus manos. Era suficiente.",
    excerpt: "Un álbum sobre el trabajo y el tiempo.",
    authorName: "Roberto Vargas",
    authorAvatar: "https://i.pravatar.cc/150?img=19",
    tags: ["familia", "trabajo", "tiempo", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 2,
    publishedAt: NOW - DAY * 2,
  },
  {
    title: "Mujeres de Tehuantepec",
    placeName: "Tehuantepec, México",
    lat: 16.3333,
    lng: -95.2333,
    country: "México",
    format: "foto",
    thumbnailUrl: "https://picsum.photos/seed/am-f3a/1200/900",
    quote: "El poder aquí no se anuncia. Se ejerce.",
    excerpt: "El matriarcado cotidiano de Tehuantepec.",
    authorName: "Fernanda Ruiz",
    authorAvatar: "https://i.pravatar.cc/150?img=31",
    tags: ["comunidad", "trabajo", "identidad", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 6,
    publishedAt: NOW - DAY * 6,
  },
  {
    title: "El tejido que habla",
    placeName: "Cusco, Perú",
    lat: -13.532,
    lng: -71.9675,
    country: "Perú",
    format: "foto",
    thumbnailUrl: "https://picsum.photos/seed/am-f5a/1200/900",
    quote: "Mis manos saben cosas que mi boca no puede decir.",
    excerpt: "Un telar, tres generaciones, un lenguaje propio.",
    authorName: "Marcelina Ccoa",
    authorAvatar: "https://i.pravatar.cc/150?img=42",
    tags: ["identidad", "comunidad", "arte", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 10,
    publishedAt: NOW - DAY * 10,
  },
  {
    title: "El bosque después del incendio",
    placeName: "Valdivia, Chile",
    lat: -39.8142,
    lng: -73.2459,
    country: "Chile",
    format: "foto",
    thumbnailUrl: "https://picsum.photos/seed/am-f7a/1200/900",
    quote: "Lo que quema también prepara el suelo para lo que viene.",
    excerpt: "Cuatro fotos. Cuatro estaciones. Lo que vuelve a crecer.",
    authorName: "Roberto Mansilla",
    authorAvatar: "https://i.pravatar.cc/150?img=62",
    tags: ["naturaleza", "memoria", "lugar", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 14,
    publishedAt: NOW - DAY * 14,
  },
  {
    title: "El carnaval de mi pueblo",
    placeName: "Oruro, Bolivia",
    lat: -17.9667,
    lng: -67.1167,
    country: "Bolivia",
    format: "foto",
    thumbnailUrl: "https://picsum.photos/seed/am-f9a/1200/900",
    quote: "Bailamos para recordar de dónde venimos.",
    excerpt: "El traje tardó ocho meses. El baile duró tres días.",
    authorName: "Yolanda Mamani",
    authorAvatar: "https://i.pravatar.cc/150?img=28",
    tags: ["comunidad", "identidad", "arte", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 18,
    publishedAt: NOW - DAY * 18,
  },
  {
    title: "El páramo a cuatro mil metros",
    placeName: "Cotopaxi, Ecuador",
    lat: -0.683,
    lng: -78.438,
    country: "Ecuador",
    format: "foto",
    thumbnailUrl: "https://picsum.photos/seed/am-f10a/1200/900",
    quote: "El páramo no se visita. Se habita o se pasa de largo.",
    excerpt: "La comunidad que cuida el agua. El frailejón que crece un centímetro por año.",
    authorName: "Diego Cárdenas",
    authorAvatar: "https://i.pravatar.cc/150?img=66",
    tags: ["naturaleza", "comunidad", "lugar", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 22,
    publishedAt: NOW - DAY * 22,
  },
  {
    title: "Los lunes en el Transmilenio",
    placeName: "Bogotá, Colombia",
    lat: 4.711,
    lng: -74.0721,
    country: "Colombia",
    format: "foto",
    thumbnailUrl: "https://picsum.photos/seed/am-f8a/1200/900",
    quote: "En el bus todos somos iguales por un momento.",
    excerpt: "Retratos de la hora pico. Lo que se lleva cada uno al trabajo.",
    authorName: "Carolina Mejía",
    authorAvatar: "https://i.pravatar.cc/150?img=34",
    tags: ["ciudad", "cotidiano", "comunidad", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 26,
    publishedAt: NOW - DAY * 26,
  },
  {
    title: "El mar desde Villa María del Triunfo",
    placeName: "Lima, Perú",
    lat: -12.1628,
    lng: -76.9742,
    country: "Perú",
    format: "foto",
    thumbnailUrl: "https://picsum.photos/seed/am-f12a/1200/900",
    quote: "Vivimos a media hora del mar y tardé diez años en llevarlo.",
    excerpt: "Desde el cerro, en días claros, se ve el Pacífico.",
    authorName: "Patricia Quispe",
    authorAvatar: "https://i.pravatar.cc/150?img=20",
    tags: ["ciudad", "naturaleza", "comunidad", "demo-seed"],
    status: "published",
    createdAt: NOW - DAY * 28,
    publishedAt: NOW - DAY * 28,
  },
];

async function deleteDemoSeeds(db: ReturnType<typeof getAdminDb>) {
  const snap = await db
    .collection("stories")
    .where("tags", "array-contains", "demo-seed")
    .get()
    .catch(() => null);

  if (!snap || snap.empty) return;

  const BATCH = 450;
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = db.batch();
    docs.slice(i, i + BATCH).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  console.log("Deleted previous demo-seed stories:", docs.length);
}

async function run() {
  const db = getAdminDb();
  await deleteDemoSeeds(db);

  const BATCH_SIZE = 20;
  for (let i = 0; i < seed.length; i += BATCH_SIZE) {
    const batch = db.batch();
    seed.slice(i, i + BATCH_SIZE).forEach((s) => {
      const ref = db.collection("stories").doc();
      batch.set(ref, toFirestoreDoc(s));
    });
    await batch.commit();
    console.log(
      `Batch ${Math.floor(i / BATCH_SIZE) + 1} OK (${Math.min(i + BATCH_SIZE, seed.length)} / ${seed.length})`,
    );
  }

  console.log(`\n✅ Seed completo: ${seed.length} historias publicadas en Firestore`);
  console.log("   Abrí http://127.0.0.1:3005/mapa para verlas en el globo.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
