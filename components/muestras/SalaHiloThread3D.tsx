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
import { kpos, ty } from '@/lib/muestras/sala-hilo-thread-math';

const ACCENT = '#FF4A1C';
const TEXT_PRIMARY = '#1a1f2a';
const TEXT_MUTED = '#9299a8';
/** Hilo principal: amarillo/dorado (lectura clara sobre fondo claro). */
const THREAD_GOLD = '#e6b800';
const THREAD_GOLD_LIGHT = '#ffeb3b';
const THREAD_GOLD_PALE = '#fffef0';

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
        { dy: 0.85, color: THREAD_GOLD_PALE, opacity: 0.52, lw: 2.65 },
        { dy: 0.42, color: THREAD_GOLD_LIGHT, opacity: 0.98, lw: 1.75 },
        { dy: 0, color: THREAD_GOLD, opacity: 1, lw: 1.15 },
        { dy: -0.32, color: '#ffffff', opacity: 0.88, lw: 0.62 },
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
        /* Sin dashed en LineMaterial: no hace falta computeLineDistances (requiere posiciones ya cargadas). */
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
        m.color.set('#fffef8');
        m.emissive.set(THREAD_GOLD);
        m.emissiveIntensity = 0.35;
        m.metalness = 0.15;
        m.roughness = 0.28;
      } else {
        m.color.set('#fff8e0');
        m.emissive.set(THREAD_GOLD_LIGHT);
        m.emissiveIntensity = 0.12;
        m.metalness = 0.08;
        m.roughness = 0.35;
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
              color="#fff4c4"
              roughness={0.32}
              metalness={0.1}
              emissive={THREAD_GOLD}
              emissiveIntensity={0.08}
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
          <meshBasicMaterial color={THREAD_GOLD} transparent opacity={0.14} depthWrite={false} />
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
  const title =
    h.titulo.length > 72 ? `${h.titulo.slice(0, 70)}…` : h.titulo;

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
            distanceFactor={0.88}
            style={{
              pointerEvents: 'none',
              width: Math.min(320, W * 0.22),
              minWidth: 120,
              textAlign: 'center',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
            transform
            occlude={false}
          >
            <div style={{ transform: 'translateY(40px)' }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#8a6a00',
                  textShadow: '0 1px 0 rgba(255,255,255,0.9), 0 0 12px rgba(245,213,71,0.5)',
                  letterSpacing: '0.04em',
                }}
              >
                {String(i + 1)}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: TEXT_PRIMARY,
                  lineHeight: 1.35,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  textShadow: '0 1px 0 rgba(255,255,255,0.75)',
                  wordBreak: 'break-word',
                }}
              >
                {s.titulo}
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
      <ambientLight intensity={0.62} />
      <directionalLight
        position={[W * 0.35, H * 0.2, 420]}
        intensity={1.25}
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

/**
 * Mide el contenedor real del hilo y asigna al <canvas> ancho/alto en px.
 * Con solo width/height:100% el buffer WebGL a menudo queda en 0×0 en layouts flex/Next.
 */
export function SalaHiloThread3D(props: SalaHiloThread3DProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { width: propW, height: propH } = props;
  const [dims, setDims] = useState(() => ({
    w: Math.max(64, propW),
    h: Math.max(64, propH),
  }));

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(64, Math.floor(r.width));
      const h = Math.max(64, Math.floor(r.height));
      setDims((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    window.addEventListener('resize', read);
    const t = window.setTimeout(read, 0);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', read);
      window.clearTimeout(t);
    };
  }, []);

  const W = dims.w;
  const H = dims.h;
  if (W < 8 || H < 8) return null;

  const sceneProps: SalaHiloThread3DProps = { ...props, width: W, height: H };

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        height: '100%',
        minWidth: 64,
        minHeight: 64,
      }}
    >
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: true,
          /* 'high-performance' a veces elige GPU que no pinta bien en algunos Mac */
          powerPreference: 'default',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        style={{
          width: W,
          height: H,
          display: 'block',
          touchAction: 'none',
        }}
        dpr={[1, 2]}
      >
        <Scene {...sceneProps} />
      </Canvas>
    </div>
  );
}
