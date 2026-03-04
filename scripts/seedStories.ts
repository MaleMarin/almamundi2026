import { config } from "dotenv";
// Cargar .env y luego .env.local (por si solo tienes vars en .env.local)
config();
config({ path: ".env.local" });
import { getAdminDb } from "./loadFirebase";

type Story = {
  title: string;
  placeName: string;
  lat: number;
  lng: number;
  country?: string;
  format: "text" | "audio" | "video";
  text?: string;
  mediaUrl?: string;
  moods: Array<"mar" | "ciudad" | "bosque" | "animales" | "universo" | "personas">;
  tags?: string[];
  status: "published";
  createdAt: number;
  publishedAt: number;
};

const NOW = Date.now();

const seed: Story[] = [
  {
    title: "Océano nocturno",
    placeName: "Valparaíso, Chile",
    lat: -33.0472,
    lng: -71.6127,
    format: "audio",
    mediaUrl: "/audio/oceano.mp3",
    moods: ["mar"],
    tags: ["olas", "noche"],
    status: "published",
    createdAt: NOW,
    publishedAt: NOW,
  },
  {
    title: "Avenida Paulista",
    placeName: "São Paulo, Brasil",
    lat: -23.5617,
    lng: -46.656,
    format: "audio",
    mediaUrl: "/audio/ciudad.mp3",
    moods: ["ciudad", "personas"],
    tags: ["tráfico", "pasos"],
    status: "published",
    createdAt: NOW,
    publishedAt: NOW,
  },
  {
    title: "Bosque patagónico",
    placeName: "Bariloche, Argentina",
    lat: -41.1335,
    lng: -71.3103,
    format: "text",
    text: "Una caminata corta. El viento, los árboles y el silencio que no es silencio...",
    moods: ["bosque", "personas"],
    tags: ["viento", "madera"],
    status: "published",
    createdAt: NOW,
    publishedAt: NOW,
  },
  {
    title: "Tokio al amanecer",
    placeName: "Tokyo, Japón",
    lat: 35.6762,
    lng: 139.6503,
    format: "video",
    mediaUrl: "/video/tokyo.mp4",
    moods: ["ciudad"],
    tags: ["amanecer", "metro"],
    status: "published",
    createdAt: NOW,
    publishedAt: NOW,
  },
  {
    title: "CDMX en la noche",
    placeName: "Ciudad de México, México",
    lat: 19.4326,
    lng: -99.1332,
    format: "audio",
    mediaUrl: "/audio/ciudad2.mp3",
    moods: ["ciudad", "personas"],
    tags: ["plaza", "voces"],
    status: "published",
    createdAt: NOW,
    publishedAt: NOW,
  },
  {
    title: "Borde del mundo",
    placeName: "Atacama, Chile",
    lat: -23.8634,
    lng: -69.1296,
    format: "audio",
    mediaUrl: "/audio/universo.mp3",
    moods: ["universo"],
    tags: ["estrellas", "polvo"],
    status: "published",
    createdAt: NOW,
    publishedAt: NOW,
  },
  {
    title: "Animales al borde",
    placeName: "Johannesburgo, Sudáfrica",
    lat: -26.2041,
    lng: 28.0473,
    format: "text",
    text: "No es documental. Es cómo suena una ciudad cuando los animales también están cerca.",
    moods: ["animales", "ciudad"],
    tags: ["ruidos", "pájaros"],
    status: "published",
    createdAt: NOW,
    publishedAt: NOW,
  },
  {
    title: "París desde arriba",
    placeName: "París, Francia",
    lat: 48.8566,
    lng: 2.3522,
    format: "video",
    mediaUrl: "/video/paris.mp4",
    moods: ["ciudad"],
    tags: ["rio", "luces"],
    status: "published",
    createdAt: NOW,
    publishedAt: NOW,
  },
  {
    title: "Río de Janeiro",
    placeName: "Río de Janeiro, Brasil",
    lat: -22.9068,
    lng: -43.1729,
    format: "audio",
    mediaUrl: "/audio/mar2.mp3",
    moods: ["mar", "ciudad"],
    tags: ["olas", "avenida"],
    status: "published",
    createdAt: NOW,
    publishedAt: NOW,
  },
  {
    title: "Buenos Aires bajo la lluvia",
    placeName: "Buenos Aires, Argentina",
    lat: -34.6037,
    lng: -58.3816,
    format: "audio",
    mediaUrl: "/audio/lluvia.mp3",
    moods: ["ciudad", "personas"],
    tags: ["lluvia", "colectivo"],
    status: "published",
    createdAt: NOW,
    publishedAt: NOW,
  },
];

async function run() {
  const db = getAdminDb();

  const snap = await db
    .collection("stories")
    .where("tags", "array-contains", "demo-seed")
    .get()
    .catch(() => null);

  if (snap && !snap.empty) {
    const del = db.batch();
    snap.docs.forEach((d) => del.delete(d.ref));
    await del.commit();
    console.log("Deleted previous demo-seed stories:", snap.size);
  }

  const batch = db.batch();
  seed.forEach((s) => {
    const ref = db.collection("stories").doc();
    batch.set(ref, { ...s, tags: [...(s.tags ?? []), "demo-seed"] });
  });
  await batch.commit();
  console.log("Seed OK:", seed.length, "stories");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
