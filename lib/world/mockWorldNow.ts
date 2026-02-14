import type { WorldItemSerialized } from "./types";

export function mockWorldNow(field: string, mode: "now" | "today") {
  const now = new Date().toISOString();
  const items: WorldItemSerialized[] = [
    {
      id: "mock-1",
      kind: "news",
      title: `Demo (${field}, ${mode})`,
      summary: "Pulso de prueba desde mock.",
      publishedAt: now,
      ingestedAt: now,
      fields: [field],
      intensity: 1,
      sources: [{ name: "mock", url: "#", publishedAt: now }],
      sourceCount: 1,
      dedupeKey: "mock-1",
      isActive: true,
    },
  ];
  return { updatedAt: now, items };
}
