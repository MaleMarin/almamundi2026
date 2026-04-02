import { isPublicAudioMoodId, publicAudioPathFromMoodId } from "@/lib/public-audio-mood";

export type AmbientKey = "mar" | "ciudad" | "bosque" | "viento" | "animales" | "universo" | "personas" | "radio" | "lluvia" | "mercado";

type CurrentPlayback =
  | { mode: "preset"; key: AmbientKey; source: AudioBufferSourceNode; gain: GainNode }
  | { mode: "public"; path: string; source: AudioBufferSourceNode; gain: GainNode };

type PlayerState = {
  ctx: AudioContext | null;
  master: GainNode | null;
  current: CurrentPlayback | null;
  buffers: Partial<Record<AmbientKey, AudioBuffer>>;
  publicBuffers: Map<string, AudioBuffer>;
  unlocked: boolean;
};

const state: PlayerState = {
  ctx: null,
  master: null,
  current: null,
  buffers: {},
  publicBuffers: new Map(),
  unlocked: false,
};

/**
 * Mar: audio desde este vídeo en `public/` (solo pista sonora vía Web Audio).
 * Archivo: `WhatsApp Video 2026-03-27 at 16.57.58.mp4`
 */
const MAR_SEA_VIDEO_FILENAME = "WhatsApp Video 2026-03-27 at 16.57.58.mp4";
const MAR_VIDEO_AUDIO_URL = `/${encodeURIComponent(MAR_SEA_VIDEO_FILENAME)}`;

const URLS: Record<AmbientKey, string[]> = {
  mar: [MAR_VIDEO_AUDIO_URL, "/audio/mar.m4a", "/audio/ambients/ocean.wav", "/audio/ambients/ocean.mp3"],
  ciudad: ["/audio/ambients/city.wav", "/audio/ambients/city.mp3"],
  bosque: ["/audio/ambients/forest.wav", "/audio/ambients/forest.mp3"],
  viento: ["/audio/ambients/wind.mp3", "/audio/ambients/wind.wav", "/audio/neblina.mp3"],
  animales: ["/audio/ambients/animals.wav", "/audio/ambients/animals.mp3"],
  // Sonido del universo: primero universe.mp3 (sustituir por grabación real/CMB si se tiene)
  universo: ["/audio/ambients/universe.mp3", "/audio/ambients/universe.wav", "/universo.mp3"],
  personas: ["/audio/ambients/people.wav", "/audio/ambients/people.mp3"],
  radio: ["/audio/ambients/radio.mp3", "/audio/ambients/radio.wav"],
  lluvia: ["/audio/ambients/lluvia.mp3", "/audio/ambients/rain-city.mp3", "/audio/ambients/lluvia.wav"],
  mercado: ["/audio/ambients/mercado.mp3", "/audio/ambients/market.mp3", "/audio/ambients/mercado.wav"],
};

const FALLBACK_URL = "/audio/mar.m4a";

const TRACK_VOL_STORAGE = "almamundi_ambient_track_vol";
const PUBLIC_TRACK_VOL_STORAGE = "almamundi_ambient_public_track_vol";

/** Volumen nominal máximo de cada pista antes del multiplicador por mood (0–1). */
const TRACK_GAIN_NOMINAL = 1.0;

/**
 * Archivos en `public/` suelen estar más bajos (p. ej. -14 LUFS) que los ambients del sitio.
 * Se aplica solo a modo `public`; el slider del panel sigue siendo 0–100 % sobre esta base.
 */
const PUBLIC_TRACK_OUTPUT_GAIN = 1.28;

function publicTrackTargetGain(userVol01: number): number {
  return TRACK_GAIN_NOMINAL * userVol01 * PUBLIC_TRACK_OUTPUT_GAIN;
}

function ambientKeys(): AmbientKey[] {
  return Object.keys(URLS) as AmbientKey[];
}

function defaultTrackVolumes(): Record<AmbientKey, number> {
  return Object.fromEntries(ambientKeys().map((k) => [k, 1])) as Record<AmbientKey, number>;
}

