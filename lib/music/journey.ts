import type { SoundMood, StoryMeta } from "@/lib/map-data/story-meta";

/** Target de intensidad por mood (para scoring +1 si cercano) */
const MOOD_TARGET_INTENSITY: Record<SoundMood, number> = {
  mar: 0.4,
  ciudad: 0.3,
  bosque: 0.5,
  personas: 0.2,
  animales: 0.2,
  viento: 0.3,
  universo: 0.4,
  radio: 0.3,
  lluvia: 0.3,
  mercado: 0.3,
};

/** Keywords de sonido asociados a cada mood (para +2 por match) */
const MOOD_SOUND_TAGS: Record<SoundMood, string[]> = {
  mar: ["mar", "ola", "puerto", "sal", "noche", "olas", "brisa"],
  ciudad: ["metro", "tráfico", "multitud", "lluvia", "noche", "tráfico"],
  bosque: ["viento", "hojas", "aves", "arroyo", "insectos", "lluvia"],
  viento: ["viento", "brisa", "aire", "hojas", "naturaleza"],
  animales: ["aves", "insectos", "cantos", "naturaleza"],
  universo: ["estático", "vacio", "noche"],
  personas: ["multitud", "mercado", "voces", "metro"],
  radio: ["radio", "música", "voces"],
  lluvia: ["lluvia", "goteo", "tormenta"],
  mercado: ["mercado", "voces", "multitud"],
};

function scoreStory(story: StoryMeta, mood: SoundMood): number {
  let score = 0;
  if (story.moods.includes(mood)) score += 4;
  const allowedTags = MOOD_SOUND_TAGS[mood].map((t) => t.toLowerCase());
  for (const tag of story.soundTags) {
    const normalized = tag.toLowerCase().trim();
    if (allowedTags.some((a) => a === normalized || a.includes(normalized) || normalized.includes(a))) score += 2;
  }
  const target = MOOD_TARGET_INTENSITY[mood];
  const diff = Math.abs(story.intensity - target);
  if (diff <= 1) score += 1;
  return score;
}

/** Evitar 3 seguidas del mismo país */
function varietyPenalty(candidate: StoryMeta, selected: StoryMeta[], penalty = 2): number {
  if (selected.length < 2 || !candidate.country) return 0;
  const last = selected[selected.length - 1]?.country;
  const prev = selected[selected.length - 2]?.country;
  if (last === candidate.country && prev === candidate.country) return penalty;
  return 0;
}

/**
 * Construye un viaje de hasta count historias ordenadas por relevancia al mood:
 * +4 si story.moods incluye selectedMood, +2 por soundTag que matchee el set del mood, +1 si intensity cercana.
 */
export function buildJourney(
  selectedMood: SoundMood,
  stories: StoryMeta[],
  count = 8
): StoryMeta[] {
  const selected: StoryMeta[] = [];
  const remaining = [...stories];

  while (selected.length < count && remaining.length > 0) {
    const withScores = remaining.map((s) => ({
      story: s,
      score: scoreStory(s, selectedMood) - varietyPenalty(s, selected),
    }));
    withScores.sort((a, b) => b.score - a.score);
    const best = withScores[0];
    if (!best || best.score < 0) break;
    selected.push(best.story);
    const idx = remaining.findIndex((r) => r.id === best.story.id);
    if (idx >= 0) remaining.splice(idx, 1);
  }

  return selected;
}
