/**
 * Texto editorial del modal "Nuestro propósito" (AlmaMundi).
 */

export const PROPOSITO_TITLE = 'No todo conocimiento se estudia. Parte se atraviesa.';

export const PROPOSITO_SUBTITLE: string = '';

export type PropositoBlock = string | { text: string; bold: string } | { lines: string[] };
export const PROPOSITO_PARAGRAPHS: PropositoBlock[] = [
  'No hablamos de teorías ordenadas en un estante. Hablamos de eso que te pasa y te cambia el paso. De ese instante mínimo en que el mundo se corre un centímetro y ya no vuelve a encajar igual. La experiencia: esa cosa terca que insiste aunque no la invites.',
  'AlmaMundi es un archivo vivo de historias humanas conectadas. Un espacio de escucha, no de ruido.',
  'Por eso no es una red social. La diferencia no es técnica, es filosófica: las redes sociales maximizan el volumen. AlmaMundi maximiza el significado. Sin algoritmos que decidan qué importa, sin likes que distorsionen el peso de las cosas. Una historia de un pescador en Oaxaca ocupa el mismo lugar que la de un empresario en Tokio.',
  'Las redes sociales te conectan con tu burbuja. AlmaMundi te conecta con el mundo que no conoces — porque el punto de entrada es el planeta, no tu círculo.',
];

export const PROPOSITO_CIERRE = 'Eso es AlmaMundi.';