function readTrackVolumesFromStorage(): Partial<Record<AmbientKey, number>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TRACK_VOL_STORAGE);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<Record<AmbientKey, number>> = {};
    for (const k of ambientKeys()) {
      const v = o[k];
      if (typeof v === "number" && Number.isFinite(v)) {
        out[k] = Math.max(0, Math.min(1, v));
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeTrackVolumesToStorage(all: Record<AmbientKey, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRACK_VOL_STORAGE, JSON.stringify(all));
  } catch { /* quota / private mode */ }
}

/** Volumen guardado del ambiente `key` (0–1). Por defecto 1. */
export function getAmbientTrackVolume(key: AmbientKey): number {
  const merged = { ...defaultTrackVolumes(), ...readTrackVolumesFromStorage() };
  const v = merged[key];
  return typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
}

/**
 * Ajusta el volumen de un ambiente (0–1). Se persiste y, si esa pista suena ahora, se aplica al vuelo.
 */
export function setAmbientTrackVolume(key: AmbientKey, vol: number): void {
  const clamped = Math.max(0, Math.min(1, vol));
  const all = { ...defaultTrackVolumes(), ...readTrackVolumesFromStorage() };
  all[key] = clamped;
  writeTrackVolumesToStorage(all);

  if (state.current?.mode !== "preset" || state.current.key !== key || !state.ctx) return;
  const g = state.current.gain.gain;
  const ctx = state.ctx;
  const t = ctx.currentTime;
  const target = TRACK_GAIN_NOMINAL * clamped;
  try {
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(target, t + 0.06);
  } catch {
    g.value = target;
  }
}

function readPublicTrackVolumes(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PUBLIC_TRACK_VOL_STORAGE);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "number" && Number.isFinite(v)) out[k] = Math.max(0, Math.min(1, v));
    }
    return out;
  } catch {
    return {};
  }
}

function writePublicTrackVolumes(all: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PUBLIC_TRACK_VOL_STORAGE, JSON.stringify(all));
  } catch { /* quota */ }
}

export function getPublicAmbientVolume(path: string): number {
  const v = readPublicTrackVolumes()[path];
  return typeof v === "number" && Number.isFinite(v) ? v : 1;
}

export function setPublicAmbientVolume(path: string, vol: number): void {
  const clamped = Math.max(0, Math.min(1, vol));
  const all = { ...readPublicTrackVolumes(), [path]: clamped };
  writePublicTrackVolumes(all);

  if (state.current?.mode !== "public" || state.current.path !== path || !state.ctx) return;
  const g = state.current.gain.gain;
  const ctx = state.ctx;
  const t = ctx.currentTime;
  const target = publicTrackTargetGain(clamped);
  try {
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(target, t + 0.06);
  } catch {
    g.value = target;
  }
}

/** Volumen para id de fila del panel: preset (`AmbientKey`) o `__pub__:/ruta…`. */
export function getAmbientOrPublicTrackVolume(id: string): number {
  if (isPublicAudioMoodId(id)) {
    const p = publicAudioPathFromMoodId(id);
    return p != null ? getPublicAmbientVolume(p) : 1;
  }
  return getAmbientTrackVolume(id as AmbientKey);
}

export function setAmbientOrPublicTrackVolume(id: string, vol: number): void {
  if (isPublicAudioMoodId(id)) {
    const p = publicAudioPathFromMoodId(id);
    if (p) setPublicAmbientVolume(p, vol);
    return;
  }
  setAmbientTrackVolume(id as AmbientKey, vol);
}

/** Volumen base nominal del master. Más alto para que el sonido del universo se oiga bien. */
const AMBIENT_MASTER_VOL = 1.0;

/** Volumen base actual (0–1) para la atmósfera temporal. */
let ambientBaseVolume = 0.95;

/** Crea el contexto solo tras un gesto del usuario (evita el aviso de AudioContext en consola). */
export function initFromUserGesture(): void {
  if (state.ctx) {
    if (state.ctx.state === "suspended") state.ctx.resume();
    return;
  }
  state.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  state.master = state.ctx.createGain();
  state.master.gain.value = AMBIENT_MASTER_VOL;
  state.master.connect(state.ctx.destination);
  state.ctx.resume();
}

