// lib/world/mockWorldNow.ts
export type WorldNowItem = {
  id: string;
  title: string;
  subtitle?: string;
  kind: "news" | "story" | "signal" | "note";
  source?: string;
  url?: string;
  ts: number;
  lat: number;
  lon: number;
  tags?: string[];
};

export type WorldNowResponse = {
  mode: "mock";
  generatedAt: number;
  items: WorldNowItem[];
};

export function mockWorldNow(): WorldNowResponse {
  const now = Date.now();
  return {
    mode: "mock",
    generatedAt: now,
    items: [
      { id: "mock-1", title: "Señal: conversación en vivo", subtitle: "Pulso social sobre IA y trabajo", kind: "signal", source: "AlmaMundi Live", ts: now - 1000 * 60 * 12, lat: -33.4489, lon: -70.6693, tags: ["ia", "trabajo", "tendencia"] },
      { id: "mock-2", title: "Noticia: nuevo marco regulatorio", subtitle: "Resumen breve para UI (placeholder)", kind: "news", source: "CIPER Chile", url: "https://ciperchile.cl", ts: now - 1000 * 60 * 45, lat: -34.6037, lon: -58.3816, tags: ["regulación", "política", "latam"] },
      { id: "mock-3", title: "Historia: Tejiendo Caminos", subtitle: "Un nodo se enciende cuando llega un relato", kind: "story", source: "Usuario anónimo", ts: now - 1000 * 60 * 90, lat: 40.4168, lon: -3.7038, tags: ["memoria", "viaje", "ciudad"] },
      { id: "mock-4", title: "Nota: prueba de UI", subtitle: "Card simple para layout y tipografía", kind: "note", ts: now - 1000 * 60 * 180, lat: 37.7749, lon: -122.4194, tags: ["ui", "layout"] },
    ],
  };
}
