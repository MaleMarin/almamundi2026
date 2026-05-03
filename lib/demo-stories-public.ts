/**
 * Demos públicas: control en cliente y servidor (NEXT_PUBLIC_SHOW_DEMO_STORIES).
 * La palabra «beta» en UI reservada a `/vision`; aquí solo copy de relatos no reales.
 */
import type { StoryPoint } from "@/lib/map-data/stories";

/** Subconjunto pasado a `DemoStoryDisclosure` desde modales (Texto/Foto/Video/Audio). */
export type DemoStoryFields = Pick<
  StoryPoint,
  "id" | "isDemo" | "isBetaDemo" | "isRealStory" | "editorialStatus" | "demoNotice"
>;

export const DEMO_STORY_LABEL = "Historia de demostración / no es real";

export const DEMO_STORY_NOTICE =
  "Este relato fue creado solo para mostrar cómo funciona AlmaMundi. No describe a una persona real ni hechos verificables.";

/** true solo con env explícita; cualquier otro valor o ausencia => false */
export function showPublicDemoStories(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_DEMO_STORIES === "true";
}

/** Puntos fallback del globo (coords válidas): solo si showPublicDemoStories(). */
export const PUBLIC_GLOBE_DEMO_FALLBACK_POINTS: StoryPoint[] = [
  {
    id: "demo-scl",
    lat: -33.4489,
    lng: -70.6693,
    label: "Santiago",
    title: "Una historia aún no contada",
    city: "Santiago",
    country: "Chile",
    topic: "identidad",
    isDemo: true,
    isRealStory: false,
    demoNotice: DEMO_STORY_NOTICE,
  },
  {
    id: "demo-valpo",
    lat: -33.0472,
    lng: -71.6127,
    label: "Valparaíso",
    title: "Una historia aún no contada",
    city: "Valparaíso",
    country: "Chile",
    topic: "identidad",
    isDemo: true,
    isRealStory: false,
    demoNotice: DEMO_STORY_NOTICE,
  },
  {
    id: "demo-bue",
    lat: -34.6037,
    lng: -58.3816,
    label: "Buenos Aires",
    title: "Una historia aún no contada",
    city: "Buenos Aires",
    country: "Argentina",
    topic: "identidad",
    isDemo: true,
    isRealStory: false,
    demoNotice: DEMO_STORY_NOTICE,
  },
  {
    id: "demo-cdmx",
    lat: 19.4326,
    lng: -99.1332,
    label: "Ciudad de México",
    title: "Una historia aún no contada",
    city: "Ciudad de México",
    country: "México",
    topic: "identidad",
    isDemo: true,
    isRealStory: false,
    demoNotice: DEMO_STORY_NOTICE,
  },
  {
    id: "demo-mad",
    lat: 40.4168,
    lng: -3.7038,
    label: "Madrid",
    title: "Una historia aún no contada",
    city: "Madrid",
    country: "España",
    topic: "identidad",
    isDemo: true,
    isRealStory: false,
    demoNotice: DEMO_STORY_NOTICE,
  },
  {
    id: "demo-bog",
    lat: 4.711,
    lng: -74.0721,
    label: "Bogotá",
    title: "Una historia aún no contada",
    city: "Bogotá",
    country: "Colombia",
    topic: "identidad",
    isDemo: true,
    isRealStory: false,
    demoNotice: DEMO_STORY_NOTICE,
  },
  {
    id: "demo-lim",
    lat: -12.0464,
    lng: -77.0428,
    label: "Lima",
    title: "Una historia aún no contada",
    city: "Lima",
    country: "Perú",
    topic: "identidad",
    isDemo: true,
    isRealStory: false,
    demoNotice: DEMO_STORY_NOTICE,
  },
  {
    id: "demo-sp",
    lat: -23.5505,
    lng: -46.6333,
    label: "São Paulo",
    title: "Una historia aún no contada",
    city: "São Paulo",
    country: "Brasil",
    topic: "identidad",
    isDemo: true,
    isRealStory: false,
    demoNotice: DEMO_STORY_NOTICE,
  },
];

export function storyShowsDemoDisclaimer(s: StoryPoint): boolean {
  if (s.isRealStory === true) return false;
  if (s.isDemo === true || s.isBetaDemo === true) return true;
  if (String(s.editorialStatus) === "beta_demo") return true;
  if (typeof s.id === "string" && s.id.startsWith("demo-")) return true;
  return false;
}

export function demoStoryFieldsFromPoint(s: StoryPoint): DemoStoryFields | undefined {
  if (!storyShowsDemoDisclaimer(s)) return undefined;
  return {
    id: s.id,
    isDemo: s.isDemo,
    isBetaDemo: s.isBetaDemo,
    isRealStory: s.isRealStory,
    editorialStatus: s.editorialStatus,
    demoNotice: s.demoNotice,
  };
}

/** Normaliza puntos marcados como demo en código / Firestore beta_demo */
export function ensurePublicDemoStoryFields(p: StoryPoint): StoryPoint {
  if (p.isRealStory === true) return p;
  const shouldMark =
    p.isDemo === true ||
    p.isBetaDemo === true ||
    String(p.editorialStatus) === "beta_demo" ||
    (typeof p.id === "string" && p.id.startsWith("demo-"));
  if (!shouldMark) return p;
  const isBeta = p.isBetaDemo === true || String(p.editorialStatus) === "beta_demo";
  return {
    ...p,
    isDemo: true,
    isRealStory: false,
    demoNotice: DEMO_STORY_NOTICE,
    ...(isBeta ? { isBetaDemo: true, editorialStatus: p.editorialStatus ?? "beta_demo" } : {}),
  };
}

export function annotatePublicFirestoreStory<T extends StoryPoint>(p: T): T {
  if (storyShowsDemoDisclaimer(p)) {
    return ensurePublicDemoStoryFields(p) as T;
  }
  if (p.isRealStory !== false) {
    return { ...p, isRealStory: true } as T;
  }
  return p;
}

export function mergeGlobeFirestoreWithDemoFallback(fs: StoryPoint[]): StoryPoint[] {
  const ids = new Set(fs.map((x) => x.id));
  const extra = PUBLIC_GLOBE_DEMO_FALLBACK_POINTS.filter((d) => !ids.has(d.id));
  return [...fs, ...extra];
}

const FALLBACK_GLOBE_IDS = new Set(PUBLIC_GLOBE_DEMO_FALLBACK_POINTS.map((p) => p.id));

/** Pins de relleno cuando no hay datos; no duplicar como “contenido editorial” en carruseles si ya hay demos propias. */
export function isPublicGlobeFallbackDemoId(id: string): boolean {
  return FALLBACK_GLOBE_IDS.has(id);
}
