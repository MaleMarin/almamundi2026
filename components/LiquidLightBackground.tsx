'use client';

/**
 * Fondo gris claro; gel compacto (metabolas 1/r² + RT). El cursor *empuja* la sustancia acumulada.
 * 1 Inercia — advección con memoria de velocidad (el gel sigue deslizándose al soltar).
 * 2 Estiramiento — huella en contacto elíptica según velocidad del cursor.
 * 3 Recomposición — difusión + decay tras el empuje.
 * 4 Borde suave — smoothstep ancho + gradiente del campo en display.
 * 5 Deformación orgánica — FBM que tuerce el muestreo del RT.
 * 6 Relieve 3D — normales del campo + luz clave/relleno + specular + fresnel + rim.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** Gris claro (alineado a fondos tipo neumorfismo / sala). */
const CLEAR_NEUTRAL = 0xeaecf2;

const vsFullscreen = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function attachShaderErrorLogger(renderer: THREE.WebGLRenderer) {
  renderer.debug.onShaderError = (gl, program, glVertexShader, glFragmentShader) => {
    const programLog = (program && gl.getProgramInfoLog(program)) || '';
    const vsLog = glVertexShader ? gl.getShaderInfoLog(glVertexShader) || '' : '';
    const fsLog = glFragmentShader ? gl.getShaderInfoLog(glFragmentShader) || '' : '';
    console.error('[LiquidLightBackground] Error de shader GLSL', {
      programLog: programLog.trim() || '(vacío)',
      vertexLog: vsLog.trim() || '(vacío)',
      fragmentLog: fsLog.trim() || '(vacío)',
    });
  };
}

type LiquidLightBackgroundProps = {
  /**
   * `true`: `position: absolute; inset: 0` respecto al padre posicionado (p. ej. SalaHilo).
   * `false` (defecto): `fixed` a la ventana (comportamiento histórico si se reutiliza fuera).
   */
  fillParent?: boolean;
};

