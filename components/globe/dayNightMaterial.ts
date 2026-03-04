// components/globe/dayNightMaterial.ts
import * as THREE from "three";

type DayNightUniforms = {
  uDayTex: { value: THREE.Texture | null };
  uNightTex: { value: THREE.Texture | null };
  uSunDir: { value: THREE.Vector3 };
  uTerminatorSoftness: { value: number };
  uNightBoost: { value: number };
  uDayBoost: { value: number };
};

export function createDayNightMaterial(
  dayTex: THREE.Texture,
  nightTex: THREE.Texture
) {
  dayTex.colorSpace = THREE.SRGBColorSpace;
  nightTex.colorSpace = THREE.SRGBColorSpace;

  const uniforms: DayNightUniforms = {
    uDayTex: { value: dayTex },
    uNightTex: { value: nightTex },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    uTerminatorSoftness: { value: 0.08 }, // borde suave
    uNightBoost: { value: 1.25 },         // realza luces nocturnas
    uDayBoost: { value: 1.0 },            // brillo día
  };

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormalW;
    varying vec3 vPosW;

    void main() {
      vUv = uv;
      // normal en mundo
      vNormalW = normalize(mat3(modelMatrix) * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vPosW = worldPos.xyz;

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform sampler2D uDayTex;
    uniform sampler2D uNightTex;
    uniform vec3 uSunDir;
    uniform float uTerminatorSoftness;
    uniform float uNightBoost;
    uniform float uDayBoost;

    varying vec2 vUv;
    varying vec3 vNormalW;

    // gamma helpers
    vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
    vec3 toSRGB(vec3 c) { return pow(c, vec3(1.0/2.2)); }

    void main() {
      vec3 n = normalize(vNormalW);
      vec3 s = normalize(uSunDir);

      // iluminación: dot entre normal y sol ([-1..1])
      float ndl = dot(n, s);

      // máscara día: suaviza el borde (terminator)
      float dayMask = smoothstep(-uTerminatorSoftness, uTerminatorSoftness, ndl);

      vec3 dayCol = texture2D(uDayTex, vUv).rgb;
      vec3 nightCol = texture2D(uNightTex, vUv).rgb;

      // a linear
      dayCol = toLinear(dayCol) * uDayBoost;
      nightCol = toLinear(nightCol) * uNightBoost;

      // Mezcla: noche domina cuando dayMask=0
      vec3 col = mix(nightCol, dayCol, dayMask);

      // leve "rim" en terminator para look cinematográfico
      float rim = 1.0 - abs(ndl);
      col += vec3(0.03, 0.06, 0.10) * pow(rim, 3.0) * 0.35;

      // back to sRGB
      col = toSRGB(col);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    uniforms: uniforms as any,
    vertexShader,
    fragmentShader,
  });

  // Para que el shader se vea igual que el resto
  mat.transparent = false;

  return mat;
}

/**
 * Dirección del sol aproximada (suficiente para terminator creíble).
 * Retorna un vector unitario en coordenadas del mundo del globo.
 *
 * Base: declinación solar aprox + hora solar.
 */
export function computeSunDirection(date: Date) {
  // UTC para consistencia global
  const d = new Date(date.getTime());
  const utcHours = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;

  // Día del año
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const diff = d.getTime() - start;
  const dayOfYear = diff / 86400000; // 1..366 aprox

  // Declinación solar (aprox, en rad)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (utcHours - 12) / 24);
  const decl =
    0.006918
    - 0.399912 * Math.cos(gamma)
    + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma)
    + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma)
    + 0.00148  * Math.sin(3 * gamma);

  // Hora angular (0 a mediodía UTC; esto da un terminator global dinámico)
  const ha = (Math.PI / 12) * (utcHours - 12);

  // Convertimos a un vector (x,y,z) "solar" en un espacio fijo del globo
  // Eje Y = norte
  const x = Math.cos(decl) * Math.cos(ha);
  const y = Math.sin(decl);
  const z = Math.cos(decl) * Math.sin(ha);

  // Ajuste: según cómo está orientado tu globo, puede requerir swap de ejes.
  // Este suele funcionar bien con react-globe.gl (Y up).
  return new THREE.Vector3(x, y, z).normalize();
}
