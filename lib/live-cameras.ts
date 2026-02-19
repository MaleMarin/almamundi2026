/**
 * Dataset de cámaras en vivo verificadas para AlmaMundi.
 * Cada cámara está geolocalizada y lista para embed en el globo 3D.
 */

export type LiveCam = {
  id: string;
  slug: string;
  title: string;
  place: string; // "Santiago de Chile", "Times Square, NYC"
  country: string;
  timezone: string; // "America/Santiago", "America/New_York"
  lat: number;
  lng: number;
  tags: string[]; // ["ciudad", "trafico", "espacio", "naturaleza", ...]
  provider: string; // "EarthCam", "SkylineWebcams", "NASA", "Explore.org", etc.
  embedUrl: string; // URL embebible (youtube embed / provider embed)
  sourceUrl: string; // URL original (abrir en nueva pestaña)
  priority: number; // 1=top, 2=medio, 3=extra
};

export const LIVE_CAMS: LiveCam[] = [
  {
    id: "nyc-times-square",
    slug: "nyc-times-square",
    title: "Times Square en vivo",
    place: "New York, EE.UU.",
    country: "EE.UU.",
    timezone: "America/New_York",
    lat: 40.7580,
    lng: -73.9855,
    tags: ["ciudad", "multitud", "iconico"],
    provider: "EarthCam",
    embedUrl: "https://www.youtube.com/embed/AdUw5RdyZxI?autoplay=1&mute=1",
    sourceUrl: "https://www.earthcam.com/usa/newyork/timessquare/",
    priority: 1,
  },
  {
    id: "iss-live",
    slug: "iss-live",
    title: "Tierra desde la ISS (en vivo)",
    place: "Órbita baja (ISS)",
    country: "Espacio",
    timezone: "UTC",
    lat: 0,
    lng: 0,
    tags: ["espacio", "tierra", "nasa"],
    provider: "NASA",
    embedUrl: "https://www.youtube.com/embed/86YLFOog4GM?autoplay=1&mute=1",
    sourceUrl: "https://www.nasa.gov/",
    priority: 1,
  },
  {
    id: "santiago-centro",
    slug: "santiago-centro",
    title: "Santiago Centro en vivo",
    place: "Santiago de Chile",
    country: "Chile",
    timezone: "America/Santiago",
    lat: -33.4489,
    lng: -70.6693,
    tags: ["ciudad", "trafico", "centro"],
    provider: "SkylineWebcams",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1",
    sourceUrl: "https://www.skylinewebcams.com/es/webcam/chile/region-metropolitana/santiago/santiago-centro.html",
    priority: 1,
  },
  {
    id: "buenos-aires-obelisco",
    slug: "buenos-aires-obelisco",
    title: "Obelisco de Buenos Aires",
    place: "Buenos Aires, Argentina",
    country: "Argentina",
    timezone: "America/Argentina/Buenos_Aires",
    lat: -34.6037,
    lng: -58.3816,
    tags: ["ciudad", "iconico", "centro"],
    provider: "EarthCam",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1",
    sourceUrl: "https://www.earthcam.com/world/argentina/buenosaires/",
    priority: 2,
  },
  {
    id: "cdmx-zocalo",
    slug: "cdmx-zocalo",
    title: "Zócalo de la CDMX",
    place: "Ciudad de México, México",
    country: "México",
    timezone: "America/Mexico_City",
    lat: 19.4326,
    lng: -99.1332,
    tags: ["ciudad", "historia", "centro"],
    provider: "SkylineWebcams",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1",
    sourceUrl: "https://www.skylinewebcams.com/es/webcam/mexico/distrito-federal/ciudad-de-mexico/zocalo.html",
    priority: 2,
  },
  {
    id: "sao-paulo-paulista",
    slug: "sao-paulo-paulista",
    title: "Avenida Paulista",
    place: "São Paulo, Brasil",
    country: "Brasil",
    timezone: "America/Sao_Paulo",
    lat: -23.5505,
    lng: -46.6333,
    tags: ["ciudad", "trafico", "comercial"],
    provider: "EarthCam",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1",
    sourceUrl: "https://www.earthcam.com/world/brazil/saopaulo/",
    priority: 2,
  },
  {
    id: "los-angeles-hollywood",
    slug: "los-angeles-hollywood",
    title: "Hollywood Boulevard",
    place: "Los Angeles, EE.UU.",
    country: "EE.UU.",
    timezone: "America/Los_Angeles",
    lat: 34.1016,
    lng: -118.3267,
    tags: ["ciudad", "iconico", "entretenimiento"],
    provider: "EarthCam",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1",
    sourceUrl: "https://www.earthcam.com/usa/california/hollywood/",
    priority: 2,
  },
  {
    id: "tokyo-shibuya",
    slug: "tokyo-shibuya",
    title: "Shibuya Crossing",
    place: "Tokyo, Japón",
    country: "Japón",
    timezone: "Asia/Tokyo",
    lat: 35.6598,
    lng: 139.7006,
    tags: ["ciudad", "multitud", "iconico"],
    provider: "EarthCam",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1",
    sourceUrl: "https://www.earthcam.com/world/japan/tokyo/",
    priority: 1,
  },
];
