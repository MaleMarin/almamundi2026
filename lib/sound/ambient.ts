export type AmbientKey = "mar" | "ciudad" | "bosque" | "viento" | "animales" | "universo" | "personas";

type PlayerState = {
  ctx: AudioContext | null;
  master: GainNode | null;
  current: {
    key: AmbientKey;
    source: AudioBufferSourceNode | null;
    gain: GainNode | null;
  } | null;
  buffers: Partial<Record<AmbientKey, AudioBuffer>>;
  unlocked: boolean;
};

const state: PlayerState = {
  ctx: null,
  master: null,
  current: null,
  buffers: {},
  unlocked: false,
};

const URLS: Record<AmbientKey, string[]> = {
  mar: ["/audio/ambients/ocean.wav", "/audio/ambients/ocean.mp3", "/audio/mar.m4a"],
  ciudad: ["/audio/ambients/city.wav", "/audio/ambients/city.mp3"],
  bosque: ["/audio/ambients/forest.wav", "/audio/ambients/forest.mp3"],
  viento: ["/audio/ambients/wind.mp3", "/audio/ambients/wind.wav", "/audio/neblina.mp3"],
  animales: ["/audio/ambients/animals.wav", "/audio/ambients/animals.mp3"],
  universo: ["/audio/ambients/universe.mp3", "/universo.mp3", "/audio/ambients/universe.wav"],
  personas: ["/audio/ambients/people.wav", "/audio/ambients/people.mp3"],
};

const FALLBACK_URL = "/audio/mar.m4a";

/** Volumen base nominal del master. Más alto para que el sonido del universo se oiga bien. */
const AMBIENT_MASTER_VOL = 1.0;

/** Volumen base actual (0–1) para la atmósfera temporal. */
let ambientBaseVolume = 0.85;

function ensureCtx() {
  if (!state.ctx)
    state.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (!state.master) {
    state.master = state.ctx.createGain();
    state.master.gain.value = AMBIENT_MASTER_VOL;
    state.master.connect(state.ctx.destination);
  }
  return state.ctx;
}

async function loadBuffer(key: AmbientKey): Promise<AudioBuffer> {
  if (state.buffers[key]) return state.buffers[key]!;
  const ctx = ensureCtx();

  async function tryLoad(url: string): Promise<AudioBuffer> {
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

export async function unlockAmbientAudio() {
  const ctx = ensureCtx();
  if (ctx.state === "suspended") await ctx.resume();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  g.gain.value = 0.0001;
  osc.connect(g);
  g.connect(state.master!);
  osc.start();
  osc.stop(ctx.currentTime + 0.02);
  state.unlocked = true;
  return true;
}

function stopCurrent(atTime: number) {
  if (!state.current?.source || !state.current?.gain) return;
  const { source, gain } = state.current;
  try {
    gain.gain.setTargetAtTime(0, atTime, 0.05);
    source.stop(atTime + 0.15);
  } catch { /* already stopped */ }
}

export async function playAmbient(key: AmbientKey, opts?: { fadeMs?: number }) {
  const fade = (opts?.fadeMs ?? 250) / 1000;
  const ctx = ensureCtx();
  if (ctx.state === "suspended") await ctx.resume();

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
  gain.gain.linearRampToValueAtTime(1.0, startT + 0.02 + fade);

  state.current = { key, source, gain };
}

export function stopAmbient() {
  if (!state.ctx) return;
  stopCurrent(state.ctx.currentTime);
  state.current = null;
}

export function setAmbientEnabled(enabled: boolean) {
  if (!state.master || !state.ctx) return;
  state.master.gain.setTargetAtTime(enabled ? AMBIENT_MASTER_VOL : 0.0, state.ctx.currentTime, 0.05);
}

export function duckAmbient(duck: boolean) {
  if (!state.master || !state.ctx) return;
  state.master.gain.setTargetAtTime(duck ? 0.15 : AMBIENT_MASTER_VOL, state.ctx.currentTime, 0.08);
}

export function getAmbientUnlocked() {
  return state.unlocked;
}

export function getCurrentKey(): AmbientKey | null {
  return state.current?.key ?? null;
}

export function getAudioContext(): AudioContext | null {
  return state.ctx;
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
