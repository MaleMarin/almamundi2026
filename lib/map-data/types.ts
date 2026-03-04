export type MapView = "stories" | "news" | "music";

export type GlobePoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: MapView;
  meta?: Record<string, any>;
};

export type CameraItem = {
  id: string;
  title: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  provider: string;
  tags: string[];
  playMode: 'embed' | 'hls' | 'external';
  embedUrl?: string;
  hlsUrl?: string;
  sourceUrl: string;
  priority?: number;
  timeZone?: string;
  category?: string;
};

export type CameraPoint = {
  id: string;
  title: string;
  city?: string;
  country?: string;
  provider?: string;
  lat: number;
  lng: number;
  url: string;
  tags?: string[];
  /** Para rutas /mapa/camaras/[slug]; si no se define, se usa id */
  slug?: string;
  /** Para el reproductor del Observatorio; si no se define, se trata como page con url */
  source?: { kind: "page"; url: string } | { kind: "youtube"; videoId: string } | { kind: "hls"; url: string };
};
