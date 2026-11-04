# Cintas v2

Metodología final del prototipo. No cambia el envío de relatos, la cinta que ya está en producción, Firebase ni Vercel. Vive en la rama `exp/cintas-v2`. El código de composición está en `lib/cintas-v2/`. Los guiones que arman las hojas están en `scripts/cintas-v2/`. Las historias de prueba están en `scripts/cintas-v2/fixtures/` y no las usa el sitio.

Cada relato se analiza una vez. El resultado queda en un JSON privado, en `tmp-cintas-v2/analisis/`. Ese JSON no lleva nombres de personas. La cinta se vuelve a dibujar desde ese archivo, sin llamar al modelo. Recomponer cuesta 0.

El análisis no se publica. Sirve para armar la cinta y, si hace falta, para revisarlo en administración.

Las cintas son privadas. La persona las recibe en la pantalla final y por correo apenas envía su relato. No se publican en el mapa ni en ninguna página pública. La semilla de la historia alcanza para elegir la paleta.

## Paleta madre

Está congelada en `lib/cintas-v2/paleta-madre.ts`. Son 12 tonos por 5 niveles, 60 colores. No se cambia salvo pedido explícito.

Tonos: rojo, naranja, amarillo, lima, verde, verde azulado, calipso, azul, azul violeta, morado, magenta, rosa.

Niveles: 1 Profundo, 2 Pleno, 3 Vivo, 4 Claro, 5 Muy claro.

No hay blanco, crema, negro, gris ni beige. Las cintas no llevan negro. El amarillo y la lima son más luminosos que el azul y el morado: esa luz es la natural del tono, no un defecto. El violeta es el morado en nivel Vivo.

El ancho de la cinta es 1080 px. La forma (racimos, pausas y modo) sale del trazado. El color de esas franjas sale de las reglas de abajo.

## Reglas de color

El protagonista es el color propio más importante de la historia. Si no hay ninguno, lo pone la paleta de respaldo y la cinta dice «Tu historia, en colores».

**Color propio real.** Un objeto elige tono solo si la historia dice su color (cocina amarilla, vaso azul, río color té) o si el color es típico y universal: mar, cielo, pasto, maíz, tomate, limón, sangre. La nieve, el blanco y el negro no cuentan. Un perro, una radio, una cortina, una carta, una casa o un patio, sin color dicho, no eligen tono.

El jardín, el campo, la vegetación y el cielo de fondo no pueden ser protagonistas, salvo que su importancia llegue a 0,75. El protagonista es el color propio de mayor importancia que no sea paisaje. Si el texto no trae color propio, un color medido de la foto o del video puede serlo. En el video, los colores medidos entran aunque el texto también nombre un color.

**La luz no es un color.** Amanecer, sol, sombra, noche, brillo y palabras parecidas suben o bajan la luminosidad. No eligen un tono. Una imagen no lleva tono y luz a la vez.

**Emoción, luz e intensidad.** La valencia media de los momentos (si no hay, la valencia del ánimo) elige la luz de la casilla. Por debajo de un tercio es profunda, hasta dos tercios es media, y por encima es luminosa. La activación elige la intensidad del mismo modo: calma, media o intensa. Dentro de la cinta, la valencia de cada momento elige el nivel, de Profundo a Muy claro. Si la valencia media baja de 0,40, la historia no usa Claro ni Muy claro.

**Ley de la extensión.** El ancho sale de la luminosidad real del color (OKLCH), no del número de nivel. Un color oscuro puede ocupar más. Un color luminoso ocupa menos. El protagonista va del 25 % al 35 % del ancho: 25 % si es luminoso y 35 % si es oscuro. Cada secundario queda cerca del 15 % y no pasa del 20 %. Cada acento queda en 5 % o menos. El protagonista no forma un solo bloque de más del 12 %.

**Jerarquía.** Una cinta lleva un protagonista, hasta tres secundarios y hasta tres acentos. Entran al menos cinco tonos y al menos dos acentos. Si la historia ya tiene protagonista, la paleta de respaldo completa lo que falta y no lo reemplaza.

**Vecinos.** Dos franjas juntas se separan si el tono cambia bastante (al menos 28 grados) o si la luz cambia lo suficiente. Si dos del mismo tono quedan pegadas, entra un hilo de otro tono. En la hoja en grises se ve el ritmo de la luz: los saltos de claro a oscuro tienen que ocurrir en al menos el 45 % de los pares vecinos.

**Campos claros.** Con la luminosidad real, ningún color luminoso forma una franja de más del 10 % del ancho. Cuentan todos los amarillos, todas las limas, y todo lo que esté en Claro o Muy claro. Una pausa clara y ancha se repinta en un nivel más bajo. El amarillo pálido (amarillo Claro o Muy claro) entra en 10 de las 36 paletas como máximo.

## Paletas de respaldo

Son 36, tomadas solo de la paleta madre. Están en `lib/cintas-v2/compose/paletas-respaldo.ts`. Cada una tiene de 5 a 7 colores: un protagonista, dos o tres secundarios y dos o tres acentos. El protagonista nunca es Claro ni Muy claro. Hay al menos cuatro tonos, cálidos y fríos, y claros y oscuros.

