'use client';

/**
 * Constelación de una pregunta (decisión de Ana, 4 nov 2026): al abrir una pregunta de las personas,
 * líneas curvas finas van desde la pregunta hasta los lugares de quienes respondieron.
 * Solo existen mientras la pregunta está abierta. Aparecen en ~1,2 s (sin animación si se reduce el movimiento).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { latLngToCartesianThreeJS } from '@/lib/globe-coords';
import { GLOBE_V2_BIT_SURFACE_RADIUS } from '@/lib/globe/globe-v2-assets';

export type GlobeArc = {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  color: string;
};

const PUNTOS = 64;
const DURACION_S = 1.2;

function vec(lat: number, lon: number, r: number): THREE.Vector3 {
  const p = latLngToCartesianThreeJS(lat, lon, r);
  return new THREE.Vector3(p.x, p.y, p.z);
}

/** Arco sobre la superficie: interpolación esférica con una altura que crece con la distancia. */
function puntosDelArco(arc: GlobeArc, r: number): { puntos: THREE.Vector3[]; largo: number } {
  const a = vec(arc.from.lat, arc.from.lon, 1).normalize();
  const b = vec(arc.to.lat, arc.to.lon, 1).normalize();
  const angulo = a.angleTo(b);
  const alto = Math.min(0.32, 0.06 + angulo * 0.22);
  const puntos: THREE.Vector3[] = [];
  const q = new THREE.Quaternion();
  const eje = new THREE.Vector3().crossVectors(a, b);
  const valido = eje.lengthSq() > 1e-10;
  if (valido) eje.normalize();
  for (let i = 0; i <= PUNTOS; i++) {
    const t = i / PUNTOS;
    const dir = valido ? a.clone().applyQuaternion(q.setFromAxisAngle(eje, angulo * t)) : a.clone();
    puntos.push(dir.multiplyScalar(r * (1 + alto * Math.sin(Math.PI * t))));
  }
  let largo = 0;
  for (let i = 1; i < puntos.length; i++) largo += puntos[i]!.distanceTo(puntos[i - 1]!);
  return { puntos, largo };
}

function moverReducido(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function Arco({ arc, grosor, inicio }: { arc: GlobeArc; grosor: number; inicio: number }) {
  const r = GLOBE_V2_BIT_SURFACE_RADIUS;
  const { puntos, largo } = useMemo(() => puntosDelArco(arc, r), [arc, r]);
  const fin = useMemo(() => vec(arc.to.lat, arc.to.lon, r * 1.002), [arc, r]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineaRef = useRef<any>(null);
  const reloj = useRef(0);
  const quieto = useRef(false);

  useEffect(() => {
    quieto.current = moverReducido();
    reloj.current = 0;
  }, [arc]);

  useFrame((_, dt) => {
    const mat = lineaRef.current?.material as { dashOffset?: number } | undefined;
    if (!mat) return;
    reloj.current += dt;
    const p = quieto.current ? 1 : Math.min(1, Math.max(0, (reloj.current - inicio) / DURACION_S));
    const suave = 1 - Math.pow(1 - p, 3);
    mat.dashOffset = largo * (1 - suave);
  });

  return (
    <group>
      <Line
        ref={lineaRef}
        points={puntos}
        color={arc.color}
        lineWidth={grosor}
        transparent
        opacity={0.85}
        dashed
        dashSize={largo}
        gapSize={largo}
        dashScale={1}
        depthWrite={false}
      />
      <mesh position={fin}>
        <sphereGeometry args={[0.0045, 12, 12]} />
        <meshBasicMaterial color={arc.color} transparent opacity={0.95} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function GlobeArcsLayer({ arcs, mobile = false }: { arcs: GlobeArc[]; mobile?: boolean }) {
  if (!arcs.length) return null;
  const grosor = mobile ? 2.2 : 1.4;
  return (
    <group>
      {arcs.map((arc, i) => (
        <Arco key={`${arc.to.lat},${arc.to.lon},${i}`} arc={arc} grosor={grosor} inicio={i * 0.08} />
      ))}
    </group>
  );
}