function ensureCtx(): AudioContext | null {
  return state.ctx;
}

async function loadBuffer(key: AmbientKey): Promise<AudioBuffer> {
  if (state.buffers[key]) return state.buffers[key]!;
  const ctx = ensureCtx();
  if (!ctx) throw new Error("AudioContext not initialized");

  async function tryLoad(url: string): Promise<AudioBuffer> {
    if (!ctx) throw new Error("AudioContext not initialized");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
    const arr = await res.arrayBuffer();
    if (arr.byteLength < 1000) throw new Error(`file too small: ${url}`);
    return ctx.decodeAudioData(arr);
  }

  const candidates = [...URLS[key], FALLBACK_URL];
  for (const url of candidates) {
    try {
      const buf = await tryLoad(url);
      state.buffers[key] = buf;
      return buf;
    } catch { /* try next */ }
  }
  throw new Error(`No audio found for ${key}`);
}

async function loadPublicBuffer(urlPath: string): Promise<AudioBuffer> {
  const cached = state.publicBuffers.get(urlPath);
  if (cached) return cached;
  const ctx = ensureCtx();
  if (!ctx) throw new Error("AudioContext not initialized");
  const res = await fetch(urlPath);
  if (!res.ok) throw new Error(`fetch ${urlPath}: ${res.status}`);
  const arr = await res.arrayBuffer();
  if (arr.byteLength < 100) throw new Error(`file too small: ${urlPath}`);
  const buf = await ctx.decodeAudioData(arr);
  state.publicBuffers.set(urlPath, buf);
  return buf;
}

/**
 * Reproduce en bucle un archivo bajo `public/` (ruta URL desde raíz, p. ej. `/audio/dia.mp3`).
 */
export async function playAmbientFromPublicUrl(urlPath: string, opts?: { fadeMs?: number }) {
  const pathNorm = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
  const ctx = ensureCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* política del navegador */
    }
  }
  if (ctx.state === "suspended") return;
  const fade = (opts?.fadeMs ?? 800) / 1000;

  let buf: AudioBuffer;
  try {
    buf = await loadPublicBuffer(pathNorm);
  } catch (e) {
    console.warn("[ambient] failed to load public", pathNorm, e);
    return;
  }

  const startT = ctx.currentTime;
  stopCurrent(startT);

  const source = ctx.createBufferSource();
  source.buffer = buf;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0;
  source.connect(gain);
  gain.connect(state.master!);

  source.start(startT + 0.02);
  const userVol = getPublicAmbientVolume(pathNorm);
  const targetGain = publicTrackTargetGain(userVol);
  gain.gain.linearRampToValueAtTime(targetGain, startT + 0.02 + fade);

  state.current = { mode: "public", path: pathNorm, source, gain };
}

export async function unlockAmbientAudio() {
  const ctx = ensureCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") await ctx.resume();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  g.gain.value = 0.0001;
  osc.connect(g);
  g.connect(state.master!);
  osc.start();
  osc.stop(ctx.currentTime + 0.02);
  state.unlocked = true;
}

function stopCurrent(atTime: number) {
  const cur = state.current;
  if (!cur) return;
  try {
    const release = 0.2;
    cur.gain.gain.setTargetAtTime(0, atTime, release);
    cur.source.stop(atTime + release + 0.1);
  } catch { /* already stopped */ }
}

