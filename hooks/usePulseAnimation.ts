'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook que gestiona un "reloj de pulso" global compartido
 * por todos los puntos del globo.
 *
 * En vez de que cada punto tenga su propio requestAnimationFrame,
 * usamos un solo ticker global y cada punto se registra con su fase.
 * Esto es crítico para performance con 50 puntos.
 */

export type PulseTick = {
  time:    number;  // tiempo global en segundos
  delta:   number;  // delta desde el último tick
};

type TickCallback = (tick: PulseTick) => void;

const callbacks = new Set<TickCallback>();
let animFrameId = 0;
let lastTime    = 0;
let globalTime  = 0;

function startGlobalTicker() {
  if (animFrameId) return; // ya corriendo
  const tick = (now: number) => {
    const delta = Math.min((now - lastTime) / 1000, 0.1); // max 100ms de salto
    lastTime   = now;
    globalTime += delta;
    const t: PulseTick = { time: globalTime, delta };
    callbacks.forEach(cb => cb(t));
    animFrameId = requestAnimationFrame(tick);
  };
  lastTime    = performance.now();
  animFrameId = requestAnimationFrame(tick);
}

function stopGlobalTicker() {
  if (callbacks.size > 0) return; // aún hay listeners
  cancelAnimationFrame(animFrameId);
  animFrameId = 0;
}

export function usePulseAnimation(callback: TickCallback) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  const stableCallback = useCallback((tick: PulseTick) => {
    cbRef.current(tick);
  }, []);

  useEffect(() => {
    callbacks.add(stableCallback);
    startGlobalTicker();
    return () => {
      callbacks.delete(stableCallback);
      stopGlobalTicker();
    };
  }, [stableCallback]);
}

/** Calcula el factor de pulso para un punto dado su velocidad y fase offset. */
export function calcPulseFactor(time: number, speed: number, phaseOffset: number): number {
  // Onda sinusoidal suavizada: 0 → 1 → 0 (el anillo nace del centro y se expande)
  const raw = Math.sin((time * speed + phaseOffset) * Math.PI * 2);
  return Math.max(0, raw); // solo la mitad positiva del seno = pulso unidireccional
}
