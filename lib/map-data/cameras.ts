import type { CameraPoint } from "./types";

export type { CameraPoint } from "./types";

function withSlugAndSource(cam: Omit<CameraPoint, "slug" | "source">): CameraPoint {
  return {
    ...cam,
    slug: cam.id,
    source: { kind: "page", url: cam.url },
  };
}

export function getCameraPoints(): CameraPoint[] {
  return [
    // HLS reales (reproducción inline en Observatorio)
    {
      id: "axial-seamount",
      slug: "axial-seamount",
      title: "Axial Seamount",
      city: "Fondo oceánico",
      country: "OOI / Ocean Observatories Initiative",
      provider: "OOI",
      lat: 45.95,
      lng: -130.0,
      url: "https://elem-delta.oceanobservatories.org/out/u/camhd.m3u8",
      tags: ["ocean", "science", "hls"],
      source: { kind: "hls", url: "https://elem-delta.oceanobservatories.org/out/u/camhd.m3u8" },
    },
    {
      id: "nasa-tv-public",
      slug: "nasa-tv-public",
      title: "NASA TV Public",
      city: "Señal global",
      country: "Espacio",
      provider: "NASA",
      lat: 0,
      lng: 0,
      url: "https://endpnt.com/hls/nasa-public/playlist.m3u8",
      tags: ["space", "nasa", "hls"],
      source: { kind: "hls", url: "https://endpnt.com/hls/nasa-public/playlist.m3u8" },
    },

    withSlugAndSource({
      id: "iss-nasa",
      title: "Tierra desde la ISS",
      city: "Órbita baja",
      country: "Espacio",
      provider: "NASA",
      lat: 0,
      lng: 0,
      url: "https://www.nasa.gov/multimedia/nasatv/#public",
      tags: ["space", "earth"],
    }),
    withSlugAndSource({
      id: "ny-times-square",
      title: "Times Square",
      city: "New York",
      country: "EE.UU.",
      provider: "EarthCam",
      lat: 40.758,
      lng: -73.9855,
      url: "https://www.earthcam.com/usa/newyork/timessquare/",
      tags: ["city"],
    }),

    // LATAM
    withSlugAndSource({
      id: "santiago-centro",
      title: "Santiago Centro",
      city: "Santiago",
      country: "Chile",
      provider: "SkylineWebcams",
      lat: -33.4489,
      lng: -70.6693,
      url: "https://www.skylinewebcams.com/",
      tags: ["city", "latam"],
    }),
    withSlugAndSource({
      id: "buenos-aires-centro",
      title: "Buenos Aires Centro",
      city: "Buenos Aires",
      country: "Argentina",
      provider: "SkylineWebcams",
      lat: -34.6037,
      lng: -58.3816,
      url: "https://www.skylinewebcams.com/",
      tags: ["city", "latam"],
    }),
    withSlugAndSource({
      id: "sao-paulo-paulista",
      title: "Avenida Paulista",
      city: "São Paulo",
      country: "Brasil",
      provider: "SkylineWebcams",
      lat: -23.5617,
      lng: -46.6561,
      url: "https://www.skylinewebcams.com/",
      tags: ["city", "latam"],
    }),
    withSlugAndSource({
      id: "cdmx-centro",
      title: "Centro CDMX",
      city: "Ciudad de México",
      country: "México",
      provider: "Webcams de México",
      lat: 19.4326,
      lng: -99.1332,
      url: "https://www.webcamsdemexico.com/",
      tags: ["city", "latam"],
    }),

    // USA
    withSlugAndSource({
      id: "los-angeles",
      title: "Los Angeles",
      city: "Los Angeles",
      country: "EE.UU.",
      provider: "EarthCam",
      lat: 34.0522,
      lng: -118.2437,
      url: "https://www.earthcam.com/",
      tags: ["city", "usa"],
    }),

    // EUROPA
    withSlugAndSource({
      id: "paris-eiffel",
      title: "Torre Eiffel",
      city: "Paris",
      country: "Francia",
      provider: "EarthCam",
      lat: 48.8584,
      lng: 2.2945,
      url: "https://www.earthcam.com/world/france/paris/",
      tags: ["city", "europe"],
    }),
    withSlugAndSource({
      id: "venice",
      title: "Venecia",
      city: "Venecia",
      country: "Italia",
      provider: "SkylineWebcams",
      lat: 45.4408,
      lng: 12.3155,
      url: "https://www.skylinewebcams.com/",
      tags: ["city", "europe"],
    }),

    // ASIA
    withSlugAndSource({
      id: "tokyo",
      title: "Tokyo",
      city: "Tokyo",
      country: "Japón",
      provider: "YouTube / Varios",
      lat: 35.6762,
      lng: 139.6503,
      url: "https://www.youtube.com/",
      tags: ["city", "asia"],
    }),

    // NATURALEZA / OCEANO
    withSlugAndSource({
      id: "yellowstone",
      title: "Yellowstone",
      city: "Wyoming",
      country: "EE.UU.",
      provider: "NPS",
      lat: 44.428,
      lng: -110.5885,
      url: "https://www.nps.gov/yell/learn/photosmultimedia/webcams.htm",
      tags: ["nature", "usa"],
    }),
    withSlugAndSource({
      id: "monterey-bay",
      title: "Monterey Bay Aquarium",
      city: "Monterey",
      country: "EE.UU.",
      provider: "Monterey Bay Aquarium",
      lat: 36.6177,
      lng: -121.9018,
      url: "https://www.montereybayaquarium.org/animals/live-cams",
      tags: ["ocean", "usa"],
    }),
  ];
}

export function getCameraSourceUrl(cam: CameraPoint): string {
  return cam.url;
}

export function getCameraBySlug(slug: string): CameraPoint | undefined {
  return getCameraPoints().find((c) => (c.slug ?? c.id) === slug);
}

export function getCameraById(id: string): CameraPoint | undefined {
  return getCameraPoints().find((c) => c.id === id);
}