export async function playAmbient(key: AmbientKey, opts?: { fadeMs?: number }) {
  const ctx = ensureCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* política del navegador */
    }
  }
  if (ctx.state === "suspended") return;
  const defaultFade = key === "universo" ? 2200 : 250;
  const fade = (opts?.fadeMs ?? defaultFade) / 1000;

  let buf: AudioBuffer;
  try {
    buf = await loadBuffer(key);
  } catch (e) {
    console.warn("[ambient] failed to load", key, e);
    return;
  }

  const startT = ctx.currentTime;
  stopCurrent(startT);

  const source = ctx.createBufferSource();
  source.buffer = buf;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0;
  source.connect(gain);
  gain.connect(state.master!);

  source.start(startT + 0.02);
  const userVol = getAmbientTrackVolume(key);
  const targetGain = TRACK_GAIN_NOMINAL * userVol;
  gain.gain.linearRampToValueAtTime(targetGain, startT + 0.02 + fade);

  state.current = { mode: "preset", key, source, gain };
}

export function stopAmbient() {
  if (!state.ctx) return;
  stopCurrent(state.ctx.currentTime);
  state.current = null;
}

export function setAmbientEnabled(enabled: boolean) {
  if (!state.master || !state.ctx) return;
  const ramp = enabled ? 0.08 : 0.15;
  state.master.gain.setTargetAtTime(enabled ? AMBIENT_MASTER_VOL : 0.0, state.ctx.currentTime, ramp);
}

export function duckAmbient(duck: boolean) {
  if (!state.master || !state.ctx) return;
  state.master.gain.setTargetAtTime(duck ? 0.15 : AMBIENT_MASTER_VOL, state.ctx.currentTime, 0.08);
}

export function getAmbientUnlocked() {
  return state.unlocked;
}

export function getCurrentKey(): AmbientKey | null {
  return state.current?.mode === "preset" ? state.current.key : null;
}

export function getAudioContext(): AudioContext | null {
  return state.ctx;
}

/** Hay una pista en reproducción y el contexto está en ejecución (evita reiniciar en cada clic en #mapa). */
export function hasActiveAmbientPlayback(): boolean {
  return state.current != null && state.ctx != null && state.ctx.state === "running";
}

/** Cambia el volumen base del ambient de forma suave (para la atmósfera temporal). */
export function setAmbientBaseVolume(targetVol: number, durationMs = 3000) {
  ambientBaseVolume = Math.max(0, Math.min(1, targetVol));
  if (!state.master || !state.ctx) return;
  const ctx = state.ctx;
  const now = ctx.currentTime;
  state.master.gain.cancelScheduledValues(now);
  state.master.gain.setValueAtTime(state.master.gain.value, now);
  state.master.gain.linearRampToValueAtTime(
    ambientBaseVolume * AMBIENT_MASTER_VOL,
    now + durationMs / 1000
  );
}

// ── Capa generativa sobre el ambient ────────────────────────────────────────

let generativeNodes: OscillatorNode[] = [];
let generativeGain: GainNode | null = null;

/**
 * Inicia osciladores suaves que varían en tiempo real.
 * Se llama DESPUÉS de que el ambient base ya está corriendo.
 * @param hour Hora del día (0–23) para variar los parámetros
 * @param storyCount Número de historias activas en el mapa
 */
export function startGenerativeLayer(hour: number, storyCount: number) {
  const ctx = getAudioContext();
  if (!ctx || generativeNodes.length > 0) return;

  generativeGain = ctx.createGain();
  generativeGain.gain.value = 0;
  generativeGain.connect(ctx.destination);

  generativeGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 4);

  const baseFreq = 40 + (hour / 24) * 20;
  const spread = Math.min(storyCount * 2, 30);

  const freqs = [baseFreq, baseFreq * 1.5, baseFreq * 2.0];

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq + i * spread * 0.1;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05 + i * 0.02;
    lfoGain.gain.value = freq * 0.008;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.value = 0.15 / (i + 1);
    osc.connect(gain);
    gain.connect(generativeGain!);

    lfo.start();
    osc.start();
    generativeNodes.push(osc);
    generativeNodes.push(lfo);
  });
}

export function stopGenerativeLayer() {
  const ctx = getAudioContext();
  if (!ctx || !generativeGain) return;

  generativeGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
  setTimeout(() => {
    generativeNodes.forEach((n) => {
      try {
        n.stop();
      } catch {}
    });
    generativeNodes = [];
    generativeGain = null;
  }, 2100);
}