export function LiquidLightBackground({ fillParent = false }: LiquidLightBackgroundProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const gelCanvasPosition = fillParent ? 'absolute' : 'fixed';

    const targetMouse = new THREE.Vector2(0.5, 0.5);
    const prevTarget = new THREE.Vector2(0.5, 0.5);
    const prevPush = new THREE.Vector2(0.5, 0.5);
    /** Inercia del empuje (UV/frame); no se anula al instante al frenar el cursor. */
    const pushVel = new THREE.Vector2(0, 0);
    const cursorVelSm = new THREE.Vector2(0, 0);

    const simUniforms = {
      uPrev: { value: null as THREE.Texture | null },
      uContact: { value: new THREE.Vector2(0.5, 0.5) },
      uPush: { value: new THREE.Vector2(0, 0) },
      uCursorVel: { value: new THREE.Vector2(0, 0) },
      uSimResolution: { value: new THREE.Vector2(1, 1) },
      uDecay: { value: 0.976 },
      uSplatAmp: { value: 0.11 },
      uAdvectStr: { value: 4.65 },
    };

    const dispUniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uScroll: { value: 0 },
      uIntensity: { value: 1 },
      uSim: { value: null as THREE.Texture | null },
      uCursorVel: { value: new THREE.Vector2(0, 0) },
      uMetaA: { value: new THREE.Vector2(0.5, 0.5) },
      uMetaB: { value: new THREE.Vector2(0.5, 0.5) },
      uMetaC: { value: new THREE.Vector2(0.5, 0.5) },
      uMetaD: { value: new THREE.Vector2(0.5, 0.5) },
      uMetaE: { value: new THREE.Vector2(0.5, 0.5) },
    };

    const simMaterial = new THREE.ShaderMaterial({
      name: 'LiquidLightSim',
      uniforms: simUniforms,
      glslVersion: THREE.GLSL3,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      vertexShader: vsFullscreen,
      fragmentShader: /* glsl */ `
        precision highp float;

        uniform sampler2D uPrev;
        uniform vec2 uContact;
        uniform vec2 uPush;
        uniform vec2 uCursorVel;
        uniform vec2 uSimResolution;
        uniform float uDecay;
        uniform float uSplatAmp;
        uniform float uAdvectStr;

        varying vec2 vUv;

        layout(location = 0) out highp vec4 fragColor;

        float sampleP(vec2 t) {
          return texture(uPrev, clamp(t, 0.001, 0.999)).r;
        }

        void main() {
          vec2 uv = vUv;
          vec2 px = 1.0 / uSimResolution;

          /* 1) Empuje: transportar el gel con el desplazamiento del cursor (semi-Lagrangiano). */
          vec2 back = uv - uPush * uAdvectStr;
          float a = sampleP(back);

          /* 2) Viscosidad gelatinosa: difusión más ancha (más mezcla entre píxeles). */
          float c =
            a * 0.22
            + sampleP(back + vec2(px.x, 0.0)) * 0.14
            + sampleP(back - vec2(px.x, 0.0)) * 0.14
            + sampleP(back + vec2(0.0, px.y)) * 0.14
            + sampleP(back - vec2(0.0, px.y)) * 0.14
            + sampleP(back + vec2(px.x * 2.0, 0.0)) * 0.055
            + sampleP(back - vec2(px.x * 2.0, 0.0)) * 0.055
            + sampleP(back + vec2(0.0, px.y * 2.0)) * 0.055
            + sampleP(back - vec2(0.0, px.y * 2.0)) * 0.055;

          c *= uDecay;

          /* 3) Huella de contacto en el cursor: elipse alargada en dirección de movimiento (estiramiento). */
          vec2 d = uv - uContact;
          float simAspect = uSimResolution.x / max(uSimResolution.y, 1.0);
          vec2 p = vec2(d.x * simAspect, d.y);

          vec2 vel = uCursorVel;
          float speed = length(vel);
          vec2 dir = speed > 0.01 ? normalize(vel) : vec2(1.0, 0.0);
          float ang = atan(dir.y, dir.x);
          float co = cos(-ang);
          float si = sin(-ang);
          vec2 pr = vec2(co * p.x - si * p.y, si * p.x + co * p.y);

          float stretch = clamp(speed * 0.026, 0.0, 1.45);
          vec2 rad = vec2(0.013 + stretch * 0.09, 0.013 / (1.0 + stretch * 0.68));
          float dist = dot(pr / rad, pr / rad);
          float contact = exp(-dist * 1.05) * uSplatAmp * (0.35 + 0.65 * min(speed * 0.1, 1.0));
          float atRest = exp(-dot(p, p) / (0.019 * 0.019)) * uSplatAmp * 0.045;

          float outv = clamp(c + contact + atRest * (1.0 - min(stretch * 0.85, 0.92)), 0.0, 1.0);
          fragColor = vec4(outv, outv, outv, 1.0);
        }
      `,
    });

    const dispMaterial = new THREE.ShaderMaterial({
      name: 'LiquidLightDisplay',
      uniforms: dispUniforms,
      glslVersion: THREE.GLSL3,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      vertexShader: vsFullscreen,
      fragmentShader: /* glsl */ `
        precision highp float;

        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform vec2 uCursorVel;
        uniform float uScroll;
        uniform float uIntensity;
        uniform sampler2D uSim;
        uniform vec2 uMetaA;
        uniform vec2 uMetaB;
        uniform vec2 uMetaC;
        uniform vec2 uMetaD;
        uniform vec2 uMetaE;

        varying vec2 vUv;

        layout(location = 0) out highp vec4 fragColor;

        float metaPot(vec2 uv, vec2 c, float wgt, float asp) {
          vec2 d = (uv - c) * vec2(asp, 1.0);
          float r2 = dot(d, d);
          return wgt / max(r2, 1.1e-5);
        }

        /* Metabolas compactas (menor wgt + umbral más alto = mancha más pequeña). */
        float metaField(vec2 uv) {
          float asp = uResolution.x / max(uResolution.y, 1.0);
          float sp = min(length(uCursorVel) * 0.018, 3.2);
          float wHead = 0.0068 * (1.0 + sp * 0.28);
          float M =
            metaPot(uv, uMetaA, wHead, asp)
            + metaPot(uv, uMetaB, 0.0051, asp)
            + metaPot(uv, uMetaC, 0.0039, asp)
            + metaPot(uv, uMetaD, 0.0029, asp)
            + metaPot(uv, uMetaE, 0.0022, asp);
          float m = smoothstep(1.35, 3.25, M);
          return pow(clamp(m, 0.0, 1.0), 0.64);
        }

        float softMerge(float a, float b) {
          return 1.0 - (1.0 - a) * (1.0 - b);
        }

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float vnoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float s = 0.0;
          float a = 0.52;
          vec2 x = p;
          s += a * vnoise(x); x = x * 2.08 + vec2(1.7, 0.6); a *= 0.5;
          s += a * vnoise(x); x = x * 2.03 + vec2(-0.9, 1.4); a *= 0.5;
          s += a * vnoise(x); x = x * 2.01 + vec2(0.3, -1.1); a *= 0.5;
          s += a * vnoise(x);
          return s;
        }

        void main() {
          vec2 aspectR = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
          float t = uTime * (0.042 + uScroll * 0.028);

          float gelRough = texture(uSim, clamp(vUv, 0.002, 0.998)).r;

          vec2 wob =
            vec2(
              fbm(vUv * 2.35 + vec2(0.0, t * 0.16)),
              fbm(vUv * 2.35 + vec2(8.4, t * 0.14))
            )
            * 0.024;
          wob += vec2(
            fbm(vUv * 5.0 + vec2(t * 0.06, gelRough * 0.2)),
            fbm(vUv * 5.0 + vec2(-t * 0.055, gelRough * 0.14))
          )
            * 0.008;

          vec2 sm = (uMouse - 0.5) * 2.0;
          wob += sm * 0.004;

          vec2 uvS = clamp(vUv + wob, 0.002, 0.998);
          vec2 px = vec2(1.0 / max(uResolution.x, 1.0), 1.0 / max(uResolution.y, 1.0)) * 1.75;

          float m0 = metaField(vUv);
          float mxp = metaField(vUv + vec2(px.x, 0.0));
          float mxm = metaField(vUv - vec2(px.x, 0.0));
          float myp = metaField(vUv + vec2(0.0, px.y));
          float mym = metaField(vUv - vec2(0.0, px.y));

          float gel = texture(uSim, uvS).r;
          float gelXp = texture(uSim, clamp(uvS + vec2(px.x, 0.0), 0.002, 0.998)).r;
          float gelXm = texture(uSim, clamp(uvS - vec2(px.x, 0.0), 0.002, 0.998)).r;
          float gelYp = texture(uSim, clamp(uvS + vec2(0.0, px.y), 0.002, 0.998)).r;
          float gelYm = texture(uSim, clamp(uvS - vec2(0.0, px.y), 0.002, 0.998)).r;

          float h = softMerge(m0, min(gel * 0.68, 1.0));
          float hxp = softMerge(mxp, min(gelXp * 0.68, 1.0));
          float hxm = softMerge(mxm, min(gelXm * 0.68, 1.0));
          float hyp = softMerge(myp, min(gelYp * 0.68, 1.0));
          float hym = softMerge(mym, min(gelYm * 0.68, 1.0));

          float gx = hxp - hxm;
          float gy = hyp - hym;
          vec3 N = normalize(vec3(-gx * 2.35 * aspectR.x, -gy * 2.35, 1.0));
          vec3 V = normalize(
            vec3(
              -(vUv.x - 0.5) * 0.14 * aspectR.x,
              -(vUv.y - 0.5) * 0.14,
              1.0
            )
          );
          vec3 Lk = normalize(vec3(-0.48, 0.38 + (uMouse.y - 0.5) * 0.08, 0.88));
          vec3 Lf = normalize(vec3(0.55, -0.28 + (uMouse.x - 0.5) * 0.1, 0.82));
          float diffK = max(dot(N, Lk), 0.0);
          float diffF = max(dot(N, Lf), 0.0);
          vec3 Hk = normalize(Lk + V);
          float spec = pow(max(dot(N, Hk), 0.0), 72.0);
          float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);
          float nz = clamp(N.z, 0.0, 1.0);
          float rim = pow(1.0 - nz, 1.45);

          h = pow(clamp(h, 0.0, 1.0), 0.9);
          float gelSoft = smoothstep(0.045, 0.52, h);

          float n = fbm(vUv * 3.8 + vec2(t * 0.09, -t * 0.078));
          float n2 = fbm(vUv * 5.2 + h * 0.45);
          float mist = mix(n, n2, 0.28) * 0.065;

          float body = gelSoft * uIntensity + mist * (0.28 + h * 0.35);
          vec3 dark = vec3(0.91, 0.915, 0.93);
          vec3 light = vec3(0.997, 0.998, 1.0);
          vec3 albedo = mix(dark, light, clamp(body, 0.0, 1.0));

          float shade = 0.38 + 0.52 * diffK + 0.32 * diffF;
          vec3 col = albedo * shade;
          col += vec3(1.0, 1.0, 1.02) * spec * gelSoft * 0.42;
          col += vec3(0.82, 0.86, 0.95) * fres * gelSoft * 0.48;
          col += vec3(0.07, 0.072, 0.078) * rim * gelSoft * 0.62;

          float vig = 0.94 + 0.06 * smoothstep(1.15, 0.32, length(vUv - 0.5));
          col *= vig;

          fragColor = vec4(col, 1.0);
        }
      `,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const meshSim = new THREE.Mesh(geometry, simMaterial);
    const meshDisp = new THREE.Mesh(geometry, dispMaterial);
    const simScene = new THREE.Scene();
    const dispScene = new THREE.Scene();
    simScene.add(meshSim);
    dispScene.add(meshDisp);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(CLEAR_NEUTRAL, 1);
    attachShaderErrorLogger(renderer);

    const canvas = renderer.domElement;
    Object.assign(canvas.style, {
      position: gelCanvasPosition,
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
      zIndex: '0',
      pointerEvents: 'none',
    });

    mount.appendChild(canvas);

    let rtRead = new THREE.WebGLRenderTarget(4, 4, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    });
    let rtWrite = new THREE.WebGLRenderTarget(4, 4, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    });

    const resizeTargets = (sw: number, sh: number) => {
      rtRead.dispose();
      rtWrite.dispose();
      rtRead = new THREE.WebGLRenderTarget(sw, sh, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false,
      });
      rtWrite = new THREE.WebGLRenderTarget(sw, sh, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false,
      });
      simUniforms.uSimResolution.value.set(sw, sh);
      renderer.setRenderTarget(rtRead);
      renderer.clear(true, true, true);
      renderer.setRenderTarget(rtWrite);
      renderer.clear(true, true, true);
      renderer.setRenderTarget(null);
    };

    const onScroll = () => {
      if (fillParent) {
        dispUniforms.uScroll.value = 0;
        return;
      }
      const y = window.scrollY || window.pageYOffset || 0;
      dispUniforms.uScroll.value = Math.min(1, y / 1200);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (fillParent) {
        const r = mount.getBoundingClientRect();
        const w = Math.max(1, r.width);
        const h = Math.max(1, r.height);
        targetMouse.set((e.clientX - r.left) / w, 1 - (e.clientY - r.top) / h);
        return;
      }
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w < 1 || h < 1) return;
      targetMouse.set(e.clientX / w, 1 - e.clientY / h);
    };

    const readMountSize = () => {
      const r = mount.getBoundingClientRect();
      return {
        w: Math.max(1, Math.floor(r.width)),
        h: Math.max(1, Math.floor(r.height)),
      };
    };

    const setSize = () => {
      let w: number;
      let h: number;
      if (fillParent) {
        const m = readMountSize();
        w = m.w;
        h = m.h;
        if (w < 16 || h < 16) return;
      } else {
        w = Math.max(1, window.innerWidth);
        h = Math.max(1, window.innerHeight);
      }
      renderer.setSize(w, h, false);
      dispUniforms.uResolution.value.set(w, h);
      const narrow = w < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 2);
      renderer.setPixelRatio(dpr);
      dispUniforms.uIntensity.value = narrow ? 0.78 : 1.0;
      simUniforms.uSplatAmp.value = narrow ? 0.095 : 0.11;
      simUniforms.uDecay.value = narrow ? 0.981 : 0.976;

      const sw = Math.max(128, Math.floor((w * dpr) / 2));
      const sh = Math.max(128, Math.floor((h * dpr) / 2));
      resizeTargets(sw, sh);
    };

    let resizeObs: ResizeObserver | null = null;

    setSize();
    onScroll();
    if (fillParent) {
      resizeObs = new ResizeObserver(() => setSize());
      resizeObs.observe(mount);
      requestAnimationFrame(() => setSize());
    } else {
      window.addEventListener('resize', setSize, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const clock = new THREE.Clock();
    const contactDispSm = new THREE.Vector2(0.5, 0.5);
    const metaLag1 = new THREE.Vector2(0.5, 0.5);
    const metaLag2 = new THREE.Vector2(0.5, 0.5);
    const metaLag3 = new THREE.Vector2(0.5, 0.5);
    const metaLag4 = new THREE.Vector2(0.5, 0.5);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.064);

      const rawVx = (targetMouse.x - prevTarget.x) / Math.max(dt, 1e-4);
      const rawVy = (targetMouse.y - prevTarget.y) / Math.max(dt, 1e-4);
      prevTarget.copy(targetMouse);
      const velSmooth = 0.2;
      cursorVelSm.x += (rawVx - cursorVelSm.x) * velSmooth;
      cursorVelSm.y += (rawVy - cursorVelSm.y) * velSmooth;

      const dPushX = targetMouse.x - prevPush.x;
      const dPushY = targetMouse.y - prevPush.y;
      prevPush.copy(targetMouse);
      const carry = 0.82;
      const inject = 0.64;
      pushVel.x = pushVel.x * carry + dPushX * inject;
      pushVel.y = pushVel.y * carry + dPushY * inject;

      contactDispSm.x += (targetMouse.x - contactDispSm.x) * 0.055;
      contactDispSm.y += (targetMouse.y - contactDispSm.y) * 0.055;

      metaLag4.lerp(metaLag3, 0.4);
      metaLag3.lerp(metaLag2, 0.4);
      metaLag2.lerp(metaLag1, 0.4);
      metaLag1.lerp(targetMouse, 0.36);

      dispUniforms.uMetaA.value.copy(targetMouse);
      dispUniforms.uMetaB.value.copy(metaLag1);
      dispUniforms.uMetaC.value.copy(metaLag2);
      dispUniforms.uMetaD.value.copy(metaLag3);
      dispUniforms.uMetaE.value.copy(metaLag4);
      dispUniforms.uCursorVel.value.copy(cursorVelSm);

      simUniforms.uContact.value.copy(targetMouse);
      simUniforms.uPush.value.copy(pushVel);
      simUniforms.uCursorVel.value.copy(cursorVelSm);

      dispUniforms.uTime.value = clock.getElapsedTime();
      dispUniforms.uMouse.value.copy(contactDispSm);

      simUniforms.uPrev.value = rtRead.texture;
      renderer.setRenderTarget(rtWrite);
      renderer.render(simScene, camera);

      dispUniforms.uSim.value = rtWrite.texture;
      renderer.setRenderTarget(null);
      renderer.render(dispScene, camera);

      const tmp = rtRead;
      rtRead = rtWrite;
      rtWrite = tmp;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      resizeObs?.disconnect();
      if (!fillParent) {
        window.removeEventListener('resize', setSize);
        window.removeEventListener('scroll', onScroll);
      }
      window.removeEventListener('pointermove', onPointerMove);
      renderer.debug.onShaderError = null;
      rtRead.dispose();
      rtWrite.dispose();
      geometry.dispose();
      simMaterial.dispose();
      dispMaterial.dispose();
      renderer.dispose();
      if (canvas.parentNode === mount) {
        mount.removeChild(canvas);
      }
    };
  }, [fillParent]);

  return (
    <div
      ref={mountRef}
      aria-hidden
      style={{
        position: fillParent ? 'absolute' : 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
    />
  );
}
