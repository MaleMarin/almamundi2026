/**
 * lib/audioEmotion.ts
 *
 * Analiza el espectro de frecuencias de un audio en tiempo real
 * y retorna un estado emocional simplificado.
 *
 * No usa ninguna librería de ML — solo Web Audio API + heurísticas
 * basadas en características acústicas conocidas de la voz humana.
 */

export type EmotionState =
  | 'silence'   // sin audio o muy bajo
  | 'calm'      // predomina graves, poca variación
  | 'warm'      // balance de medios, voz narrativa normal
  | 'tense'     // agudos con variación rápida, emoción alta
  | 'intense';  // energía total alta, todo el espectro activo

export type EmotionVisual = {
  state:          EmotionState;
  /** Color del overlay (rgba) */
  overlayColor:   string;
  /** Prefijo de color para partículas (concat con opacidad + ')') */
  particleColor:  string;
  /** Velocidad relativa de las partículas (0.3 – 2.0) */
  particleSpeed:  number;
  /** Intensidad del glow central (0 – 1) */
  glowIntensity:  number;
  /** Etiqueta poética para mostrar en UI */
  label:          string;
  /** Hue del acento (para CSS variable --atm-accent) */
  accentHue:      number;
};

export const EMOTION_VISUALS: Record<EmotionState, EmotionVisual> = {
  silence: {
    state:         'silence',
    overlayColor:  'rgba(5, 8, 20, 0.85)',
    particleColor: 'rgba(60, 80, 120, ',
    particleSpeed: 0.25,
    glowIntensity: 0.1,
    label:         '',
    accentHue:     220,
  },
  calm: {
    state:         'calm',
    overlayColor:  'rgba(8, 15, 35, 0.75)',
    particleColor: 'rgba(60, 120, 200, ',
    particleSpeed: 0.4,
    glowIntensity: 0.3,
    label:         'calma',
    accentHue:     210,
  },
  warm: {
    state:         'warm',
    overlayColor:  'rgba(20, 12, 8, 0.65)',
    particleColor: 'rgba(220, 120, 50, ',
    particleSpeed: 0.8,
    glowIntensity: 0.5,
    label:         'presencia',
    accentHue:     30,
  },
  tense: {
    state:         'tense',
    overlayColor:  'rgba(25, 8, 8, 0.70)',
    particleColor: 'rgba(240, 80, 60, ',
    particleSpeed: 1.4,
    glowIntensity: 0.75,
    label:         'emoción',
    accentHue:     10,
  },
  intense: {
    state:         'intense',
    overlayColor:  'rgba(30, 10, 5, 0.60)',
    particleColor: 'rgba(255, 140, 30, ',
    particleSpeed: 1.8,
    glowIntensity: 1.0,
    label:         'intensidad',
    accentHue:     25,
  },
};

/**
 * Analiza un buffer de frecuencias y retorna el estado emocional.
 * @param freqData Uint8Array de Web Audio AnalyserNode.getByteFrequencyData()
 * @param sampleRate Frecuencia de muestreo del AudioContext (normalmente 44100)
 * @param fftSize Tamaño del FFT del analyser (normalmente 256 o 512)
 */
export function analyzeEmotion(
  freqData:   Uint8Array,
  sampleRate: number,
  fftSize:    number
): EmotionState {
  const binHz   = sampleRate / fftSize;
  const len     = freqData.length;

  const energy = (loHz: number, hiHz: number): number => {
    const lo = Math.max(0,   Math.floor(loHz / binHz));
    const hi = Math.min(len, Math.ceil(hiHz  / binHz));
    if (hi <= lo) return 0;
    let sum = 0;
    for (let i = lo; i < hi; i++) sum += freqData[i];
    return sum / (hi - lo) / 255;
  };

  const totalEnergy = energy(80, 8000);

  if (totalEnergy < 0.04) return 'silence';

  const bassEnergy   = energy(80,   300);
  const midEnergy    = energy(300,  2000);
  const trebleEnergy = energy(2000, 8000);

  const trebleLo = Math.floor(2000 / binHz);
  const trebleHi = Math.min(len, Math.ceil(8000 / binHz));
  let trebleMean = 0;
  for (let i = trebleLo; i < trebleHi; i++) trebleMean += freqData[i];
  trebleMean /= (trebleHi - trebleLo);
  let trebleVariance = 0;
  for (let i = trebleLo; i < trebleHi; i++) {
    trebleVariance += Math.pow(freqData[i] - trebleMean, 2);
  }
  trebleVariance = Math.sqrt(trebleVariance / (trebleHi - trebleLo)) / 255;

  if (totalEnergy > 0.65 && trebleEnergy > 0.3) return 'intense';
  if (trebleVariance > 0.12 && trebleEnergy > 0.2) return 'tense';
  if (midEnergy > 0.25 && bassEnergy > 0.15)       return 'warm';
  if (bassEnergy > midEnergy && bassEnergy > 0.15)  return 'calm';
  return 'warm';
}
