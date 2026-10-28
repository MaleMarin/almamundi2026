import type { AlmaLocale } from '@/lib/i18n/locale';

/**
 * Lunes en que empieza la semana 1 (00:00, America/Santiago).
 * El ciclo avanza cada 7 días civiles desde esta fecha. Cámbiala por otro lunes
 * si quieres mover el calendario.
 */
export const PREGUNTA_SEMANA_INICIO = '2026-11-02';

export const PREGUNTA_ZONA = 'America/Santiago';

export const QUESTION_IDS = [
  's01',
  's02',
  's03',
  's04',
  's05',
  's06',
  's07',
  's08',
  's09',
  's10',
  's11',
  's12',
] as const;

export type QuestionId = (typeof QUESTION_IDS)[number];
export type QuestionMode = 'tu' | 'alguien';

type L3 = Record<AlmaLocale, string>;

export type PreguntaSemana = {
  id: QuestionId;
  tema: L3;
  tu: L3;
  alguien: L3;
};

export const PREGUNTA_UI = {
  tab: { es: 'La pregunta', pt: 'A pergunta', en: 'The question' },
  tu: { es: 'Cuéntanos tú', pt: 'Conte você', en: 'Tell us yourself' },
  alguien: { es: 'Pregúntale a alguien', pt: 'Pergunte a alguém', en: 'Ask someone' },
  responder: { es: 'Responder', pt: 'Responder', en: 'Answer' },
  anteriores: { es: 'Preguntas anteriores', pt: 'Perguntas anteriores', en: 'Previous questions' },
} as const satisfies Record<string, L3>;

/** Línea sobre el título en la ficha pública. */
export const RESPONDE_A_PUBLICO: L3 = {
  es: 'Responde a:',
  pt: 'Responde a:',
  en: 'Answering:',
};

