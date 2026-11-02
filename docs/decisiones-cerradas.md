# Decisiones cerradas · AlmaMundi

Léelo antes de cada tarea. Nada de esta lista se cambia sin el OK explícito de Ana.
Si un pedido nuevo choca con algo de aquí, pregunta antes de tocarlo. Si al trabajar
ves que algo de esta lista ya no se cumple en el código, avísalo.

## Proceso
- Rama de trabajo: preview/adenda-revision. main solo con OK de Ana.
- Antes de cada push: borrar .next y npm run build limpio. Si falla, no hay push. Después, confirmar Ready en Vercel.
- Un commit por tarea. Nunca commitear .env.local ni tmp-private-backup. Nunca mostrar valores de claves.
- Ningún script que lea o escriba Firestore o Storage sin mostrarle antes a Ana qué hará.
- Un solo servidor local, en el puerto 3005.
- Todo el contenido actual del sitio es de prueba y se borrará antes del lanzamiento.

## Idioma y textos
- Español latinoamericano neutro: sin voseo y sin rayas (—) como puntuación.
- Todo texto visible va en lib/i18n, en ES, PT-BR y EN. Nada de textos fijos en componentes.
- Los textos aprobados se copian tal cual: no reescribir, resumir ni «mejorar».

## Marca
- Naranja de marca #FF4A1C. Naranja para texto sobre fondo claro (contraste) #B8340F.
- Fondo del sitio hueso claro #F5F4F2. Texto principal #3C4655. Tipografía Montserrat.
- Accesibilidad: contraste 4.5:1, contorno de foco solo con teclado (:focus-visible), respetar «reducir movimiento».

## Nombres (iguales en todo el sitio)
- «Cuenta tu historia» (botón principal).
- «Aviso de privacidad» (nunca «Política de privacidad»), «Términos de uso», «Código de conducta» (nunca «Guía»), «Mis datos personales».
- «Iniciativa sin fines de lucro de Precisar» (nunca «proyecto»).
- «Cintas» para los temas de preguntas (nunca «hilos»). Sonder es el boletín.

## Menú superior y logo
- Tamaño del logo AlmaMundi: el del commit 43046c14. No achicarlo.
- Menú: Propósito · ¿Cómo funciona? · Historias · Mapa · Cuenta tu historia · ES PT EN.

## Home, en este orden
1. CUENTA (hero)
   - Frase: «AlmaMundi es el lugar donde tus historias no se pierden en el scroll, sino que despiertan otras historias, como la tuya».
   - Debajo, separadas: «Hay muchas formas de contarla» (32px antes), «Elige cómo» (16px antes), tarjetas (32px antes).
   - Cuatro tarjetas de formato con sus efectos propios: NO se tocan los efectos.
   - Escritorio: las cuatro tarjetas completas, con su botón, en la primera pantalla. Celular: van debajo y se llega bajando.
2. INSPÍRATE (cortina de cintas)
   - Texto: INSPÍRATE / Elige un tema / Toca una cinta y descubre sus preguntas.
   - Cortina en canvas, del ancho de la hero, con movimiento de viento suave. El fondo es el mismo del sitio.
   - 12 temas: Infancia #FFD000, Familia #FF6200, Amor #FF1A1A, Amistad #FF7EB6, Crecer y criar #A8E000, Aprender #00B140, Trabajo #0047FF, Creencias #7A12E0, Los que ya no están #B07CFF, Justicia #FF0A8A, Viajes #00C2D6, Historia #A0003C. «Al azar» no es una cinta.
   - Panel del tema en formato ÍNDICE: las 8 preguntas en lista y un acordeón con Escríbela · Cuéntala con tu voz · Con una foto. Sin flechas ni puntos.
   - Responder usa el formulario simple (PreguntaForm, /api/respuestas), sin video. Nunca manda a /contar.
3. DESCUBRE (mapa)
   - DESCUBRE / El Alma del Mundo / Cada historia merece ser conocida.
   - Botones: Historias · También cuenta · Respuestas · Sonidos · Buscar. En celular, dos filas: tres botones arriba y Sonidos · Buscar abajo.
   - Leyenda en el MISMO orden que los botones: ● Historias · ○ También cuenta: datos curiosos de lugares · ○ Respuestas.
   - Degradé de 80px hacia el globo.
4. Sonder: franja clara (#FBFAF8, borde #8A847C), nunca negra.
5. Cierre: ALMAMUNDI grande, «Cuenta tu historia» y el menú separado por «·».

## Mapa y globo
- Historias: punto naranja #FF4A1C con luz (no rojo). Respuestas: anillo naranja. También cuenta: blancos con luz.
- Selección: anillo delicado de 1.5px #FF4A1C con halo suave. Nunca amarillo.
- El globo de la portada está siempre de día y su aspecto actual es el definitivo.
- Las respuestas se abren en el mismo panel que las historias.
- Panel de una historia: «Ver historia completa» aparece solo si el panel muestra un extracto.
- El botón de sonido no tapa la X de ningún panel. El sonido es suave.

## Modales (¿Cómo funciona?, Propósito)
- Misma X en los dos (44×44px, ícono de 20px #3C4655). Se cierran con Esc o tocando afuera.
- El texto se desplaza por dentro (rueda, dedo y teclado). La página de fondo no se mueve.
- Propósito no lleva la frase sobre Precisar.

## Legal y cookies
- Fuentes de los textos: docs/legal/textos-legales-almamundi.md y docs/legal/codigo-de-conducta.md.
- Los cuatro documentos usan la misma plantilla y terminan con el bloque «Documentos legales».
- Código de conducta: una sola página web. El PDF largo es interno (docs/interno/).
- Google Ads se carga solo si la persona toca «Aceptar» (Consent Mode v2, todo «denied» por defecto).
- Aviso de cookies: barra baja y ancha, con Aceptar y Rechazar del mismo tamaño, y «Preferencias de cookies» en el pie.
- Pie: «© AlmaMundi 2026 · Precisar es una iniciativa de la Fundación Democracia Abierta», con Precisar enlazado a precisar.net. El logo PRECISAR también enlaza ahí.

## Producto
- Sin selector de audiencia y sin edición de la historia por su autor: el sitio no decide por las personas.
- Sin función de «sin autoplay». «Sorpréndeme» queda oculto hasta que haya historias reales.
- Mayores de 18 años para enviar historias y respuestas, en cualquier formato.
