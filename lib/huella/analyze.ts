import OpenAI from "openai";
import type { StoryAnalysis } from "./types";
import { analysisToVisualParams } from "./translate";
import type { HuellaVisualParams } from "./types";

const ANALYSIS_SYSTEM = `Eres un analizador de historias para Alma Mundi. Devuelves ÚNICAMENTE un JSON válido, sin markdown ni texto extra, con esta estructura exacta:
{
  "themes": ["tema1", "tema2"],
  "emotions": ["emoción1", "emoción2"],
  "intensity": 0.7,
  "rhythm": 0.6,
  "depth": 0.8,
  "tone": 0.3
}
- themes: 2-5 temas o ideas centrales (palabras o frases cortas).
- emotions: 2-4 emociones predominantes.
- intensity: 0-1 (intensidad emocional o dramática).
- rhythm: 0-1 (ritmo narrativo: 0=lento/pausado/reflexivo, 1=rápido/frenético/dinámico).
- depth: 0-1 (complejidad o profundidad narrativa; 0=simple, 1=profunda/compleja).
- tone: 0-1 (tono de voz/emoción: 0=grave/calma/reflexivo → paleta fría, 1=agudo/energético/intenso → paleta cálida).`;

export interface AnalyzeResult {
  visualParams: HuellaVisualParams;
  transcription?: string;
  analysis?: StoryAnalysis;
}

/** Obtiene transcripción de audio/video desde URL (Whisper). */
export async function transcribeFromUrl(audioOrVideoUrl: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const res = await fetch(audioOrVideoUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
  const buf = await res.arrayBuffer();
  const blob = new Blob([buf], { type: res.headers.get("content-type") || "audio/webm" });

  const openai = new OpenAI({ apiKey });
  const file = new File([blob], "audio.webm", { type: blob.type });
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "text",
  });
  return typeof transcription === "string" ? transcription : (transcription as { text?: string }).text ?? "";
}

/** Analiza texto con GPT y devuelve StoryAnalysis. */
export async function analyzeTextWithGPT(text: string): Promise<StoryAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM },
      { role: "user", content: `Analiza esta historia y devuelve solo el JSON:\n\n${text.slice(0, 12000)}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 500,
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("Empty GPT response");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return {
    themes: Array.isArray(parsed.themes) ? parsed.themes.map(String) : [],
    emotions: Array.isArray(parsed.emotions) ? parsed.emotions.map(String) : [],
    intensity: clamp(Number(parsed.intensity), 0, 1),
    rhythm: clamp(Number(parsed.rhythm), 0, 1),
    depth: clamp(Number(parsed.depth), 0, 1),
    tone: clamp(Number(parsed.tone), 0, 1),
  };
}

function clamp(n: number, a: number, b: number): number {
  return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : 0.5;
}

/** Flujo completo: opcional Whisper → GPT → traducción a parámetros visuales. */
export async function analyzeStory(params: {
  text?: string;
  audioUrl?: string;
  videoUrl?: string;
  format: string;
}): Promise<AnalyzeResult> {
  let text = params.text?.trim() ?? "";
  const mediaUrl = params.audioUrl ?? params.videoUrl;

  if ((params.format === "audio" || params.format === "video") && mediaUrl) {
    try {
      const transcription = await transcribeFromUrl(mediaUrl);
      text = transcription;
    } catch (e) {
      console.warn("[huella] Whisper failed:", e);
    }
  }

  if (!text || text.length < 10) {
    return {
      visualParams: analysisToVisualParams(
        { themes: ["historia"], emotions: ["reflexión"], intensity: 0.5, rhythm: 0.5, depth: 0.5, tone: 0.5 },
        params.format
      ),
    };
  }

  let analysis: StoryAnalysis;
  try {
    analysis = await analyzeTextWithGPT(text);
  } catch (e) {
    console.warn("[huella] GPT analysis failed:", e);
    analysis = {
      themes: ["historia"],
      emotions: ["reflexión"],
      intensity: 0.5,
      rhythm: 0.5,
      depth: 0.5,
      tone: 0.5,
    };
  }

  const visualParams = analysisToVisualParams(analysis, params.format);
  return {
    visualParams,
    transcription: text !== params.text ? text : undefined,
    analysis,
  };
}
