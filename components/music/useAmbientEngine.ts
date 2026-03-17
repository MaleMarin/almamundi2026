"use client";

import { useRef, useState } from "react";
import type { SoundMood, StoryMeta } from "@/lib/map-data/story-meta";

export type { SoundMood };

export function useAmbientEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- audio node graph is dynamic
  const nodesRef = useRef<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const lastGainRef = useRef(0.25);
  const savedPreDuckRef = useRef(0.45);
  const mouseRef = useRef({ xNorm: 0.5, yNorm: 0.5, speedNorm: 0 });

  async function start(mood: SoundMood) {
    if (isRunning) return;

    const ctx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    ctxRef.current = ctx;

    // Asegurar AudioContext: resume si está suspendido (gesto de usuario); si falla, el caller muestra "Activar sonido"
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (e) {
        ctxRef.current = null;
        throw e;
      }
    }

    const now = ctx.currentTime;

    // Start cue: whoosh 0.2s (noise + bandpass barrido) para confirmación clara al usuario
    const whooshDuration = 0.2;
    const whooshBufferSize = Math.ceil(ctx.sampleRate * whooshDuration);
    const whooshBuffer = ctx.createBuffer(1, whooshBufferSize, ctx.sampleRate);
    const whooshData = whooshBuffer.getChannelData(0);
    for (let i = 0; i < whooshBufferSize; i++) whooshData[i] = (Math.sin(i * 7.1) * Math.cos(i * 13.3) * 2 - 1) * 0.6;
    const whooshSource = ctx.createBufferSource();
    whooshSource.buffer = whooshBuffer;
    const whooshBp = ctx.createBiquadFilter();
    whooshBp.type = "bandpass";
    whooshBp.Q.value = 1.2;
    whooshBp.frequency.setValueAtTime(200, now);
    whooshBp.frequency.linearRampToValueAtTime(2400, now + whooshDuration);
    const whooshGain = ctx.createGain();
    whooshGain.gain.setValueAtTime(0.28, now);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + whooshDuration);
    whooshSource.connect(whooshBp);
    whooshBp.connect(whooshGain);
    whooshGain.connect(ctx.destination);
    whooshSource.start(now);
    whooshSource.stop(now + whooshDuration);

    // Master: volumen más alto; ramp suave 0.4s después del whoosh para evitar golpe
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(0.0001, now + whooshDuration);
    master.gain.linearRampToValueAtTime(0.52, now + whooshDuration + 0.4);

    // --- Cadena continua (drone + noise -> lp -> master); niveles más audibles ---
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    lp.Q.value = 0.8;

    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 55;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.08;
    drone.connect(droneGain);
    droneGain.connect(lp);

    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.sin(i * 5.7) * Math.cos(i * 11.3) * 2 - 1) * 0.5;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.065;
    noise.connect(noiseGain);
    noiseGain.connect(lp);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);

    lp.connect(master);

    // Arrancar fuentes continuas (no llamar stop() hasta stop() del engine)
    drone.start();
    noise.start();
    lfo.start();

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 420;
    bp.Q.value = 0.9;

    const delay = ctx.createDelay(2.0);
    delay.delayTime.value = 0.22;
    const fb = ctx.createGain();
    fb.gain.value = 0.22;
    delay.connect(fb);
    fb.connect(delay);

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = 110;

    const mix = ctx.createGain();
    mix.gain.value = 1;

    let osc3: OscillatorNode | undefined;
    let osc3Gain: GainNode | undefined;
    let rainIntervalId: ReturnType<typeof setInterval> | undefined;
    let swellIntervalId: ReturnType<typeof setInterval> | undefined;
    let bosqueChirpIntervalId: ReturnType<typeof setInterval> | undefined;
    let rainGain: GainNode | undefined;

    // Pulso sutil: modula mix/master. speedNorm incrementa el pulso ~600ms (decay).
    const pulseOsc = ctx.createOscillator();
    pulseOsc.type = "sine";
    pulseOsc.frequency.value = 0.4;
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0.02;
    pulseOsc.connect(pulseGain);
    pulseGain.connect(master);

    if (mood === "mar") {
      // Mar: noise -> lowpass 350–900 Hz con LFO lento + swell (gain sube/baja lento)
      lp.frequency.value = 625;
      lfoGain.gain.value = 275;
      lfo.frequency.value = 0.04;
      noiseGain.gain.value = 0.07;
      droneGain.gain.value = 0.08;
      osc1.frequency.value = 52;
      osc2.frequency.value = 104;
      osc1.connect(lp);
      osc2.connect(lp);
      noise.connect(noiseGain);
      noiseGain.connect(lp);
      lp.connect(delay);
      delay.connect(mix);
      lp.connect(mix);
      fb.gain.value = 0.18;
      delay.delayTime.value = 0.24;
      swellIntervalId = setInterval(() => {
        const n = nodesRef.current;
        if (!n?.master) return;
        const t = n.ctx?.currentTime ?? 0;
        const swell = 0.28 + 0.06 * Math.sin(Date.now() / 4200);
        n.master.gain.setTargetAtTime(swell, t, 0.8);
      }, 120);
    } else if (mood === "ciudad") {
      // Ciudad: lluvia — noise -> bandpass 800–1400 Hz + modulación aleatoria rápida del gain (50–120 ms)
      const hpCity = ctx.createBiquadFilter();
      hpCity.type = "highpass";
      hpCity.frequency.value = 180;
      hpCity.Q.value = 0.6;
      const bpRain = ctx.createBiquadFilter();
      bpRain.type = "bandpass";
      bpRain.frequency.value = 1100;
      bpRain.Q.value = 1.4;
      rainGain = ctx.createGain();
      rainGain.gain.value = 0.06;
      noise.connect(hpCity);
      hpCity.connect(bpRain);
      bpRain.connect(rainGain);
      rainGain.connect(delay);
      rainGain.connect(mix);
      osc1.frequency.value = 88;
      osc2.frequency.value = 176;
      noiseGain.gain.value = 0.02;
      osc1.connect(bp);
      osc2.connect(bp);
      bp.frequency.value = 600;
      bp.Q.value = 0.8;
      bp.connect(delay);
      delay.connect(mix);
      bp.connect(mix);
      lfo.frequency.value = 0.1;
      lfoGain.gain.value = 180;
      lp.frequency.value = 1400;
      lp.connect(mix);
      fb.gain.value = 0.2;
      let rainTick = 0;
      rainIntervalId = setInterval(() => {
        const n = nodesRef.current;
        if (!n?.ctx || !(n as { rainGain?: GainNode }).rainGain) return;
        const t = n.ctx.currentTime;
        rainTick += 1;
        const target = 0.025 + (rainTick % 9) * 0.009;
        (n as { rainGain: GainNode }).rainGain.gain.setTargetAtTime(target, t, 0.04);
      }, 85);
    } else if (mood === "bosque") {
      // Bosque: ruido suave + gotas aleatorias (chirps muy bajos) + lowpass más abierto
      lp.frequency.value = 2200;
      lp.Q.value = 0.6;
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = 300;
      droneGain.gain.value = 0.03;
      noiseGain.gain.value = 0.065;
      osc1.frequency.value = 72;
      osc2.frequency.value = 144;
      osc1.connect(mix);
      osc2.connect(mix);
      noise.connect(noiseGain);
      noiseGain.connect(lp);
      lp.connect(mix);
      fb.gain.value = 0.1;
      let bosqueTick = 0;
      bosqueChirpIntervalId = setInterval(() => {
        const n = nodesRef.current;
        if (!n?.ctx || !n.mix) return;
        bosqueTick += 1;
        const ctx = n.ctx;
        const mixNode = n.mix;
        const chirp = ctx.createOscillator();
        const chirpG = ctx.createGain();
        chirp.type = "sine";
        chirp.frequency.value = 320 + (bosqueTick % 200);
        chirpG.gain.setValueAtTime(0.028, ctx.currentTime);
        chirpG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
        chirp.connect(chirpG);
        chirpG.connect(mixNode);
        chirp.start(ctx.currentTime);
        chirp.stop(ctx.currentTime + 0.08);
      }, 2900);
    } else if (mood === "animales") {
      // Animales: insectos/chirps 2–4 kHz muy sutiles + fondo selva (noise filtrado)
      osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.value = 2800;
      osc3Gain = ctx.createGain();
      osc3Gain.gain.value = 0.014;
      osc3.connect(osc3Gain);
      osc3Gain.connect(lp);
      lp.frequency.value = 1000;
      lp.Q.value = 0.7;
      noiseGain.gain.value = 0.055;
      osc1.frequency.value = 65;
      osc2.frequency.value = 130;
      osc1.connect(lp);
      osc2.connect(lp);
      noise.connect(noiseGain);
      noiseGain.connect(lp);
      lp.connect(delay);
      delay.connect(mix);
      lp.connect(mix);
      fb.gain.value = 0.14;
      lfo.frequency.value = 0.06;
      osc3.start();
    } else if (mood === "universo") {
      // Universo: drone profundo 30–60 Hz + shimmer 600–1200 Hz muy tenue + más delay
      drone.frequency.value = 42;
      droneGain.gain.value = 0.1;
      osc1.frequency.value = 38;
      osc2.frequency.value = 880;
      const shimmerGain = ctx.createGain();
      shimmerGain.gain.value = 0.022;
      osc2.connect(shimmerGain);
      shimmerGain.connect(lp);
      noiseGain.gain.value = 0.04;
      lp.frequency.value = 480;
      lp.Q.value = 0.6;
      lfo.frequency.value = 0.03;
      lfoGain.gain.value = 150;
      delay.delayTime.value = 0.36;
      fb.gain.value = 0.38;
      noise.connect(noiseGain);
      noiseGain.connect(lp);
      osc1.connect(lp);
      lp.connect(delay);
      delay.connect(mix);
      lp.connect(mix);
    } else if (mood === "radio" || mood === "lluvia" || mood === "mercado") {
      // Radio, lluvia, mercado: capa generativa muy sutil; el sonido principal viene del buffer (ambient.ts)
      droneGain.gain.value = 0.03;
      noiseGain.gain.value = 0.018;
      osc1.frequency.value = 88;
      osc2.frequency.value = 176;
      lp.frequency.value = 1000;
      lp.Q.value = 0.7;
      lfo.frequency.value = 0.06;
      lfoGain.gain.value = 120;
      fb.gain.value = 0.12;
      noise.connect(noiseGain);
      noiseGain.connect(lp);
      osc1.connect(lp);
      osc2.connect(lp);
      lp.connect(delay);
      delay.connect(mix);
      lp.connect(mix);
    } else {
      // personas: cálido midrange 120–240 Hz + menos noise + filtro suave (íntimo)
      droneGain.gain.value = 0.02;
      noiseGain.gain.value = 0.028;
      const noiseGainPersonas = ctx.createGain();
      noiseGainPersonas.gain.value = 0.055;
      noise.connect(noiseGainPersonas);
      noiseGainPersonas.connect(bp);
      osc1.frequency.value = 120;
      osc2.frequency.value = 240;
      bp.frequency.value = 200;
      bp.Q.value = 0.9;
      fb.gain.value = 0.18;
      osc1.connect(bp);
      osc2.connect(bp);
      bp.connect(delay);
      delay.connect(mix);
      bp.connect(mix);
      lp.frequency.value = 600;
      lp.Q.value = 0.65;
      lp.connect(mix);
    }

    // Asegurar que la mezcla llega al master (todos los moods)
    mix.connect(master);

    noise.start();
    osc1.start();
    osc2.start();
    lfo.start();
    pulseOsc.start();

    nodesRef.current = {
      ctx,
      master,
      drone,
      droneGain,
      noise,
      noiseGain,
      noiseBuffer,
      osc1,
      osc2,
      lp,
      bp,
      delay,
      fb,
      lfo,
      lfoGain,
      mix,
      pulseOsc,
      pulseGain,
      mood,
      ...(osc3 ? { osc3 } : {}),
      ...(osc3Gain !== undefined ? { osc3Gain } : {}),
      ...(rainIntervalId !== undefined ? { __rainIntervalId: rainIntervalId, rainGain } : {}),
      ...(swellIntervalId !== undefined ? { __swellIntervalId: swellIntervalId } : {}),
      ...(bosqueChirpIntervalId !== undefined ? { __bosqueChirpIntervalId: bosqueChirpIntervalId } : {}),
    };
    lastGainRef.current = 0.52;
    setIsRunning(true);
    setIsPaused(false);
    setMood(mood);
    console.log("AMBIENT: started", ctx.state);
  }

  function setMood(mood: SoundMood) {
    console.log("AUDIO mood", mood);
    const n = nodesRef.current;
    if (!n) return;
    n.mood = mood;
    const t = n.ctx?.currentTime ?? 0;
    const ramp = 0.08;
    if (mood === "mar") {
      n.lp.frequency.setTargetAtTime(625, t, ramp);
      n.lp.Q.setTargetAtTime(0.8, t, ramp);
      n.drone.frequency.setTargetAtTime(52, t, ramp);
      n.droneGain.gain.setTargetAtTime(0.06, t, ramp);
      n.noiseGain.gain.setTargetAtTime(0.07, t, ramp);
      n.osc1.frequency.setTargetAtTime(52, t, ramp);
      n.osc2.frequency.setTargetAtTime(104, t, ramp);
      n.lfo.frequency.setTargetAtTime(0.04, t, ramp);
      n.lfoGain.gain.setTargetAtTime(275, t, ramp);
      n.fb.gain.setTargetAtTime(0.18, t, ramp);
      n.delay.delayTime.setTargetAtTime(0.24, t, ramp);
      if (n.bp) { n.bp.frequency.setTargetAtTime(420, t, ramp); n.bp.Q.setTargetAtTime(0.9, t, ramp); }
      if (n.osc3Gain) n.osc3Gain.gain.setTargetAtTime(0, t, ramp);
    } else if (mood === "ciudad") {
      n.lp.frequency.setTargetAtTime(1400, t, ramp);
      n.lp.Q.setTargetAtTime(0.8, t, ramp);
      n.drone.frequency.setTargetAtTime(55, t, ramp);
      n.droneGain.gain.setTargetAtTime(0.08, t, ramp);
      n.noiseGain.gain.setTargetAtTime(0.02, t, ramp);
      n.osc1.frequency.setTargetAtTime(88, t, ramp);
      n.osc2.frequency.setTargetAtTime(176, t, ramp);
      n.lfo.frequency.setTargetAtTime(0.1, t, ramp);
      n.lfoGain.gain.setTargetAtTime(180, t, ramp);
      n.fb.gain.setTargetAtTime(0.2, t, ramp);
      n.delay.delayTime.setTargetAtTime(0.22, t, ramp);
      if (n.bp) { n.bp.frequency.setTargetAtTime(600, t, ramp); n.bp.Q.setTargetAtTime(0.8, t, ramp); }
      if (n.osc3Gain) n.osc3Gain.gain.setTargetAtTime(0, t, ramp);
    } else if (mood === "bosque") {
      n.lp.frequency.setTargetAtTime(2200, t, ramp);
      n.lp.Q.setTargetAtTime(0.6, t, ramp);
      n.drone.frequency.setTargetAtTime(55, t, ramp);
      n.droneGain.gain.setTargetAtTime(0.03, t, ramp);
      n.noiseGain.gain.setTargetAtTime(0.065, t, ramp);
      n.osc1.frequency.setTargetAtTime(72, t, ramp);
      n.osc2.frequency.setTargetAtTime(144, t, ramp);
      n.lfo.frequency.setTargetAtTime(0.07, t, ramp);
      n.lfoGain.gain.setTargetAtTime(300, t, ramp);
      n.fb.gain.setTargetAtTime(0.1, t, ramp);
      n.delay.delayTime.setTargetAtTime(0.22, t, ramp);
      if (n.bp) { n.bp.frequency.setTargetAtTime(420, t, ramp); n.bp.Q.setTargetAtTime(0.9, t, ramp); }
      if (n.osc3Gain) n.osc3Gain.gain.setTargetAtTime(0, t, ramp);
    } else if (mood === "animales") {
      n.lp.frequency.setTargetAtTime(1000, t, ramp);
      n.lp.Q.setTargetAtTime(0.7, t, ramp);
      n.drone.frequency.setTargetAtTime(55, t, ramp);
      n.droneGain.gain.setTargetAtTime(0.08, t, ramp);
      n.noiseGain.gain.setTargetAtTime(0.055, t, ramp);
      n.osc1.frequency.setTargetAtTime(65, t, ramp);
      n.osc2.frequency.setTargetAtTime(130, t, ramp);
      n.lfo.frequency.setTargetAtTime(0.06, t, ramp);
      n.lfoGain.gain.setTargetAtTime(250, t, ramp);
      n.fb.gain.setTargetAtTime(0.14, t, ramp);
      n.delay.delayTime.setTargetAtTime(0.22, t, ramp);
      if (n.bp) { n.bp.frequency.setTargetAtTime(420, t, ramp); n.bp.Q.setTargetAtTime(0.9, t, ramp); }
      if (n.osc3Gain) n.osc3Gain.gain.setTargetAtTime(0.014, t, ramp);
    } else if (mood === "universo") {
      n.lp.frequency.setTargetAtTime(480, t, ramp);
      n.lp.Q.setTargetAtTime(0.6, t, ramp);
      n.drone.frequency.setTargetAtTime(42, t, ramp);
      n.droneGain.gain.setTargetAtTime(0.1, t, ramp);
      n.noiseGain.gain.setTargetAtTime(0.04, t, ramp);
      n.osc1.frequency.setTargetAtTime(38, t, ramp);
      n.osc2.frequency.setTargetAtTime(880, t, ramp);
      n.lfo.frequency.setTargetAtTime(0.03, t, ramp);
      n.lfoGain.gain.setTargetAtTime(150, t, ramp);
      n.fb.gain.setTargetAtTime(0.38, t, ramp);
      n.delay.delayTime.setTargetAtTime(0.36, t, ramp);
      if (n.bp) { n.bp.frequency.setTargetAtTime(420, t, ramp); n.bp.Q.setTargetAtTime(0.9, t, ramp); }
      if (n.osc3Gain) n.osc3Gain.gain.setTargetAtTime(0, t, ramp);
    } else if (mood === "radio" || mood === "lluvia" || mood === "mercado") {
      // Radios comunitarias, lluvia, mercados: perfil similar a ciudad (el audio principal viene del buffer en ambient.ts)
      n.lp.frequency.setTargetAtTime(1200, t, ramp);
      n.lp.Q.setTargetAtTime(0.75, t, ramp);
      n.drone.frequency.setTargetAtTime(55, t, ramp);
      n.droneGain.gain.setTargetAtTime(0.04, t, ramp);
      n.noiseGain.gain.setTargetAtTime(0.02, t, ramp);
      n.osc1.frequency.setTargetAtTime(88, t, ramp);
      n.osc2.frequency.setTargetAtTime(176, t, ramp);
      n.lfo.frequency.setTargetAtTime(0.08, t, ramp);
      n.lfoGain.gain.setTargetAtTime(180, t, ramp);
      n.fb.gain.setTargetAtTime(0.15, t, ramp);
      n.delay.delayTime.setTargetAtTime(0.22, t, ramp);
      if (n.bp) { n.bp.frequency.setTargetAtTime(500, t, ramp); n.bp.Q.setTargetAtTime(0.8, t, ramp); }
      if (n.osc3Gain) n.osc3Gain.gain.setTargetAtTime(0, t, ramp);
    } else {
      // personas
      n.lp.frequency.setTargetAtTime(600, t, ramp);
      n.lp.Q.setTargetAtTime(0.65, t, ramp);
      n.drone.frequency.setTargetAtTime(55, t, ramp);
      n.droneGain.gain.setTargetAtTime(0.02, t, ramp);
      n.noiseGain.gain.setTargetAtTime(0.028, t, ramp);
      n.osc1.frequency.setTargetAtTime(120, t, ramp);
      n.osc2.frequency.setTargetAtTime(240, t, ramp);
      n.lfo.frequency.setTargetAtTime(0.05, t, ramp);
      n.lfoGain.gain.setTargetAtTime(250, t, ramp);
      n.fb.gain.setTargetAtTime(0.18, t, ramp);
      n.delay.delayTime.setTargetAtTime(0.22, t, ramp);
      if (n.bp) { n.bp.frequency.setTargetAtTime(200, t, ramp); n.bp.Q.setTargetAtTime(0.9, t, ramp); }
      if (n.osc3Gain) n.osc3Gain.gain.setTargetAtTime(0, t, ramp);
    }
  }

  async function stop() {
    const n = nodesRef.current;
    if (!n) {
      nodesRef.current = null;
      ctxRef.current = null;
      setIsRunning(false);
      setIsPaused(false);
      return;
    }

    // 0) Cortar el sonido INMEDIATAMENTE (antes de cualquier otra cosa)
    try {
      if (n.master) {
        n.master.gain.cancelScheduledValues(0);
        n.master.gain.setValueAtTime(0, 0);
      }
    } catch {}

    // 1) Detener todos los intervalos (lluvia, swell, chirps bosque)
    try {
      const rainId = (n as { __rainIntervalId?: ReturnType<typeof setInterval> }).__rainIntervalId;
      if (rainId !== undefined) clearInterval(rainId);
    } catch {}
    try {
      const swellId = (n as { __swellIntervalId?: ReturnType<typeof setInterval> }).__swellIntervalId;
      if (swellId !== undefined) clearInterval(swellId);
    } catch {}
    try {
      const bosqueId = (n as { __bosqueChirpIntervalId?: ReturnType<typeof setInterval> }).__bosqueChirpIntervalId;
      if (bosqueId !== undefined) clearInterval(bosqueId);
    } catch {}

    // 2) Detener TODAS las fuentes (osc/noise/lfo) con try/catch para que un fallo no bloquee el resto
    const sources: (AudioScheduledSourceNode | undefined)[] = [
      n.drone,
      n.noise,
      n.osc1,
      n.osc2,
      n.osc3,
      n.lfo,
      n.pulseOsc,
    ];
    for (const src of sources) {
      try {
        if (src && typeof (src as AudioScheduledSourceNode).stop === "function") {
          (src as AudioScheduledSourceNode).stop();
        }
      } catch {}
    }

    // 3) Desconectar master del destination (corta el audio de inmediato)
    try {
      if (n.master && typeof n.master.disconnect === "function") {
        n.master.disconnect();
      }
    } catch {}

    // 4) Cerrar AudioContext si existe
    const ctx = n.ctx ?? ctxRef.current;
    try {
      if (ctx && typeof ctx.close === "function") {
        await ctx.close();
      }
    } catch {}

    // 5) Limpiar refs y estado
    nodesRef.current = null;
    ctxRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    console.log("AMBIENT: stopped");
  }

  function pause() {
    const n = nodesRef.current;
    if (!n?.master) return;
    lastGainRef.current = n.master.gain.value;
    n.master.gain.setTargetAtTime(0, 0, 0.05);
    setIsPaused(true);
  }

  function resume() {
    const n = nodesRef.current;
    if (!n?.master) return;
    const target = lastGainRef.current > 0 ? lastGainRef.current : 0.45;
    lastGainRef.current = target;
    n.master.gain.setTargetAtTime(target, 0, 0.1); // fade-in ~400ms
    setIsPaused(false);
  }

  /** Baja el volumen a level (ej. 0.2) sin pausar; para no tapar audio/video de una historia. */
  function duck(level: number) {
    const n = nodesRef.current;
    if (!n?.master) return;
    const l = Math.max(0, Math.min(1, level));
    savedPreDuckRef.current = n.master.gain.value;
    n.master.gain.setTargetAtTime(l, 0, 0.05);
  }

  /** Restaura el volumen anterior tras duck (p. ej. al cerrar una historia). */
  function restore() {
    const n = nodesRef.current;
    if (!n?.master) return;
    n.master.gain.setTargetAtTime(savedPreDuckRef.current, 0, 0.08);
  }

  function setIntensity(v: number) {
    const n = nodesRef.current;
    if (!n) return;
    const x = Math.max(0, Math.min(1, v));
    lastGainRef.current = 0.30 + x * 0.50;
    if (!isPaused) n.master.gain.setTargetAtTime(lastGainRef.current, 0, 0.05);
    n.lp.frequency.setTargetAtTime(450 + x * 1800, 0, 0.05);
  }

  function setPosition(lat: number, lng: number) {
    const n = nodesRef.current;
    if (!n) return;
    const normLng = ((lng + 180) % 360) / 360;
    const target = 400 + normLng * 1800;
    n.lp.frequency.setTargetAtTime(Math.max(250, Math.min(2400, target)), 0, 0.1);
  }

  function setMouse(xNorm: number, yNorm: number, speedNorm: number) {
    mouseRef.current = {
      xNorm: Math.max(0, Math.min(1, xNorm)),
      yNorm: Math.max(0, Math.min(1, yNorm)),
      speedNorm: Math.max(0, Math.min(1, speedNorm)),
    };
    const n = nodesRef.current;
    if (!n) return;
    const { xNorm: x, yNorm: y, speedNorm: s } = mouseRef.current;
    const baseGain = 0.28 + y * 0.55;
    lastGainRef.current = baseGain;
    if (!isPaused) n.master.gain.setTargetAtTime(baseGain, 0, 0.05);
    const freq = 300 + x * 2000;
    n.lp.frequency.setTargetAtTime(Math.max(200, Math.min(2400, freq)), 0, 0.05);
    // speedNorm incrementa el pulso; decay ~600ms
    if (n.pulseGain && n.ctx) {
      n.pulseGain.gain.cancelScheduledValues(0);
      n.pulseGain.gain.value = 0.02 + Math.min(1, s) * 0.05;
      n.pulseGain.gain.setTargetAtTime(0.02, n.ctx.currentTime + 0.6, 0.25);
    }
  }

  function setStoryContext(_story: StoryMeta, selectedMood: SoundMood) {
    const n = nodesRef.current;
    if (!n || n.mood !== selectedMood) return;
    setPosition(_story.lat, _story.lng);
    const intensityNorm = (_story.intensity - 1) / 4;
    setIntensity(intensityNorm);
  }

  /** z 0..1: 0 = zoom in (cerca), 1 = zoom out (más aire/brillo y espacio). */
  function setZoom(z: number) {
    const n = nodesRef.current;
    if (!n) return;
    const x = Math.max(0, Math.min(1, z));
    // zoom out => más brillo y más espacio
    const cutoff = 500 + x * 2600;
    n.lp.frequency.value = cutoff;
    n.fb.gain.value = 0.12 + x * 0.22; // más "espacio" al alejar
    n.master.gain.value = 0.38 + (1 - x) * 0.28; // volumen más alto; un poco más íntimo al acercar
  }

  return {
    start,
    stop,
    pause,
    resume,
    duck,
    restore,
    setMood,
    setIntensity,
    setPosition,
    setMouse,
    setStoryContext,
    setZoom,
    isRunning,
    isPaused,
  };
}
