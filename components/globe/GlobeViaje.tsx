'use client';

/**
 * Tomar el mundo y moverlo por el universo (Ana, 6 nov 2026).
 * - Arrastrar hace las dos cosas: el mundo gira (para buscar continentes, como siempre) y además se desplaza
 *   hacia donde lo llevas, siguiendo al dedo con suavidad. Al soltarlo vuelve al centro con un rebote suave
 *   y conserva el giro que le diste. Un toque sigue abriendo historias.
 * - En celular, deslizar vertical baja la página. Con «reducir movimiento» vuelve sin rebote.
 */
import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const TOLERANCIA_PX = 7;
/** Seguir al dedo: suave, con un poco de retraso. */
const SIGUE_K = 34;
const SIGUE_C = 10;
/** Cuánto se desplaza respecto del arrastre (el resto es giro). */
const DESPLAZA = 0.45;
/** Volver al centro: elástico, con dos o tres rebotes que se apagan. */
const VUELVE_K = 20;
const VUELVE_C = 4.4;
/** Tamaño al tomarlo, con resorte (sobrepasa un poco y se acomoda). */
const POP_K = 160;
const POP_C = 13;
const INCLINA_MAX = 0.12;

declare global {
  interface Window {
    __almaGlobeTomado?: boolean;
  }
}

const CERO = new THREE.Vector3();
const EJE_Z = new THREE.Vector3(0, 0, 1);

export function GlobeViaje({
  children,
}: {
  children: ReactNode;
  /** Se mantiene por compatibilidad con quien lo usa. */
  radio?: number;
  /** Se mantiene por compatibilidad: el giro a mano lo sigue haciendo OrbitControls. */
  controlsRef?: RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, gl } = useThree();
  const grupo = useRef<THREE.Group>(null);
  const st = useRef({
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    meta: new THREE.Vector3(),
    tomado: false,
    abajo: false,
    tactil: false,
    x0: 0,
    y0: 0,
    x: 0,
    y: 0,
    escala: 1,
    escalaVel: 0,
    inclina: new THREE.Quaternion(),
    quieto: false,
    volviendo: false,
  });
  const tmp = useRef({ derecha: new THREE.Vector3(), arriba: new THREE.Vector3(), eje: new THREE.Vector3(), q: new THREE.Quaternion() });

  useEffect(() => {
    try {
      st.current.quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      st.current.quieto = false;
    }
    const el = gl.domElement;

    const mundoPorPixel = () => {
      const cam = camera as THREE.PerspectiveCamera;
      const dist = cam.position.distanceTo(st.current.pos);
      return (2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))) / Math.max(1, el.clientHeight);
    };

    const tomar = () => {
      const s = st.current;
      s.tomado = true;
      s.volviendo = false;
      window.__almaGlobeTomado = true;
      s.meta.copy(s.pos);
      if (!s.quieto) s.escalaVel += 0.6; // pequeño «pop»
      el.style.cursor = 'grabbing';
      el.style.touchAction = 'none';
      try {
        navigator.vibrate?.(10);
      } catch {
        /* sin vibración */
      }
    };

    const bajar = (e: PointerEvent) => {
      if (e.button !== undefined && e.button !== 0) return;
      const s = st.current;
      s.x0 = s.x = e.clientX;
      s.y0 = s.y = e.clientY;
      s.abajo = true;
      s.tactil = e.pointerType === 'touch';
    };

    const mover = (e: PointerEvent) => {
      const s = st.current;
      if (!s.tomado) {
        if (!s.abajo) return;
        const dx0 = e.clientX - s.x0;
        const dy0 = e.clientY - s.y0;
        if (Math.hypot(dx0, dy0) <= TOLERANCIA_PX) return;
        // En celular, deslizar hacia arriba o abajo es para bajar por la página.
        if (s.tactil && Math.abs(dy0) > Math.abs(dx0)) {
          s.abajo = false;
          return;
        }
        tomar();
      }
      const k = mundoPorPixel();
      const { derecha, arriba } = tmp.current;
      derecha.set(1, 0, 0).applyQuaternion(camera.quaternion);
      arriba.set(0, 1, 0).applyQuaternion(camera.quaternion);
      s.meta
        .addScaledVector(derecha, (e.clientX - s.x) * k * DESPLAZA)
        .addScaledVector(arriba, -(e.clientY - s.y) * k * DESPLAZA);
      s.x = e.clientX;
      s.y = e.clientY;
    };

    const soltar = () => {
      const s = st.current;
      s.abajo = false;
      if (!s.tomado) return;
      s.tomado = false;
      s.volviendo = true;
      el.style.cursor = '';
      el.style.touchAction = '';
      // Deja pasar este «soltar» sin abrir historias.
      setTimeout(() => {
        window.__almaGlobeTomado = false;
      }, 0);
    };

    const sinScroll = (e: TouchEvent) => {
      if (st.current.tomado) e.preventDefault();
    };
    const sinMenu = (e: Event) => {
      if (st.current.tomado) e.preventDefault();
    };

    el.addEventListener('pointerdown', bajar);
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    el.addEventListener('touchmove', sinScroll, { passive: false });
    el.addEventListener('contextmenu', sinMenu);
    return () => {
      el.removeEventListener('pointerdown', bajar);
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
      el.removeEventListener('touchmove', sinScroll);
      el.removeEventListener('contextmenu', sinMenu);
      window.__almaGlobeTomado = false;
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    const g = grupo.current;
    if (!g) return;
    const s = st.current;
    const dt = Math.min(delta, 1 / 30);


    // Posición con resorte: sigue al dedo, o vuelve al centro rebotando.
    const meta = s.tomado ? s.meta : CERO;
    const k = s.tomado ? SIGUE_K : VUELVE_K;
    const c = s.tomado ? SIGUE_C : s.quieto ? 2 * Math.sqrt(VUELVE_K) : VUELVE_C;
    if (s.tomado || s.volviendo) {
      const acel = meta.clone().sub(s.pos).multiplyScalar(k).addScaledVector(s.vel, -c);
      s.vel.addScaledVector(acel, dt);
      s.pos.addScaledVector(s.vel, dt);
    }

    if (s.volviendo) {
      if (s.pos.lengthSq() < 1e-6 && s.vel.lengthSq() < 1e-6) {
        s.pos.set(0, 0, 0);
        s.vel.set(0, 0, 0);
        s.volviendo = false;
      }
    }

    // Se inclina hacia donde va, como una pelota llevada en la mano.
    const { eje, q } = tmp.current;
    const rapidez = s.vel.length();
    if (!s.quieto && rapidez > 1e-4) {
      eje.copy(EJE_Z).applyQuaternion(camera.quaternion).cross(s.vel).normalize();
      q.setFromAxisAngle(eje, Math.min(INCLINA_MAX, rapidez * 0.06));
    } else {
      q.identity();
    }
    s.inclina.slerp(q, Math.min(1, dt * 8));

    // Tamaño con resorte: crece un poco al tomarlo, vuelve al soltarlo.
    const escalaMeta = s.tomado ? 1.04 : 1;
    const ae = (escalaMeta - s.escala) * POP_K - s.escalaVel * POP_C;
    s.escalaVel += ae * dt;
    s.escala += s.escalaVel * dt;

    g.position.copy(s.pos);
    g.quaternion.copy(s.inclina);
    g.scale.setScalar(s.escala);
  });

  return <group ref={grupo}>{children}</group>;
}
