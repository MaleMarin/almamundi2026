/**
 * Palabras y frases (sin acentos, minúsculas) → id de concepto 1–100.
 * Las frases de 2+ palabras se prueban antes que las de una.
 */

export function foldResonanceToken(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ENTRIES: readonly { id: number; words: readonly string[] }[] = [
  { id: 1, words: ['amor', 'amar', 'amo', 'amas', 'amaba', 'amamos', 'amado', 'amada', 'amores', 'querer', 'querido', 'querida', 'carino', 'carinoso', 'enamorar', 'enamorado', 'enamorada', 'enamorarse'] },
  { id: 2, words: ['ternura', 'tierno', 'tierna', 'mimo', 'mimos', 'dulzura', 'dulce', 'cariñito', 'carinito', 'suave'] },
  { id: 3, words: ['alegria', 'alegre', 'feliz', 'felicidad', 'gozo', 'gozar', 'risa', 'reir', 'rei', 'sonrisa', 'contento', 'contenta', 'jubilo'] },
  { id: 4, words: ['esperanza', 'esperar', 'espero', 'esperaba', 'ilusion', 'ilusionado', 'ilusionada', 'fe futura', 'porvenir'] },
  { id: 5, words: ['calma', 'calmo', 'paz', 'tranquilo', 'tranquila', 'tranquilidad', 'sereno', 'serena', 'sosiego'] },
  { id: 6, words: ['gratitud', 'gracias', 'agradecido', 'agradecida', 'agradecer', 'agradezco'] },
  { id: 7, words: ['orgullo', 'orgulloso', 'orgullosa', 'honra', 'honrado', 'honrada', 'dignidad'] },
  { id: 8, words: ['asombro', 'asombrado', 'asombrada', 'maravilla', 'maravillado', 'maravillosa', 'asombrar', 'sorpresa', 'sorprendido', 'sorprendida', 'asombro'] },
  { id: 9, words: ['deseo', 'desear', 'deseaba', 'ansia', 'anhelo', 'anhelar', 'ganas', 'pasion'] },
  { id: 10, words: ['alivio', 'aliviar', 'aliviado', 'aliviada', 'descanso', 'sosiego'] },
  { id: 11, words: ['nostalgia', 'nostalgico', 'nostalgica', 'añoranza', 'anoranza', 'añorar', 'anorar', 'echar de menos', 'extrañar', 'extranar', 'extrano', 'extrana', 'extrane', 'extranamos'] },
  { id: 12, words: ['tristeza', 'triste', 'pena', 'penar', 'llanto', 'llorar', 'llore', 'lloraba', 'melancolia'] },
  { id: 13, words: ['duelo', 'luto', 'luto', 'perdida irreparable', 'viudez', 'viudo', 'viuda'] },
  { id: 14, words: ['rabia', 'rabioso', 'ira', 'enojo', 'enojado', 'enojada', 'furia', 'furioso', 'bronca', 'odio', 'odiar'] },
  { id: 15, words: ['miedo', 'miedoso', 'temor', 'temer', 'susto', 'asustado', 'asustada', 'pánico', 'panico', 'terror'] },
  { id: 16, words: ['ansiedad', 'ansioso', 'ansiosa', 'angustia', 'angustiado', 'nervios', 'nervioso', 'nerviosa', 'inquietud'] },
  { id: 17, words: ['culpa', 'culpable', 'remordimiento', 'arrepentido', 'arrepentida', 'arrepentir'] },
  { id: 18, words: ['verguenza', 'avergonzado', 'avergonzada', 'pena ajena', 'humillacion', 'humillado'] },
  { id: 19, words: ['soledad', 'solo', 'sola', 'solitario', 'solitaria', 'abandono', 'abandonado', 'abandonada'] },
  { id: 20, words: ['desespero', 'desesperacion', 'desesperado', 'desesperada', 'sin salida', 'hundido', 'hundida'] },
  { id: 21, words: ['familia', 'familiar', 'familiares', 'hogar familiar', 'clan', 'parientes'] },
  { id: 22, words: ['madre', 'mama', 'mami', 'mamita', 'viejita', 'vieja', 'mamá'] },
  { id: 23, words: ['padre', 'papa', 'papi', 'papito', 'viejo', 'papá'] },
  { id: 24, words: ['hijo', 'hija', 'hijos', 'hijas', 'hijito', 'hijita', 'niño', 'nino', 'niña', 'nina'] },
  { id: 25, words: ['hermano', 'hermana', 'hermanos', 'hermanas', 'hermanito', 'hermanita'] },
  { id: 26, words: ['abuelo', 'abuela', 'abuelos', 'abuelas', 'abuelito', 'abuelita', 'nona', 'nono'] },
  { id: 27, words: ['ancestro', 'ancestros', 'antepasados', 'antepasado', 'linaje', 'raices', 'raíz'] },
  { id: 28, words: ['amistad', 'amigo', 'amiga', 'amigos', 'amigas', 'amiguito', 'compa', 'compañero', 'companero', 'compañera'] },
  { id: 29, words: ['pareja', 'esposo', 'esposa', 'marido', 'novio', 'novia', 'esposos', 'compañero de vida'] },
  { id: 30, words: ['amor perdido', 'ex', 'expareja', 'ex marido', 'ex esposa', 'dejo de quererme', 'ya no me quiere'] },
  { id: 31, words: ['comunidad', 'pueblo junto', 'colectivo', 'barrio unido', 'asamblea'] },
  { id: 32, words: ['vecino', 'vecina', 'vecinos', 'vecinas', 'vecindad'] },
  { id: 33, words: ['maestro', 'maestra', 'maestros', 'profesor', 'profesora', 'docente', 'profe'] },
  { id: 34, words: ['desconocido', 'desconocida', 'desconocidos', 'forastero', 'forastera'] },
  { id: 35, words: ['nacimiento', 'nacer', 'naci', 'nació', 'nacio', 'parto', 'recien nacido', 'alumbramiento'] },
  { id: 36, words: ['infancia', 'niñez', 'ninez', 'niño', 'infante', 'de chico', 'de chica', 'cuando era niño'] },
  { id: 37, words: ['adolescencia', 'adolescente', 'pubertad', 'quinceaños', 'quince años'] },
  { id: 38, words: ['juventud', 'joven', 'jovenes', 'veinteaños', 'los veinte'] },
  { id: 39, words: ['adultez', 'adulto', 'adulta', 'madurez', 'mayor de edad'] },
  { id: 40, words: ['vejez', 'anciano', 'anciana', 'viejo ya', 'tercera edad'] },
  { id: 41, words: ['muerte', 'morir', 'murio', 'murió', 'fallecio', 'falleció', 'fallecer', 'se fue', 'se murio', 'se murió', 'entierro', 'funeral'] },
  { id: 42, words: ['embarazo', 'embarazada', 'embarazado', 'gestacion', 'vientre', 'esperando un bebe', 'esperando un bebé'] },
  { id: 43, words: ['primer amor', 'primer novio', 'primera novia', 'el primero que ame'] },
  { id: 44, words: ['independencia', 'independiente', 'irme de casa', 'me fui de casa', 'solo me mantengo'] },
  { id: 45, words: ['crecer', 'creci', 'creció', 'crecio', 'crecimiento', 'madurar', 'madure'] },
  { id: 46, words: ['envejecer', 'envejezco', 'envejeciendo', 'arrugas', 'canas'] },
  { id: 47, words: ['viaje', 'viajar', 'viajé', 'viaje', 'viajamos', 'viajero', 'viajera', 'excursión', 'excursion'] },
  { id: 48, words: ['migracion', 'migrar', 'migre', 'inmigrante', 'emigrante', 'emigrar', 'me vine', 'cruzar el pais'] },
  { id: 49, words: ['exilio', 'exiliado', 'exiliada', 'desterrado', 'desterrada', 'refugio', 'refugiado'] },
  { id: 50, words: ['regreso', 'regresar', 'volvi', 'volví', 'volver', 'volviendo', 'retornar', 'retorno'] },
  { id: 51, words: ['frontera', 'limite', 'aduana', 'paso fronterizo'] },
  { id: 52, words: ['casa', 'hogar', 'hogares', 'vivienda', 'departamento', 'depto', 'cuarto'] },
  { id: 53, words: ['barrio', 'vecindario', 'poblacion', 'población', 'villa', 'pobla'] },
  { id: 54, words: ['ciudad', 'urbe', 'capital', 'metropoli', 'metrópoli'] },
  { id: 55, words: ['campo', 'rural', 'finca', 'parcela', 'chacra', 'rancho'] },
  { id: 56, words: ['pueblo', 'aldeas', 'aldea', 'pueblito'] },
  { id: 57, words: ['camino', 'sendero', 'ruta', 'carretera', 'senda', 'anduve'] },
  { id: 58, words: ['despedida', 'despedir', 'adiós', 'adios', 'me fui', 'se fue', 'chao', 'hasta luego'] },
  { id: 59, words: ['sol', 'soleado', 'amanecio el sol', 'luz del sol'] },
  { id: 60, words: ['luna', 'lunar', 'plenilunio', 'luna llena'] },
  { id: 61, words: ['estrella', 'estrellas', 'estrellado', 'constelacion'] },
  { id: 62, words: ['amanecer', 'alba', 'madrugada', 'amanece', 'amanecio'] },
  { id: 63, words: ['atardecer', 'ocaso', 'puesta de sol', 'atardecia'] },
  { id: 64, words: ['noche', 'nocturno', 'anoche', 'de noche', 'anochecer'] },
  { id: 65, words: ['mar', 'oceano', 'océano', 'marino', 'olas', 'marea'] },
  { id: 66, words: ['playa', 'arena', 'costa', 'litoral', 'orilla'] },
  { id: 67, words: ['rio', 'río', 'riachuelo', 'arroyo', 'caudal'] },
  { id: 68, words: ['montaña', 'montana', 'cerro', 'cumbre', 'andina', 'andes'] },
  { id: 69, words: ['bosque', 'selva', 'arboles', 'árboles', 'arbol', 'árbol', 'monte'] },
  { id: 70, words: ['desierto', 'arena seca', 'dunas', 'arido'] },
  { id: 71, words: ['lluvia', 'llover', 'llovio', 'llovía', 'llovizna', 'aguacero'] },
  { id: 72, words: ['nieve', 'nevar', 'nevado', 'nevada', 'copos'] },
  { id: 73, words: ['viento', 'ventoso', 'brisa', 'rafaga'] },
  { id: 74, words: ['fuego', 'llama', 'llamas', 'incendio', 'hoguera', 'brasas'] },
  { id: 75, words: ['tierra', 'suelo', 'barro', 'polvo', 'terruño', 'terruno'] },
  { id: 76, words: ['trabajo', 'trabajar', 'trabajé', 'laburo', 'empleo', 'jornada', 'oficina'] },
  { id: 77, words: ['oficio', 'oficios', 'artesano', 'artesana', 'taller', 'oficiar'] },
  { id: 78, words: ['estudio', 'estudios', 'estudiar', 'estudié', 'estudiaba', 'aprender'] },
  { id: 79, words: ['escuela', 'colegio', 'escolar', 'primaria', 'secundaria', 'liceo'] },
  { id: 80, words: ['universidad', 'universitario', 'facultad', 'campus', 'carrera universitaria'] },
  { id: 81, words: ['dinero', 'plata', 'plata', 'sueldo', 'salario', 'billete', 'pesos'] },
  { id: 82, words: ['pobreza', 'pobre', 'miseria', 'no alcanza', 'sin recursos'] },
  { id: 83, words: ['desempleo', 'desempleado', 'desempleada', 'cesante', 'sin trabajo', 'quedé sin trabajo'] },
  { id: 84, words: ['jubilacion', 'jubilación', 'jubilado', 'jubilada', 'pension', 'pensión', 'retirado'] },
  { id: 85, words: ['sueño', 'sueno', 'proyecto', 'meta', 'ilusion de vida', 'quiero lograr'] },
  { id: 86, words: ['fracaso', 'fracasar', 'fracase', 'falle', 'no pude', 'se vino abajo'] },
  { id: 87, words: ['libro', 'libros', 'leer', 'leí', 'lei', 'lectura', 'novela', 'poema'] },
  { id: 88, words: ['cine', 'pelicula', 'película', 'film', 'filme', 'pantalla'] },
  { id: 89, words: ['musica', 'música', 'cancion', 'canción', 'cantar', 'canto', 'melodia', 'guitarra'] },
  { id: 90, words: ['danza', 'bailar', 'baile', 'bailé', 'bailarina', 'coreografia'] },
  { id: 91, words: ['teatro', 'obra de teatro', 'escenario', 'actriz', 'actor'] },
  { id: 92, words: ['pintura', 'pintar', 'pintor', 'pintora', 'cuadro', 'lienzo'] },
  { id: 93, words: ['fotografia', 'fotografía', 'foto', 'fotos', 'fotografiar', 'camara', 'cámara'] },
  { id: 94, words: ['cocina', 'cocinar', 'comida', 'receta', 'guiso', 'horno', 'sabor'] },
  { id: 95, words: ['deporte', 'futbol', 'fútbol', 'jugar', 'partido', 'equipo', 'correr'] },
  { id: 96, words: ['fiesta', 'festejar', 'celebrar', 'cumple', 'cumpleaños', 'reunión'] },
  { id: 97, words: ['carnaval', 'cumbia', 'comparsa', 'corso', 'mascara'] },
  { id: 98, words: ['fe', 'dios', 'iglesia', 'rezar', 'oración', 'oracion', 'milagro', 'sagrado'] },
  { id: 99, words: ['idioma', 'lengua', 'lenguaje', 'hablar', 'castellano', 'quechua', 'guarani', 'portugues'] },
  { id: 100, words: ['tradicion', 'tradición', 'costumbre', 'ritual', 'herencia cultural', 'folclor', 'folclore'] },
];

const PHRASE_MAP = new Map<string, number>();
const WORD_MAP = new Map<string, number>();
let maxPhraseLen = 1;

for (const { id, words } of ENTRIES) {
  for (const raw of words) {
    const folded = foldResonanceToken(raw);
    if (!folded) continue;
    const parts = folded.split(' ');
    if (parts.length > 1) {
      PHRASE_MAP.set(folded, id);
      if (parts.length > maxPhraseLen) maxPhraseLen = parts.length;
    } else {
      if (!WORD_MAP.has(folded)) WORD_MAP.set(folded, id);
    }
  }
}

export function matchResonanceConcept(tokens: string[], index: number): { id: number; consumed: number } | null {
  const max = Math.min(maxPhraseLen, tokens.length - index);
  for (let n = max; n >= 2; n--) {
    const phrase = tokens.slice(index, index + n).join(' ');
    const id = PHRASE_MAP.get(phrase);
    if (id != null) return { id, consumed: n };
  }
  const one = WORD_MAP.get(tokens[index] ?? '');
  if (one != null) return { id: one, consumed: 1 };
  return null;
}