const PREGUNTAS: PreguntaSemana[] = [
  {
    id: 's01',
    tema: { es: 'Olores', pt: 'Cheiros', en: 'Smells' },
    tu: {
      es: '¿Qué olor te devuelve de golpe a tu infancia?',
      pt: 'Que cheiro te leva de volta à infância de repente?',
      en: 'What smell takes you straight back to your childhood?',
    },
    alguien: {
      es: 'Pregúntale a alguien de tu familia qué se cocinaba en su casa los domingos.',
      pt: 'Pergunte a alguém da sua família o que se cozinhava na casa dele aos domingos.',
      en: 'Ask someone in your family what was cooked at home on Sundays.',
    },
  },
  {
    id: 's02',
    tema: { es: 'Amabilidad', pt: 'Gentileza', en: 'Kindness' },
    tu: {
      es: '¿Quién fue amable contigo cuando nadie más lo fue?',
      pt: 'Quem foi gentil com você quando ninguém mais foi?',
      en: 'Who was kind to you when no one else was?',
    },
    alguien: {
      es: 'Pregúntale a alguien mayor quién lo cuidó cuando era niño.',
      pt: 'Pergunte a alguém mais velho quem cuidava dele quando era criança.',
      en: 'Ask an older person who took care of them as a child.',
    },
  },
  {
    id: 's03',
    tema: { es: 'Música', pt: 'Música', en: 'Music' },
    tu: {
      es: '¿Qué canción no puedes escuchar sin pensar en alguien?',
      pt: 'Que música você não consegue ouvir sem pensar em alguém?',
      en: 'What song can you never hear without thinking of someone?',
    },
    alguien: {
      es: 'Pregúntale a alguien qué canción bailaba cuando tenía tu edad.',
      pt: 'Pergunte a alguém que música ele dançava quando tinha a sua idade.',
      en: 'Ask someone what song they danced to when they were your age.',
    },
  },
  {
    id: 's04',
    tema: { es: 'Giros', pt: 'Viradas', en: 'Turning points' },
    tu: {
      es: '¿Cuál fue el día en que tu vida cambió de rumbo?',
      pt: 'Qual foi o dia em que sua vida mudou de rumo?',
      en: 'What was the day your life changed course?',
    },
    alguien: {
      es: 'Pregúntale a alguien cuál fue la decisión más valiente que tomó.',
      pt: 'Pergunte a alguém qual foi a decisão mais corajosa que ele tomou.',
      en: 'Ask someone about the bravest decision they ever made.',
    },
  },
  {
    id: 's05',
    tema: { es: 'Risa', pt: 'Riso', en: 'Laughter' },
    tu: {
      es: '¿Qué historia cuenta tu familia una y otra vez, y siempre da risa?',
      pt: 'Que história sua família conta sem parar, e sempre faz rir?',
      en: 'What story does your family tell again and again, and it always gets a laugh?',
    },
    alguien: {
      es: 'Pregúntale a alguien qué lo hacía reír cuando era niño.',
      pt: 'Pergunte a alguém o que o fazia rir quando era criança.',
      en: 'Ask someone what made them laugh as a child.',
    },
  },
  {
    id: 's06',
    tema: { es: 'Lugares', pt: 'Lugares', en: 'Places' },
    tu: {
      es: '¿Qué lugar ya no existe, pero sigue vivo en tu memoria?',
      pt: 'Que lugar já não existe, mas continua vivo na sua memória?',
      en: 'What place no longer exists but is still alive in your memory?',
    },
    alguien: {
      es: 'Pregúntale a alguien cómo era su barrio cuando era niño.',
      pt: 'Pergunte a alguém como era o bairro dele quando era criança.',
      en: 'Ask someone what their neighborhood was like when they were a child.',
    },
  },
  {
    id: 's07',
    tema: { es: 'Amor', pt: 'Amor', en: 'Love' },
    tu: {
      es: '¿Cómo supiste que estabas enamorado o enamorada?',
      pt: 'Como você soube que estava apaixonado ou apaixonada?',
      en: 'How did you know you were in love?',
    },
    alguien: {
      es: 'Pregúntale a alguien cómo conoció al amor de su vida.',
      pt: 'Pergunte a alguém como conheceu o amor da vida dele.',
      en: 'Ask someone how they met the love of their life.',
    },
  },
  {
    id: 's08',
    tema: { es: 'Ausencias', pt: 'Ausências', en: 'Absences' },
    tu: {
      es: '¿Qué le dirías hoy a alguien que ya no está?',
      pt: 'O que você diria hoje a alguém que já não está?',
      en: 'What would you say today to someone who is gone?',
    },
    alguien: {
      es: 'Pregúntale a alguien a quién extraña y qué le enseñó esa persona.',
      pt: 'Pergunte a alguém de quem ele sente saudade e o que essa pessoa lhe ensinou.',
      en: 'Ask someone who they miss and what that person taught them.',
    },
  },
  {
    id: 's09',
    tema: { es: 'Objetos', pt: 'Objetos', en: 'Objects' },
    tu: {
      es: '¿Qué objeto guardas aunque ya no sirva para nada?',
      pt: 'Que objeto você guarda mesmo que já não sirva para nada?',
      en: 'What object do you keep even though it no longer serves any purpose?',
    },
    alguien: {
      es: 'Pregúntale a alguien cuál es la cosa más antigua que conserva, y por qué.',
      pt: 'Pergunte a alguém qual é a coisa mais antiga que ele guarda, e por quê.',
      en: 'Ask someone what the oldest thing they keep is, and why.',
    },
  },
  {
    id: 's10',
    tema: { es: 'Raíces', pt: 'Raízes', en: 'Roots' },
    tu: {
      es: '¿Qué te llevaste contigo cuando te fuiste de un lugar?',
      pt: 'O que você levou consigo quando foi embora de um lugar?',
      en: 'What did you take with you when you left a place?',
    },
    alguien: {
      es: 'Pregúntale a alguien de dónde viene su familia y qué trajeron consigo.',
      pt: 'Pergunte a alguém de onde vem a família dele e o que trouxeram consigo.',
      en: 'Ask someone where their family comes from and what they brought with them.',
    },
  },
  {
    id: 's11',
    tema: { es: 'Valentía', pt: 'Coragem', en: 'Courage' },
    tu: {
      es: '¿Cuándo tuviste más miedo y qué hiciste con él?',
      pt: 'Quando você sentiu mais medo e o que fez com ele?',
      en: 'When were you most afraid, and what did you do with that fear?',
    },
    alguien: {
      es: 'Pregúntale a alguien cuál fue el momento más difícil que superó.',
      pt: 'Pergunte a alguém qual foi o momento mais difícil que ele superou.',
      en: 'Ask someone about the hardest moment they ever overcame.',
    },
  },
  {
    id: 's12',
    tema: { es: 'Legado', pt: 'Legado', en: 'Legacy' },
    tu: {
      es: '¿Qué te gustaría que recordaran de ti?',
      pt: 'Pelo que você gostaria de ser lembrado?',
      en: 'What would you like to be remembered for?',
    },
    alguien: {
      es: 'Pregúntale a alguien qué consejo le daría a quien nace hoy.',
      pt: 'Pergunte a alguém que conselho daria a quem nasce hoje.',
      en: 'Ask someone what advice they would give to someone born today.',
    },
  },
];

