'use client';

/**
 * Tomar el mundo y moverlo por el universo (Ana, 6 nov 2026).
 * - Arrastrar normal: gira, como siempre.
 * - Mantener presionado ~0,5 s sin mover: el globo se «levanta» (crece un poco) y se lleva a cualquier parte.
 * - Al soltar: sigue con el impulso, rebota suave en los bordes y después vuelve flotando al centro.
 * Mientras está tomado no se abren historias. Con «reducir movimiento» vuelve al centro sin viajar.
 */
import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const ESPERA_MS = 300;
const TOLERANCIA_PX = 7;
const ROCE = 1.6; // frena el viaje (por segundo)
const VUELTA_TRAS_S = 6; // segundos quieto antes de volver al centro
const VUELTA_RESORTE = 3.2;
const VUELTA_AMORTIGUA = 3.4;

declare global {
  interface Window {
    __almaGlobeTomado?: boolean;
  }
}

export function GlobeViaje({
  children,
  radio,
  controlsRef,
}: {
  children: ReactNode;
  /** Radio del globo en unidades del mundo (para no sacarlo entero de la vista). */
  radio: number;
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, gl, size } = useThree();
  const grupo = useRef<THREE.Group>(null);
  const st = useRef({
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    tomado: false,
    esperando: 0 as number | ReturnType<typeof setTimeout>,
    x0: 0,
    y0: 0,
    x: 0,
    y: 0,
    t: 0,
    soltadoHace: 99,
    alzado: 0,
    quieto: false,
    rotacionPrevia: true,
  });
  const derecha = useRef(new THREE.Vector3());
  const arriba = useRef(new THREE.Vector3());

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

    const cancelarEspera = () => {
      if (st.current.esperando) clearTimeout(st.current.esperando);
      st.current.esperando = 0;
    };

    const tomar = () => {
      const s = st.current;
      s.esperando = 0;
      s.tomado = true;
      window.__almaGlobeTomado = true;
      s.vel.set(0, 0, 0);
      const c = controlsRef.current;
      if (c) {
        s.rotacionPrevia = c.enableRotate;
        c.enableRotate = false;
      }
      el.style.cursor = 'grabbing';
      el.style.touchAction = 'none';
      try {
        navigator.vibrate?.(12);
      } catch {
        /* sin vibración */
      }
    };

    const bajar = (e: PointerEvent) => {
      if (e.button !== undefined && e.button !== 0) return;
      const s = st.current;
      s.x0 = s.x = e.clientX;
      s.y0 = s.y = e.clientY;
      s.t = performance.now();
      cancelarEspera();
      s.esperando = setTimeout(tomar, ESPERA_MS);
    };

    const mover = (e: PointerEvent) => {
      const s = st.current;
      if (!s.tomado) {
        if (s.esperando && Math.hypot(e.clientX - s.x0, e.clientY - s.y0) > TOLERANCIA_PX) cancelarEspera();
        return;
      }
      const ahora = performance.now();
      const dt = Math.max(0.008, (ahora - s.t) / 1000);
      const k = mundoPorPixel();
      const dx = (e.clientX - s.x) * k;
      const dy = -(e.clientY - s.y) * k;
      derecha.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
      arriba.current.set(0, 1, 0).applyQuaternion(camera.quaternion);
      const paso = new THREE.Vector3().addScaledVector(derecha.current, dx).addScaledVector(arriba.current, dy);
      s.pos.add(paso);
      // Velocidad suavizada para el lanzamiento.
      s.vel.lerp(paso.divideScalar(dt), 0.5);
      s.x = e.clientX;
      s.y = e.clientY;
      s.t = ahora;
    };

    const soltar = () => {
      const s = st.current;
      cancelarEspera();
      if (!s.tomado) return;
      s.tomado = false;
      s.soltadoHace = 0;
      if (s.quieto) s.vel.set(0, 0, 0);
      const c = controlsRef.current;
      if (c) c.enableRotate = s.rotacionPrevia;
      el.style.cursor = '';
      el.style.touchAction = '';
      // Deja pasar este «soltar» sin abrir historias y después vuelve a la normalidad.
      setTimeout(() => {
        window.__almaGlobeTomado = false;
      }, 0);
    };

    const sinScroll = (e: TouchEvent) => {
      if (st.current.tomado) e.preventDefault();
    };
    const sinMenu = (e: Event) => {
      if (st.current.tomado || st.current.esperando) e.preventDefault();
    };

    el.addEventListener('pointerdown', bajar);
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    el.addEventListener('touchmove', sinScroll, { passive: false });
    el.addEventListener('contextmenu', sinMenu);
    return () => {
      cancelarEspera();
      el.removeEventListener('pointerdown', bajar);
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
      el.removeEventListener('touchmove', sinScroll);
      el.removeEventListener('contextmenu', sinMenu);
      window.__almaGlobeTomado = false;
    };
  }, [camera, gl, controlsRef]);

  useFrame((_, delta) => {
    const g = grupo.current;
    if (!g) return;
    const s = st.current;
    const dt = Math.min(delta, 1 / 30);

    if (!s.tomado) {
      s.soltadoHace += dt;
      // Viaje con el impulso y roce.
      s.pos.addScaledVector(s.vel, dt);
      s.vel.multiplyScalar(Math.max(0, 1 - ROCE * dt));
      // Rebote suave en los bordes: el centro del globo puede llegar hasta el borde (esquinas incluidas).
      const cam = camera as THREE.PerspectiveCamera;
      const dist = cam.position.distanceTo(new THREE.Vector3());
      const alto = dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      const ancho = alto * (size.width / Math.max(1, size.height));
      derecha.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
      arriba.current.set(0, 1, 0).applyQuaternion(camera.quaternion);
      const px = s.pos.dot(derecha.current);
      const py = s.pos.dot(arriba.current);
      const limX = Math.max(radio * 0.5, ancho);
      const limY = Math.max(radio * 0.5, alto);
      if (Math.abs(px) > limX) {
        const vx = s.vel.dot(derecha.current);
        if (Math.sign(vx) === Math.sign(px)) s.vel.addScaledVector(derecha.current, -1.6 * vx);
        s.pos.addScaledVector(derecha.current, Math.sign(px) * limX - px);
      }
      if (Math.abs(py) > limY) {
        const vy = s.vel.dot(arriba.current);
        if (Math.sign(vy) === Math.sign(py)) s.vel.addScaledVector(arriba.current, -1.6 * vy);
        s.pos.addScaledVector(arriba.current, Math.sign(py) * limY - py);
      }
      // Después de un rato, vuelve flotando al centro (de inmediato si se pide menos movimiento).
      if (s.soltadoHace > (s.quieto ? 0 : VUELTA_TRAS_S) && s.pos.lengthSq() > 1e-8) {
        const a = s.pos.clone().multiplyScalar(-VUELTA_RESORTE).addScaledVector(s.vel, -VUELTA_AMORTIGUA);
        s.vel.addScaledVector(a, dt);
        if (s.quieto) {
          s.pos.set(0, 0, 0);
          s.vel.set(0, 0, 0);
        }
      }
      if (s.pos.lengthSq() < 1e-7 && s.vel.lengthSq() < 1e-7) {
        s.pos.set(0, 0, 0);
        s.vel.set(0, 0, 0);
      }
    }

    // «Levantado»: crece un poco mientras está tomado.
    s.alzado += ((s.tomado ? 1 : 0) - s.alzado) * Math.min(1, dt * 10);
    g.position.copy(s.pos);
    g.scale.setScalar(1 + 0.05 * s.alzado);
  });

  return <group ref={grupo}>{children}</group>;
}
