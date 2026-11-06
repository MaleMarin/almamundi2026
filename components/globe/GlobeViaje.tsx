'use client';

/**
 * Tomar el mundo y moverlo por el universo (Ana, 6 nov 2026).
 * - Arrastrar normal: gira, como siempre.
 * - Mantener presionado ~0,5 s sin mover: el globo se «levanta» (crece un poco) y se lleva a cualquier parte.
 * - Al soltar: vuelve suave a su posición inicial, al centro y con la vista de siempre (Ana, 6 nov 2026).
 * Mientras está tomado no se abren historias. Con «reducir movimiento» vuelve al centro sin viajar.
 */
import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const ESPERA_MS = 300;
const TOLERANCIA_PX = 7;

declare global {
  interface Window {
    __almaGlobeTomado?: boolean;
  }
}

const CERO = new THREE.Vector3();

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
  const { camera, gl } = useThree();
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
    volviendo: false,
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
      s.vel.set(0, 0, 0);
      s.volviendo = true;
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

    if (!s.tomado && s.volviendo) {
      // Vuelta suave (sin rebote) a la posición inicial: el globo al centro y la cámara a la vista de siempre.
      const f = s.quieto ? 1 : 1 - Math.exp(-dt * 4.5);
      s.pos.lerp(CERO, f);
      const c = controlsRef.current as (OrbitControlsImpl & { position0?: THREE.Vector3; target0?: THREE.Vector3 }) | null;
      let listo = s.pos.lengthSq() < 1e-6;
      if (c?.position0 && c.target0) {
        c.target.lerp(c.target0, f);
        // Gira la cámara por la esfera (sin acercarla ni alejarla) hacia su punto de partida.
        const r = camera.position.distanceTo(c.target);
        const desde = camera.position.clone().sub(c.target).normalize();
        const hasta = c.position0.clone().sub(c.target0).normalize();
        desde.lerp(hasta, f).normalize();
        camera.position.copy(c.target).addScaledVector(desde, THREE.MathUtils.lerp(r, c.position0.distanceTo(c.target0), f));
        c.update();
        listo = listo && desde.angleTo(hasta) < 0.002;
      }
      if (listo) {
        s.pos.set(0, 0, 0);
        s.volviendo = false;
      }
    }

    // «Levantado»: crece un poco mientras está tomado.
    s.alzado += ((s.tomado ? 1 : 0) - s.alzado) * Math.min(1, dt * 10);
    g.position.copy(s.pos);
    g.scale.setScalar(1 + 0.05 * s.alzado);
  });

  return <group ref={grupo}>{children}</group>;
}