const PREGUNTA_POR_ID: Record<QuestionId, PreguntaSemana> = Object.fromEntries(
  PREGUNTAS.map((p) => [p.id, p])
) as Record<QuestionId, PreguntaSemana>;

export function isQuestionId(value: unknown): value is QuestionId {
  return typeof value === 'string' && (QUESTION_IDS as readonly string[]).includes(value);
}

export function isQuestionMode(value: unknown): value is QuestionMode {
  return value === 'tu' || value === 'alguien';
}

export function preguntaPorId(id: string | null | undefined): PreguntaSemana | null {
  return isQuestionId(id) ? PREGUNTA_POR_ID[id] : null;
}

/** Texto de la pregunta en el idioma activo. Sin modo, usa el tema. */
export function preguntaTexto(
  id: string | null | undefined,
  mode: string | null | undefined,
  locale: AlmaLocale
): string | null {
  const q = preguntaPorId(id);
  if (!q) return null;
  if (isQuestionMode(mode)) return q[mode][locale];
  return q.tema[locale];
}

export function questionPublicFields(source: {
  questionId?: string | null;
  questionMode?: string | null;
}): { questionId?: QuestionId; questionMode?: QuestionMode } {
  if (!isQuestionId(source.questionId)) return {};
  return {
    questionId: source.questionId,
    ...(isQuestionMode(source.questionMode) ? { questionMode: source.questionMode } : {}),
  };
}

/** Tema, modo y pregunta, en español, para /admin. */
export function preguntaAdminResumen(
  id: string | null | undefined,
  mode: string | null | undefined
): string | null {
  const q = preguntaPorId(id);
  if (!q) return null;
  if (!isQuestionMode(mode)) return q.tema.es;
  const modo = mode === 'alguien' ? PREGUNTA_UI.alguien.es : PREGUNTA_UI.tu.es;
  return `${q.tema.es} · ${modo} · ${q[mode].es}`;
}

function civilParts(isoDate: string): { y: number; m: number; d: number } {
  const [y, m, d] = isoDate.split('-').map(Number);
  return { y: y ?? 0, m: m ?? 0, d: d ?? 0 };
}

function santiagoCivil(date: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PREGUNTA_ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { y: num('year'), m: num('month'), d: num('day') };
}

function civilDayNumber(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/**
 * Semana vigente y las ya pasadas (de la más reciente a la más antigua, sin repetir la vigente).
 * Antes de PREGUNTA_SEMANA_INICIO, la vigente es la semana 1 y no hay anteriores.
 */
export function preguntasDeLaSemana(now = new Date()): {
  vigente: PreguntaSemana;
  anteriores: PreguntaSemana[];
} {
  const start = civilParts(PREGUNTA_SEMANA_INICIO);
  const today = santiagoCivil(now);
  const days = civilDayNumber(today.y, today.m, today.d) - civilDayNumber(start.y, start.m, start.d);
  const elapsed = days < 0 ? 0 : Math.floor(days / 7);
  const currentIndex = elapsed % PREGUNTAS.length;
  const pastCount = Math.min(elapsed, PREGUNTAS.length - 1);
  const anteriores: PreguntaSemana[] = [];
  for (let i = 1; i <= pastCount; i += 1) {
    const idx = (currentIndex - i + PREGUNTAS.length) % PREGUNTAS.length;
    const item = PREGUNTAS[idx];
    if (item) anteriores.push(item);
  }
  return { vigente: PREGUNTAS[currentIndex] ?? PREGUNTAS[0]!, anteriores };
}
