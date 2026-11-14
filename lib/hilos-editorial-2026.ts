/** Contenido editorial revisado de Inspírate. No borrar IDs ni respuestas históricas. */
import type { AlmaLocale } from '@/lib/i18n/locale';
import type { Hilo, PreguntaHilo } from '@/lib/hilos';
export const FRASES_HILOS: Record<string, Record<AlmaLocale, string>> = {
  "infancia": {
    "es": "Todo era nuevo, incluso lo de siempre.",
    "pt": "Tudo era novo, até o de sempre.",
    "en": "Everything was new, even the familiar."
  },
  "familia": {
    "es": "Cada familia tiene historias que nadie más podría contar.",
    "pt": "Cada família tem histórias que ninguém mais poderia contar.",
    "en": "Every family has stories no one else could tell."
  },
  "amor": {
    "es": "No hay dos maneras iguales de querer.",
    "pt": "Não há duas formas iguais de amar.",
    "en": "No two ways of loving are exactly alike."
  },
  "amistad": {
    "es": "Algunas personas llegan y cambian nuestra historia.",
    "pt": "Algumas pessoas chegam e mudam nossa história.",
    "en": "Some people arrive and change our story."
  },
  "crecer": {
    "es": "Mientras crecemos, también aprendemos de los demás.",
    "pt": "Enquanto crescemos, também aprendemos com os outros.",
    "en": "As we grow, we learn from others, too."
  },
  "aprender": {
    "es": "Algunas cosas se entienden mucho después.",
    "pt": "Algumas coisas só entendemos muito depois.",
    "en": "Some things only make sense much later."
  },
  "trabajo": {
    "es": "Hay historias que no caben en un currículum.",
    "pt": "Há histórias que não cabem em um currículo.",
    "en": "Some stories do not fit on a résumé."
  },
  "justicia": {
    "es": "Lo justo y lo injusto también tienen historias propias.",
    "pt": "O justo e o injusto também têm suas próprias histórias.",
    "en": "Fairness and unfairness have stories of their own."
  },
  "viajes": {
    "es": "Un viaje no siempre termina cuando regresamos.",
    "pt": "Uma viagem nem sempre termina quando voltamos.",
    "en": "A journey does not always end when we return."
  },
  "historia": {
    "es": "La historia tiene fechas. También tiene voces.",
    "pt": "A história tem datas. Também tem vozes.",
    "en": "History has dates. It has voices, too."
  },
  "musica": {
    "es": "Una canción puede guardar un día entero.",
    "pt": "Uma canção pode guardar um dia inteiro.",
    "en": "A song can hold an entire day."
  },
  "deportes": {
    "es": "Hay cosas que no aparecen en el marcador.",
    "pt": "Há coisas que não aparecem no placar.",
    "en": "Some things never appear on the scoreboard."
  },
  "arte-cultura": {
    "es": "El mundo también se cuenta a través de lo que creamos.",
    "pt": "O mundo também é contado por meio do que criamos.",
    "en": "We also tell the world through what we create."
  },
  "tecnologia": {
    "es": "Cada nueva pantalla cambia algo fuera de ella.",
    "pt": "Cada nova tela muda algo fora dela.",
    "en": "Every new screen changes something beyond it."
  },
  "actualidad": {
    "es": "Lo que pasa afuera también nos pasa.",
    "pt": "O que acontece lá fora também acontece conosco.",
    "en": "What happens out there happens to us, too."
  },
  "naturaleza-clima": {
    "es": "Los paisajes cambian. Nuestras historias también.",
    "pt": "As paisagens mudam. Nossas histórias também.",
    "en": "Landscapes change. So do our stories."
  }
};
export const HILOS_NUEVOS: Hilo[] = [
  {
    "id": "musica",
    "nombre": {
      "es": "Música",
      "pt": "Música",
      "en": "Music"
    },
    "color": "#7A12E0",
    "imagen": "/cintas/web/morado.webp",
    "aspecto": 0.2522
  },
  {
    "id": "deportes",
    "nombre": {
      "es": "Deportes",
      "pt": "Esportes",
      "en": "Sports"
    },
    "color": "#B07CFF",
    "imagen": "/cintas/web/lila.webp",
    "aspecto": 0.19
  },
  {
    "id": "arte-cultura",
    "nombre": {
      "es": "Arte y cultura",
      "pt": "Arte e cultura",
      "en": "Art and culture"
    },
    "color": "#DBA81D",
    "imagen": "/cintas/web/amarillo.webp",
    "aspecto": 0.2211
  },
  {
    "id": "tecnologia",
    "nombre": {
      "es": "Tecnología",
      "pt": "Tecnologia",
      "en": "Technology"
    },
    "color": "#278D46",
    "imagen": "/cintas/web/verde.webp",
    "aspecto": 0.26
  },
  {
    "id": "actualidad",
    "nombre": {
      "es": "Actualidad",
      "pt": "Atualidades",
      "en": "Current events"
    },
    "color": "#CF4C12",
    "imagen": "/cintas/web/naranja.webp",
    "aspecto": 0.2222
  },
  {
    "id": "naturaleza-clima",
    "nombre": {
      "es": "Naturaleza y clima",
      "pt": "Natureza e clima",
      "en": "Nature and climate"
    },
    "color": "#1A8684",
    "imagen": "/cintas/web/calipso.webp",
    "aspecto": 0.26
  }
];
export const PREGUNTAS_FUTURO: PreguntaHilo[] = [
  {
    "id": "infancia-futuro",
    "hiloId": "infancia",
    "nivel": "empezar",
    "texto": {
      "es": "¿Cómo imaginas que será la infancia de quienes nazcan dentro de 30 años?",
      "pt": "Como você imagina que será a infância de quem nascer daqui a 30 anos?",
      "en": "What do you imagine childhood will be like for those born in 30 years?"
    }
  },
  {
    "id": "familia-futuro",
    "hiloId": "familia",
    "nivel": "empezar",
    "texto": {
      "es": "¿Cómo imaginas que serán las familias en el futuro?",
      "pt": "Como você imagina que serão as famílias no futuro?",
      "en": "What do you imagine families will be like in the future?"
    }
  },
  {
    "id": "amor-futuro",
    "hiloId": "amor",
    "nivel": "empezar",
    "texto": {
      "es": "¿Cómo imaginas que las personas vivirán el amor en el futuro?",
      "pt": "Como você imagina que as pessoas vão viver o amor no futuro?",
      "en": "How do you imagine people will experience love in the future?"
    }
  },
  {
    "id": "amistad-futuro",
    "hiloId": "amistad",
    "nivel": "empezar",
    "texto": {
      "es": "¿Cómo imaginas que se harán y mantendrán las amistades en el futuro?",
      "pt": "Como você imagina que as amizades vão começar e se manter no futuro?",
      "en": "How do you imagine friendships will begin and last in the future?"
    }
  },
  {
    "id": "crecer-futuro",
    "hiloId": "crecer",
    "nivel": "empezar",
    "texto": {
      "es": "¿Cómo imaginas que será crecer y cuidar a otras personas en el futuro?",
      "pt": "Como você imagina que será crescer e cuidar de outras pessoas no futuro?",
      "en": "What do you imagine growing up and caring for others will be like in the future?"
    }
  },
  {
    "id": "aprender-futuro",
    "hiloId": "aprender",
    "nivel": "empezar",
    "texto": {
      "es": "¿Cómo imaginas que aprenderán las personas en el futuro?",
      "pt": "Como você imagina que as pessoas vão aprender no futuro?",
      "en": "How do you imagine people will learn in the future?"
    }
  },
  {
    "id": "trabajo-futuro",
    "hiloId": "trabajo",
    "nivel": "empezar",
    "texto": {
      "es": "¿Cómo imaginas que será el trabajo en el futuro?",
      "pt": "Como você imagina que será o trabalho no futuro?",
      "en": "What do you imagine work will be like in the future?"
    }
  },
  {
    "id": "justicia-futuro",
    "hiloId": "justicia",
    "nivel": "empezar",
    "texto": {
      "es": "¿Qué te gustaría que fuera más justo en el mundo del futuro?",
      "pt": "O que você gostaria que fosse mais justo no mundo do futuro?",
      "en": "What would you like to be fairer in the world of the future?"
    }
  },
  {
    "id": "viajes-futuro",
    "hiloId": "viajes",
    "nivel": "empezar",
    "texto": {
      "es": "¿Cómo imaginas que viajaremos y conoceremos otros lugares en el futuro?",
      "pt": "Como você imagina que vamos viajar e conhecer outros lugares no futuro?",
      "en": "How do you imagine we will travel and discover other places in the future?"
    }
  },
  {
    "id": "historia-futuro",
    "hiloId": "historia",
    "nivel": "empezar",
    "texto": {
      "es": "¿Qué te gustaría que las personas del futuro supieran sobre nuestra época?",
      "pt": "O que você gostaria que as pessoas do futuro soubessem sobre nossa época?",
      "en": "What would you like people in the future to know about our time?"
    }
  }
];
export function fraseInteriorHilo(hiloId: string | null | undefined, locale: AlmaLocale): string | null {
  return hiloId ? FRASES_HILOS[hiloId]?.[locale] ?? null : null;
}
