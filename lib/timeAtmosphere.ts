/**
 * Sistema de atmósfera temporal de AlmaMundi.
 * Lee la hora local del usuario y retorna los valores
 * de atmósfera correspondientes. Sin side effects.
 */

export type TimeSlot =
  | 'madrugada'   // 00:00 – 05:59
  | 'amanecer'    // 06:00 – 08:59
  | 'mañana'      // 09:00 – 12:59
  | 'tarde'       // 13:00 – 17:59
  | 'atardecer'   // 18:00 – 20:59
  | 'noche';      // 21:00 – 23:59

export type Atmosphere = {
  slot:             TimeSlot;
  label:            string;       // texto poético, se muestra en UI si se quiere
  bgIntensity:      number;       // 0–1: qué tan oscuro está el fondo (0=más claro, 1=más oscuro)
  particleSpeed:    number;       // 0.5–2.0: velocidad de partículas del universo
  particleOpacity:  number;       // 0.3–1.0
  ambientVolume:    number;       // 0.0–1.0: volumen del ambient al entrar
  accentHue:        number;       // hue del color de acento (base 30 = naranja)
  accentSaturation: number;       // saturación del acento
  bgOverlay:        string;       // color CSS del overlay sobre el universo
  featuredMoods:    string[];     // moods de historias a destacar en esta hora
  glowColor:        string;       // color del glow de los puntos del globo
};

export function getAtmosphere(hour?: number): Atmosphere {
  const h = hour ?? new Date().getHours();

  if (h >= 0 && h < 6) {
    return {
      slot: 'madrugada',
      label: 'Las horas que nadie ve',
      bgIntensity: 1.0,
      particleSpeed: 0.4,
      particleOpacity: 0.9,
      ambientVolume: 0.25,
      accentHue: 220,           // azul profundo en vez de naranja
      accentSaturation: 60,
      bgOverlay: 'rgba(0, 5, 20, 0.75)',
      featuredMoods: ['universo', 'mar'],
      glowColor: 'rgba(80, 120, 255, 0.95)',
    };
  }
  if (h >= 6 && h < 9) {
    return {
      slot: 'amanecer',
      label: 'Todo puede empezar',
      bgIntensity: 0.55,
      particleSpeed: 0.7,
      particleOpacity: 0.6,
      ambientVolume: 0.45,
      accentHue: 35,            // dorado amanecer
      accentSaturation: 90,
      bgOverlay: 'rgba(40, 18, 5, 0.45)',
      featuredMoods: ['universo', 'bosque'],
      glowColor: 'rgba(255, 190, 60, 0.95)',
    };
  }
  if (h >= 9 && h < 13) {
    return {
      slot: 'mañana',
      label: 'El mundo despierto',
      bgIntensity: 0.45,
      particleSpeed: 1.0,
      particleOpacity: 0.5,
      ambientVolume: 0.35,
      accentHue: 30,            // naranja estándar del sitio
      accentSaturation: 100,
      bgOverlay: 'rgba(15, 23, 42, 0.25)',
      featuredMoods: ['ciudad', 'personas'],
      glowColor: 'rgba(249, 115, 22, 0.90)',
    };
  }
  if (h >= 13 && h < 18) {
    return {
      slot: 'tarde',
      label: 'Historias que se acumulan',
      bgIntensity: 0.50,
      particleSpeed: 0.9,
      particleOpacity: 0.5,
      ambientVolume: 0.30,
      accentHue: 30,
      accentSaturation: 95,
      bgOverlay: 'rgba(15, 23, 42, 0.30)',
      featuredMoods: ['ciudad', 'animales'],
      glowColor: 'rgba(249, 115, 22, 0.85)',
    };
  }
  if (h >= 18 && h < 21) {
    return {
      slot: 'atardecer',
      label: 'La luz que se despide',
      bgIntensity: 0.70,
      particleSpeed: 0.65,
      particleOpacity: 0.75,
      ambientVolume: 0.55,
      accentHue: 20,            // naranja más rojizo al atardecer
      accentSaturation: 85,
      bgOverlay: 'rgba(35, 12, 3, 0.55)',
      featuredMoods: ['mar', 'bosque'],
      glowColor: 'rgba(255, 80, 30, 0.95)',
    };
  }
  // noche (21–23)
  return {
    slot: 'noche',
    label: 'El mundo por dentro',
    bgIntensity: 0.90,
    particleSpeed: 0.50,
    particleOpacity: 0.85,
    ambientVolume: 0.40,
    accentHue: 200,             // azul noche
    accentSaturation: 50,
    bgOverlay: 'rgba(3, 8, 28, 0.70)',
    featuredMoods: ['universo', 'mar'],
    glowColor: 'rgba(60, 140, 255, 0.90)',
  };
}

/** Interpolación suave entre dos atmósferas (para transiciones sin saltos). */
export function lerpAtmosphere(a: Atmosphere, b: Atmosphere, t: number): Partial<Atmosphere> {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return {
    bgIntensity:      lerp(a.bgIntensity,      b.bgIntensity),
    particleSpeed:    lerp(a.particleSpeed,     b.particleSpeed),
    particleOpacity:  lerp(a.particleOpacity,   b.particleOpacity),
    ambientVolume:    lerp(a.ambientVolume,      b.ambientVolume),
    accentHue:        lerp(a.accentHue,         b.accentHue),
    accentSaturation: lerp(a.accentSaturation,  b.accentSaturation),
  };
}
