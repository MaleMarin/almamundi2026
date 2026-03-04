/**
 * Sistema de pulso vital para los puntos del globo.
 * Calcula el estado de "vida" de cada historia/noticia
 * para determinar su comportamiento visual en el mapa.
 */

export type PulseState =
  | 'newborn'     // < 24 horas — late rápido, muy brillante
  | 'active'      // < 7 días — late normal
  | 'alive'       // < 30 días — respira suave
  | 'resting'     // > 30 días — pulso muy lento
  | 'resonating'; // tiene cartas o inspiraciones — color cálido especial

export type PulseConfig = {
  state:        PulseState;
  baseRadius:   number;    // radio base del punto
  pulseRadius:  number;    // radio máximo del anillo pulsante
  speed:        number;    // velocidad del pulso (ciclos por segundo)
  baseOpacity:  number;    // opacidad del punto central
  ringOpacity:  number;    // opacidad máxima del anillo
  color:        string;    // color CSS del punto y anillo
  glowRadius:   number;    // radio del glow difuso detrás del punto
};

export function getPulseConfig(story: {
  publishedAt?: string | null;
  lettersCount?: number;
  inspiredCount?: number;
  createdAt?: string | null;
}): PulseConfig {
  const now = Date.now();
  const published = story.publishedAt ?? story.createdAt;
  const ageMs = published ? now - new Date(published).getTime() : Infinity;
  const ageHours = ageMs / (1000 * 60 * 60);
  const ageDays = ageHours / 24;

  const hasResonance = (story.lettersCount ?? 0) > 0 || (story.inspiredCount ?? 0) > 0;

  if (hasResonance) {
    return {
      state:       'resonating',
      baseRadius:  0.28,
      pulseRadius: 0.55,
      speed:       0.8,
      baseOpacity: 0.95,
      ringOpacity: 0.5,
      color:       'rgba(255, 160, 60, 1)',   // dorado cálido = resonancia
      glowRadius:  0.6,
    };
  }
  if (ageHours < 24) {
    return {
      state:       'newborn',
      baseRadius:  0.30,
      pulseRadius: 0.65,
      speed:       1.4,
      baseOpacity: 1.0,
      ringOpacity: 0.6,
      color:       'rgba(249, 115, 22, 1)',   // naranja puro = nueva
      glowRadius:  0.7,
    };
  }
  if (ageDays < 7) {
    return {
      state:       'active',
      baseRadius:  0.24,
      pulseRadius: 0.48,
      speed:       0.9,
      baseOpacity: 0.90,
      ringOpacity: 0.40,
      color:       'rgba(249, 115, 22, 0.9)',
      glowRadius:  0.5,
    };
  }
  if (ageDays < 30) {
    return {
      state:       'alive',
      baseRadius:  0.20,
      pulseRadius: 0.38,
      speed:       0.55,
      baseOpacity: 0.75,
      ringOpacity: 0.28,
      color:       'rgba(249, 115, 22, 0.75)',
      glowRadius:  0.35,
    };
  }
  // resting: > 30 días
  return {
    state:       'resting',
    baseRadius:  0.16,
    pulseRadius: 0.28,
    speed:       0.30,
    baseOpacity: 0.55,
    ringOpacity: 0.18,
    color:       'rgba(180, 100, 40, 0.65)',  // naranja apagado = dormida
    glowRadius:  0.22,
  };
}

/** Config especial para noticias activas */
export function getNewsPulseConfig(news: {
  publishedAt?: string | null;
  intensity?: number;  // 0–1 si existe
}): PulseConfig {
  const intensity = news.intensity ?? 0.5;
  return {
    state:       'active',
    baseRadius:  0.18 + intensity * 0.12,
    pulseRadius: 0.50 + intensity * 0.30,
    speed:       1.0 + intensity * 0.8,      // noticias más intensas laten más rápido
    baseOpacity: 0.80 + intensity * 0.20,
    ringOpacity: 0.35 + intensity * 0.25,
    color:       `rgba(96, 165, 250, ${0.7 + intensity * 0.3})`, // azul = noticias
    glowRadius:  0.45 + intensity * 0.25,
  };
}
