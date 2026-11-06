'use client';

/**
 * Globo elástico como gelatina (Ana, 6 nov 2026): al arrastrarlo se estira hacia donde se mueve,
 * más mientras más rápido; al soltarlo vuelve a ser redondo con un rebote suave.
 * El estiramiento se aplica en el plano de la pantalla (sigue a la cámara), así siempre se ve
 * en la dirección del dedo o del mouse. Con «reducir movimiento» no hace nada.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type * as THREE from 'three';

const ESTIRA_MAX = 0.11; // 11 % como máximo
const SENSIBILIDAD = 0.05; // por cada px/ms de velocidad
const RIGIDEZ = 140; // resorte
const ROCE = 7; // menos roce = más rebote

export function GlobeJelly({ children }: { children: ReactNode }) {
  const { camera, gl } = useThree();
  const haciaCamara = useRef<THREE.Group>(null);
  const giro = useRef<THREE.Group>(null);
  const escala = useRef<THREE.Group>(null);
  const desgiro = useRef<THREE.Group>(null);
  const desdeCamara = useRef<THREE.Group>(null);
  const st = useRef({ s: 0, v: 0, objetivo: 0, ang: 0, abajo: false, x: 0, y: 0, t: 0, quieto: false });

  useEffect(() => {
    try {
      st.current.quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      st.current.quieto = false;
    }
    const el = gl.domElement;
    const bajar = (e: PointerEvent) => {
      const s = st.current;
      s.abajo = true;
      s.x = e.clientX;
      s.y = e.clientY;
      s.t = performance.now();
    };
    const mover = (e: PointerEvent) => {
      const s = st.current;
      if (!s.abajo || s.quieto) return;
      const ahora = performance.now();
      const dt = Math.max(8, ahora - s.t);
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.5) s.ang = Math.atan2(-dy, dx);
      s.objetivo = Math.min(ESTIRA_MAX, (dist / dt) * SENSIBILIDAD);
      s.x = e.clientX;
      s.y = e.clientY;
      s.t = ahora;
    };
    const soltar = () => {
      st.current.abajo = false;
      st.current.objetivo = 0;
    };
    el.addEventListener('pointerdown', bajar);
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    return () => {
      el.removeEventListener('pointerdown', bajar);
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const s = st.current;
    if (s.quieto) return;
    const dt = Math.min(delta, 1 / 30);
    // Si el dedo queda quieto sin soltar, el estiramiento se relaja solo.
    if (s.abajo) s.objetivo *= 0.9;
    const a = -RIGIDEZ * (s.s - s.objetivo) - ROCE * s.v;
    s.v += a * dt;
    s.s += s.v * dt;
    if (Math.abs(s.s) < 0.0004 && Math.abs(s.v) < 0.0004 && s.objetivo === 0) {
      s.s = 0;
      s.v = 0;
    }
    const k = Math.max(-0.06, Math.min(ESTIRA_MAX, s.s));
    haciaCamara.current?.quaternion.copy(camera.quaternion);
    desdeCamara.current?.quaternion.copy(camera.quaternion).invert();
    if (giro.current) giro.current.rotation.z = s.ang;
    if (desgiro.current) desgiro.current.rotation.z = -s.ang;
    // Estira en la dirección del movimiento y adelgaza un poco en las otras (volumen parecido).
    escala.current?.scale.set(1 + k, 1 - k * 0.5, 1 - k * 0.5);
  });

  return (
    <group ref={haciaCamara}>
      <group ref={giro}>
        <group ref={escala}>
          <group ref={desgiro}>
            <group ref={desdeCamara}>{children}</group>
          </group>
        </group>
      </group>
    </group>
  );
}
