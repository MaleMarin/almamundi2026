# Cintas v2

Prototipo aparte del sitio. No cambia el envío de relatos, la cinta que ya está en producción, Firebase ni Vercel. Vive en la rama `exp/cintas-v2`. El código de composición está en `lib/cintas-v2/`. Los guiones que arman las hojas están en `scripts/cintas-v2/`. Las historias de prueba, inventadas y anteriores, están en `scripts/cintas-v2/fixtures/` y no las usa el sitio.

## De dónde sale cada cinta

Cada relato se analiza una vez. El resultado queda en un JSON privado, en `tmp-cintas-v2/analisis/`. Ese JSON no lleva nombres de personas. La cinta se dibuja otra vez a partir de ese archivo, sin volver a llamar al modelo. El costo de recomponer es 0.

El análisis no se publica. Sirve para armar la cinta y, si hace falta, para revisarlo en administración.

## El ancho

El ancho de la cinta es 1080 px. Cada familia de emoción ocupa un ancho según el peso que tiene en el análisis. Ninguna familia pasa del 40 % del ancho. La calma es una emoción más: no crece solo porque el relato esté en modo calma.

## La forma

El modo cambia la forma, no la emoción.

- Calma: los colores de las emociones del relato se aclaran. Los racimos quedan más separados. Los silencios ocupan como máximo el 25 % del ancho.
- Intensa: predominan las líneas finas y el color pleno.
- Triste: los campos son más anchos y el color sigue siendo el de la emoción.
- Poco contenido: relatos muy breves. Los silencios no pasan del 15 % del ancho.

El amor en modo calma sigue siendo rosa y carmín, más claro. No se vuelve turquesa.

Las mentas, los verdes agua, los turquesas, los calipsos y los celestes (matiz entre 150° y 210°) no pasan del 8 % del ancho, silencios incluidos. Ese tope no corre cuando el asombro es la emoción principal: ahí el turquesa puede ocupar más. En el resto de la paleta ese tono no existe. La calma usa pervinca, lavanda, salvia, arena, durazno y rosa. La esperanza usa lima, verde hoja y amarillo. La nostalgia usa azul pizarra en lugar del petróleo.

## Colores

No hay blanco, crema, negro ni gris. Cada color, también los que vienen de una foto, tiene luminosidad entre 22 % y 80 % y saturación de al menos 40 %.

No hay líneas blancas ni crema entre las franjas. El pie de la hoja, con el título, queda fuera de la cinta.

## Silencios

Cada silencio toma el color que más ancho ocupa en el racimo de su izquierda y lo aclara, conservando el tono. La luminosidad queda entre 62 % y 78 % y la saturación entre 45 % y 70 %. En los tonos cálidos la saturación no baja de 65 %, para que no quede beige. Esos valores varían de un silencio a otro.

Dos silencios seguidos de la misma historia nunca usan el mismo tono.

El primer 3 % y el último 3 % de la cinta son color pleno. La cinta no empieza ni termina en silencio. Los silencios quedan entre racimos.

## Fotos

De cada foto se toman cinco colores dominantes. Cada uno se acerca a la paleta: 30 % del color real y 70 % del color de paleta más cercano. Esas mezclas van en franjas finas. Las emociones que ve el análisis de la imagen se mezclan con las del JSON (70 % imagen, 30 % texto guardado) solo al dibujar. El JSON no se reescribe.

## Volver a dibujar

Desde la raíz del repositorio, sin llamar al modelo:

```
node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/run-ronda6e.ts
```

La hoja queda en `tmp-cintas-v2/salida/hoja-general-ronda-6e.png`. Esa carpeta no se sube a git.

## Paletas de respaldo en el sitio

Cuando una historia no trae un color propio, entra en una casilla de ánimo. La luz de la casilla sale de la valencia y la intensidad sale de la activación. Cada casilla tiene cuatro paletas. La semilla de la historia elige una de las cuatro.

Las cintas son privadas. La persona las recibe en la pantalla final y por correo apenas envía su relato. No se publican en el mapa ni en ninguna página pública. La elección de paleta por semilla de la historia es suficiente.