La casilla luminosa usa sobre todo Vivo y Claro, con un ancla oscura, salvo en calma. La casilla profunda usa sobre todo Profundo y Pleno, con un acento Vivo. En calma los niveles quedan cerca y hay como máximo un acento fuerte. En intensa los niveles se alejan: hay Profundo y también Claro o Muy claro. Las cuatro paletas de una casilla tienen protagonistas de tonos distintos.

La semilla de la historia elige una de las cuatro. La misma historia vuelve a caer en la misma paleta.

Luminosa y calma: Mañana de Cartagena, Patio de limones, Calle de las flores, Tarde en el cerro.

Luminosa y media: Malecón de tarde, Feria de domingo, Mercado de Oaxaca, Enero en el valle.

Luminosa e intensa: Fiesta en la cordillera, Después de la lluvia, Río de la selva, Flor de noviembre.

Media y calma: Cenote al mediodía, Siesta de patio, Tarde en la vereda, Huerta en calma.

Media y media: Plaza de naranjos, Cielo de Cusco, Viñedo de altura, Cocina de campo.

Media e intensa: Carnaval de Barranquilla, Sol de la quebrada, Tormenta corta, Volcán al amanecer.

Profunda y calma: Noche en el valle, Selva cerrada, Taller al anochecer, Sombra del jardín.

Profunda y media: Madrugada en el pueblo, Fogón de barro, Noche junto al río, Casa en penumbra.

Profunda e intensa: Tormenta en el limonar, Relámpago en el cerro, La mina al anochecer, Farol en el puerto.

## Control de deriva

En el total de las 17 cintas de prueba, ningún tono pasa del 15 % del ancho. Si alguno lo pasa, la ronda no se da por cerrada. La última medición, después de sacar el fucsia de las dos paletas calmas, quedó así:

| Tono | Parte |
| --- | --- |
| Rojo | 6,7 % |
| Naranja | 13,3 % |
| Amarillo | 8,4 % |
| Lima | 4,0 % |
| Verde | 10,1 % |
| Verde azulado | 11,4 % |
| Calipso | 7,1 % |
| Azul | 12,5 % |
| Azul violeta | 8,5 % |
| Morado | 8,1 % |
| Magenta | 2,3 % |
| Rosa | 7,5 % |

Ningún campo claro pasó del 10 %. Ninguna historia de valencia baja usó Claro ni Muy claro.

## Costos observados

Precios públicos de octubre de 2026. La lectura del relato usa gpt-6.1-sol: 2 USD por millón de tokens de entrada y 10 USD por millón de salida, con razonamiento medio, una sola vez. La visión usa gpt-4.1-mini: 0,40 USD y 1,60 USD por millón. La transcripción usa whisper-1: 0,006 USD por minuto.

Una historia de texto salió entre 0,004 y 0,017 USD. Recomponer las 17 cintas costó 0. Estos son los últimos costos guardados de cada historia de prueba, no una llamada nueva:

| Historia | USD |
| --- | --- |
| El domingo del patio | 0,0155 |
| La silla de más | 0,0147 |
| La radio de verano | 0,0166 |
| El río temprano | 0,0115 |
| La noche del tren | 0,0122 |
| La ventana que abre | 0,0123 |
| A janela da rua de cima | 0,0152 |
| The yellow kitchen | 0,0136 |
| La mesa llena | 0,0166 |
| La silla vacía | 0,0163 |
| El amor | 0,0044 |
| Luz de patio | 0,0064 |
| Zxq vrm | 0,0085 |
| Audio de prueba | 0,0183 |
| Video de prueba | 0,0481 |
| Foto de prueba 1 | 0,0082 |
| Foto de prueba 2 | 0,0081 |

El audio suma la lectura y cerca de un minuto de transcripción. El video suma la lectura, unos dos minutos y medio de transcripción y la visión de seis cuadros. En las dos fotos el archivo guarda solo la lectura: la visión no se volvió a llamar y quedó en 0. El total guardado de las 17 es cerca de 0,25 USD.

Para volver a dibujar sin llamar al modelo:

```
node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/run-ronda10.ts
```

La hoja queda en `tmp-cintas-v2/salida/`. Esa carpeta no se sube a git.

## Pendientes para integrar

Proyecto propio de AlmaMundi en OpenAI, con su propia clave. El prototipo usó una clave local. Esa clave no se sube a Vercel ni al repositorio.

El correo sale cuando la cinta está lista. El análisis tarda de unos segundos a cerca de un minuto. La pantalla final puede esperar ese tiempo. El correo no sale antes de tener la cinta.

Si el análisis falla, la persona igual recibe sus cintas, armadas con una paleta de respaldo. No se queda sin cinta. En el prototipo, si el modelo no responde, hoy entra un diccionario de respaldo y la cinta se dibuja igual. Al integrar, el respaldo tiene que ser la paleta de la casilla, no un mensaje de error.

Probar el circuito completo con las primeras historias reales antes de dejarlo en el sitio.
