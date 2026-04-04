'use client';

/**
 * Hilo + nudos en Three.js (react-three-fiber). Sustituye el canvas 2D de SalaHilo.
 * Coordenadas: mismo espacio que el canvas (x→X, y pantalla→-Y, Z profundidad).
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { kpos, truncThreeWords, ty } from '@/lib/muestras/sala-hilo-thread-math';

const ACCENT = '#FF4A1C';
const TEXT_PRIMARY = '#1a1f2a';
const TEXT_MUTED = '#9299a8';

export type SalaHiloThreadStory = {
  titulo: string;
  formato: string;
};

export type SalaHiloThread3DProps = {
  width: number;
  height: number;
  stories: SalaHiloThreadStory[];
  tRef: MutableRefObject<number>;
  mouseRef: MutableRefObject<{ x: number; y: number }>;
  activeKnotRef: MutableRefObject<number>;
  unraveledRef: MutableRefObject<Set<number>>;
  onKnotPick: (index: number) => void;
};

const STEP = 3;

function CameraRig({ W, H }: { W: number; H: number }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const p = camera as THREE.PerspectiveCamera;
    p.fov = 48;
    p.near = 0.05;
    p.far = 8000;
    const span = Math.max(W, H, 400);
    p.position.set(W / 2, -H / 2, span * 1.02);
    p.lookAt(W / 2, -H / 2, 0);
    p.updateProjectionMatrix();
  }, [camera, W, H]);
  return null;
}

function ThreadStrands({
  W,
  H,
  tRef,
}: {
  W: number;
  H: number;
  tRef: MutableRefObject<number>;
}) {
  const { size } = useThree();
  const n = Math.max(2, Math.floor(W / STEP) + 1);
  const layers = useRef<
    { geom: LineGeometry; line: Line2; mat: LineMaterial; dy: number }[]
  >([]);

  const group = useRef<THREE.Group>(null);
  const posScratch = useRef<Float32Array>(new Float32Array(n * 3));

  useLayoutEffect(() => {
    let cancelled = false;
    let raf = 0;

    const disposeLayers = () => {
      for (const layer of layers.current) {
        const line = layer.line;
        if (line.parent) line.parent.remove(line);
        layer.geom.dispose();
        layer.mat.dispose();
      }
      layers.current = [];
    };

    const build = () => {
      if (cancelled) return;
      const g = group.current;
      if (!g) {
        raf = requestAnimationFrame(build);
        return;
      }

      disposeLayers();

      const res = new THREE.Vector2(
        Math.max(1, size.width),
        Math.max(1, size.height),
      );
      const specs: { dy: number; color: string; opacity: number; lw: number }[] = [
        { dy: 3.2, color: '#556070', opacity: 0.32, lw: 8 },
        { dy: 1.6, color: '#5f6a7c', opacity: 0.48, lw: 5.5 },
        { dy: 0, color: '#384050', opacity: 1, lw: 4.2 },
        { dy: -1, color: '#f0f2f8', opacity: 0.42, lw: 2.4 },
      ];

      for (const s of specs) {
        const geom = new LineGeometry();
        const mat = new LineMaterial({
          color: s.color,
          linewidth: s.lw,
          worldUnits: true,
          transparent: s.opacity < 1,
          opacity: s.opacity,
          resolution: res.clone(),
          depthTest: true,
          depthWrite: true,
        });
        const line = new Line2(geom, mat);
        line.frustumCulled = false;
        line.computeLineDistances();
        g.add(line);
        layers.current.push({ geom, line, mat, dy: s.dy });
      }

      const need = Math.max(64, n * 3);
      if (posScratch.current.length < need) {
        posScratch.current = new Float32Array(need);
      }
    };

    build();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      disposeLayers();
    };
  }, [W, H, n, size.width, size.height]);

  useFrame(() => {
    const t = tRef.current;
    const resW = size.width;
    const resH = size.height;
    const arr = posScratch.current;
    for (const layer of layers.current) {
      layer.mat.resolution.set(Math.max(1, resW), Math.max(1, resH));
      let i = 0;
      for (let x = 0; x <= W; x += STEP) {
        arr[i++] = x;
        arr[i++] = -(ty(x, W, H, t) + layer.dy);
        arr[i++] = 0;
      }
      layer.geom.setPositions(arr.subarray(0, i));
    }
  });

  return <group ref={group} />;
}

function HoverSync({
  activeKnotRef,
  onHoverChange,
}: {
  activeKnotRef: MutableRefObject<number>;
  onHoverChange: (i: number) => void;
}) {
  const last = useRef(-999);
  useFrame(() => {
    const a = activeKnotRef.current;
    if (a !== last.current) {
      last.current = a;
      onHoverChange(a);
    }
  });
  return null;
}

function Knots3D({
  W,
  H,
  stories,
  tRef,
  mouseRef,
  activeKnotRef,
  unraveledRef,
  onKnotPick,
}: Pick<
  SalaHiloThread3DProps,
  | 'stories'
  | 'tRef'
  | 'mouseRef'
  | 'activeKnotRef'
  | 'unraveledRef'
  | 'onKnotPick'
> & { W: number; H: number }) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const hitRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    const t = tRef.current;
    const knots = kpos(W, H, t, stories.length);
    const mouse = mouseRef.current;
    const unraveled = unraveledRef.current;

    let active = -1;
    for (let i = 0; i < knots.length; i++) {
      const { x, y } = knots[i];
      const dx = mouse.x - x;
      const dy = mouse.y - y;
      if (Math.hypot(dx, dy) < 32) active = i;
    }
    activeKnotRef.current = active;

    for (let i = 0; i < stories.length; i++) {
      const mesh = meshRefs.current[i];
      const hit = hitRefs.current[i];
      if (!mesh || !hit) continue;
      const k = knots[i];
      if (!k) continue;
      const unr = unraveled.has(i);
      const isH = active === i && !unr;
      const r = unr ? 12 : isH ? 18 : 13;
      mesh.position.set(k.x, -k.y, 4);
      hit.position.set(k.x, -k.y, 4);
      mesh.scale.setScalar(r / 13);
      hit.scale.setScalar(32 / 13);

      const m = mesh.material as THREE.MeshStandardMaterial;
      if (unr) {
        m.color.set('#d8dee8');
        m.emissive.set('#98a8b8');
        m.emissiveIntensity = 0.08;
        m.metalness = 0.06;
        m.roughness = 0.52;
      } else if (isH) {
        m.color.set('#ffffff');
        m.emissive.set(ACCENT);
        m.emissiveIntensity = 0.18;
        m.metalness = 0.2;
        m.roughness = 0.26;
      } else {
        m.color.set('#eef1f7');
        m.emissive.set('#c8d4e2');
        m.emissiveIntensity = 0.06;
        m.metalness = 0.1;
        m.roughness = 0.38;
      }
    }
  });

  return (
    <group>
      {stories.map((_, i) => (
        <group key={i}>
          <mesh
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[13, 40, 40]} />
            <meshStandardMaterial
              color="#eef1f7"
              roughness={0.38}
              metalness={0.12}
            />
          </mesh>
          <mesh
            ref={(el) => {
              hitRefs.current[i] = el;
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (activeKnotRef.current === i) onKnotPick(i);
            }}
            visible={false}
          >
            <sphereGeometry args={[13, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GroundShadows({
  W,
  H,
  stories,
  tRef,
  unraveledRef,
}: {
  W: number;
  H: number;
  stories: SalaHiloThreadStory[];
  tRef: MutableRefObject<number>;
  unraveledRef: MutableRefObject<Set<number>>;
}) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const t = tRef.current;
    const knots = kpos(W, H, t, stories.length);
    for (let i = 0; i < stories.length; i++) {
      const m = refs.current[i];
      if (!m) continue;
      if (unraveledRef.current.has(i)) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      const k = knots[i];
      if (!k) continue;
      m.position.set(k.x, -k.y - 0.5, 1);
      m.scale.set(18, 5, 18);
    }
  });
  return (
    <group>
      {stories.map((_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1, 24]} />
          <meshBasicMaterial color="#374151" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function HoverLabel3D({
  hoverIdx,
  W,
  H,
  stories,
  tRef,
  unraveledRef,
}: {
  hoverIdx: number;
  W: number;
  H: number;
  stories: SalaHiloThreadStory[];
  tRef: MutableRefObject<number>;
  unraveledRef: MutableRefObject<Set<number>>;
}) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const gr = g.current;
    if (!gr) return;
    if (hoverIdx < 0 || unraveledRef.current.has(hoverIdx)) {
      gr.visible = false;
      return;
    }
    gr.visible = true;
    const knots = kpos(W, H, tRef.current, stories.length);
    const k = knots[hoverIdx];
    if (k) gr.position.set(k.x, -k.y, 28);
  });

  if (hoverIdx < 0) return null;
  const h = stories[hoverIdx];
  if (!h) return null;
  let title = h.titulo;
  if (title.length > 48) title = `${title.slice(0, 46)}…`;

  return (
    <group ref={g}>
      <Html
        center
        distanceFactor={1}
        style={{
          pointerEvents: 'none',
          width: Math.min(420, W * 0.5),
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        transform
        occlude={false}
      >
        <div
          style={{
            transform: 'translateY(-100%) translateY(-28px)',
            textShadow: '0 2px 14px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: ACCENT,
              marginBottom: 6,
            }}
          >
            {String(hoverIdx + 1)}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: TEXT_PRIMARY,
              lineHeight: 1.2,
              marginBottom: 6,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT, letterSpacing: '0.06em' }}>
            {(h.formato || 'video').toUpperCase()}
          </div>
        </div>
      </Html>
    </group>
  );
}

function IdleCaptions3D({
  W,
  H,
  stories,
  tRef,
  hoverIdx,
  unraveledRef,
}: {
  W: number;
  H: number;
  stories: SalaHiloThreadStory[];
  tRef: MutableRefObject<number>;
  hoverIdx: number;
  unraveledRef: MutableRefObject<Set<number>>;
}) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const t = tRef.current;
    const knots = kpos(W, H, t, stories.length);
    for (let i = 0; i < stories.length; i++) {
      const gr = groups.current[i];
      if (!gr) continue;
      const k = knots[i];
      if (!k) continue;
      gr.position.set(k.x, -k.y, 12);
      gr.visible =
        !unraveledRef.current.has(i) && hoverIdx !== i;
    }
  });

  return (
    <group>
      {stories.map((s, i) => (
        <group key={i} ref={(el) => { groups.current[i] = el; }}>
          <Html
            center
            distanceFactor={0.9}
            style={{
              pointerEvents: 'none',
              width: 200,
              textAlign: 'center',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
            transform
            occlude={false}
          >
            <div style={{ transform: 'translateY(36px)' }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#5a6578',
                  textShadow: '0 1px 0 rgba(255,255,255,0.6)',
                }}
              >
                {String(i + 1)}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  fontWeight: 400,
                  color: TEXT_MUTED,
                  lineHeight: 1.25,
                }}
              >
                {truncThreeWords(s.titulo)}
              </div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function DoneCheck3D({
  W,
  H,
  stories,
  tRef,
  unraveledRef,
}: {
  W: number;
  H: number;
  stories: SalaHiloThreadStory[];
  tRef: MutableRefObject<number>;
  unraveledRef: MutableRefObject<Set<number>>;
}) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const t = tRef.current;
    const knots = kpos(W, H, t, stories.length);
    for (let i = 0; i < stories.length; i++) {
      const gr = groups.current[i];
      if (!gr) continue;
      const k = knots[i];
      if (!k) continue;
      gr.position.set(k.x, -k.y, 14);
      gr.visible = unraveledRef.current.has(i);
    }
  });
  return (
    <group>
      {stories.map((_, i) => (
        <group key={i} ref={(el) => { groups.current[i] = el; }}>
          <Html center distanceFactor={0.85} style={{ pointerEvents: 'none' }} transform occlude={false}>
            <span
              style={{
                fontWeight: 800,
                fontSize: 14,
                color: ACCENT,
                textShadow: '0 1px 6px rgba(0,0,0,0.25)',
              }}
            >
              ✓
            </span>
          </Html>
        </group>
      ))}
    </group>
  );
}

function Scene(props: SalaHiloThread3DProps) {
  const {
    width: W,
    height: H,
    stories,
    tRef,
    mouseRef,
    activeKnotRef,
    unraveledRef,
    onKnotPick,
  } = props;
  const [hoverIdx, setHoverIdx] = useState(-1);

  useFrame(() => {
    tRef.current += 0.01;
  }, 100);

  const onHover = useCallback((i: number) => {
    setHoverIdx(i);
  }, []);

  return (
    <>
      <CameraRig W={W} H={H} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[W * 0.35, H * 0.2, 420]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-180, -120, 280]} intensity={0.35} color="#b8c8e8" />
      <pointLight position={[W / 2, -H * 0.3, 200]} intensity={0.25} color="#fff5f0" />

      <ThreadStrands W={W} H={H} tRef={tRef} />
      <GroundShadows W={W} H={H} stories={stories} tRef={tRef} unraveledRef={unraveledRef} />
      <Knots3D
        W={W}
        H={H}
        stories={stories}
        tRef={tRef}
        mouseRef={mouseRef}
        activeKnotRef={activeKnotRef}
        unraveledRef={unraveledRef}
        onKnotPick={onKnotPick}
      />
      <HoverSync activeKnotRef={activeKnotRef} onHoverChange={onHover} />
      <IdleCaptions3D
        W={W}
        H={H}
        stories={stories}
        tRef={tRef}
        hoverIdx={hoverIdx}
        unraveledRef={unraveledRef}
      />
      <HoverLabel3D
        hoverIdx={hoverIdx}
        W={W}
        H={H}
        stories={stories}
        tRef={tRef}
        unraveledRef={unraveledRef}
      />
      <DoneCheck3D W={W} H={H} stories={stories} tRef={tRef} unraveledRef={unraveledRef} />
    </>
  );
}

export function SalaHiloThread3D(props: SalaHiloThread3DProps) {
  const { width: W, height: H } = props;
  if (W < 8 || H < 8) return null;

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        touchAction: 'none',
        position: 'relative',
        zIndex: 1,
      }}
      dpr={[1, 2]}
    >
      <Scene {...props} />
    </Canvas>
  );
}
