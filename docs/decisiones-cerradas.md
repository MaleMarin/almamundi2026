# Decisiones cerradas · AlmaMundi

Léelo antes de cada tarea. Nada de esta lista se cambia sin el OK explícito de Ana.
Si un pedido nuevo choca con algo de aquí, pregunta antes de tocarlo. Si al trabajar
ves que algo de esta lista ya no se cumple en el código, avísalo.
Antes de dar por terminado un cambio de textos, busca en TODO el sitio (lib/i18n, componentes, correos)
los textos antiguos equivalentes y cámbialos también.

## Proceso
- Desde el lanzamiento (2 nov 2026) se trabaja sobre main, que publica en almamundi.org. preview/adenda-revision queda igual a main.
- Antes de subir: mostrarle a Ana el texto de lo que se va a hacer y esperar su OK.
- Después de subir: confirmar en Vercel que producción sirve el commit nuevo y revisar en el sitio publicado.
- Un commit por tarea. Nunca commitear .env.local ni tmp-private-backup. Nunca mostrar valores de claves.
- Ningún script que lea o escriba Firestore o Storage sin mostrarle antes a Ana qué hará.
- Gastar poco uso: verificar con capturas solo lo necesario.

## Idioma y textos
- Español latinoamericano neutro: sin voseo y sin rayas (—) como puntuación.
- Frases siempre en positivo y proactivas: nunca empezar con «no» («¿No sabes…?», «Si no sabes…»).
- Todo texto visible va en lib/i18n, en ES, PT-BR y EN. Nada de textos fijos en componentes.
- Los textos aprobados se copian tal cual: no reescribir, resumir ni «mejorar».
- Fechas públicas: solo el año («2026»). Nunca día y mes, nunca «hace X días». El admin sí ve la fecha completa.

## Marca
- Naranja de marca #FF4A1C. Naranja para texto sobre fondo claro (contraste) #B8340F.
- Fondo del sitio hueso claro #F5F4F2. Texto principal #3C4655. Tipografía Montserrat.
- Accesibilidad: contraste 4.5:1, contorno de foco solo con teclado (:focus-visible), respetar «reducir movimiento».
- Responsive siempre: todo cambio se piensa para escritorio y celular.

## Nombres (iguales en todo el sitio)
- «Cuenta tu historia» (botón principal).
- «Preguntas para ti» (nunca «Tira de una cinta», «pregunta de la semana» ni «banco de preguntas»). Lleva a /#cintas, sin submenú.
- «Así respondieron» (respuestas a las preguntas). «Sorpréndeme» (nunca «Al azar»).
- «Imagen de cintas» (es una imagen con muchas cintas, no «una cinta» ni un degradé).
- «Aviso de privacidad» (nunca «Política de privacidad»), «Términos de uso», «Código de conducta» (nunca «Guía»), «Mis datos personales».
- «Iniciativa sin fines de lucro de Precisar» (nunca «proyecto»).
- «Cintas» para los temas de preguntas (nunca «hilos»). Sonder es el boletín.

## Menú superior, pie y logo
- Mismo orden arriba y en el pie: Cuenta tu historia · Preguntas para ti · Historias · Así respondieron · Mapa · ¿Cómo funciona? · Propósito · ES PT EN.
- Menú superior limpio: solo «Cuenta tu historia» con borde; el resto texto simple, mismo grosor, sin cápsulas ni sombras. Idioma activo en círculo oscuro.
- Submenú de Historias: Todas · Videos · Audios · Textos · Fotos.
- Encabezado con aire arriba (alto 88px en escritorio). Tamaño del logo: el del commit 43046c14.
- «Precisar» del pie en gris.

## Home, en este orden
1. CUENTA (hero): frase «AlmaMundi es el lugar donde tus historias no se pierden en el scroll, sino que despiertan otras historias, como la tuya», «Hay muchas formas de contarla», «Elige cómo» y las cuatro tarjetas (no se tocan sus efectos).
2. INSPÍRATE: INSPÍRATE / Elige un tema / Toca una cinta y descubre sus preguntas. La cortina de cintas está SIEMPRE a la vista, también en /contar. 12 temas con sus colores. Responder usa PreguntaForm, sin video.
3. DESCUBRE: DESCUBRE / El Alma del Mundo (64px máx., fino, naranja) / «son las historias de cada persona» / «Conócelas» (sin punto, en su propia línea).
   - Botones: Historias de vida · Lugares que también cuentan · Así respondieron · Sonidos del mundo · Buscar una historia. Los puntos de color van dentro de los botones (sin leyenda aparte).
   - Celular: los cinco botones centrados en filas, todos visibles sin deslizar. Globo completo y centrado en el espacio negro.
4. Sonder: franja discreta (máx. 1080px, borde fino), nunca negra.
5. Cierre: ALMAMUNDI grande, «Cuenta tu historia» y «Preguntas para ti».

## Mapa y globo
- Historias: punto naranja #FF4A1C con luz. Respuestas: anillo naranja. También cuenta: blancos con luz.
- Selección: anillo de latido con halo suave. Nunca amarillo.
- El globo de la portada está siempre de día.
- Panel de una historia: sin «Ver historia completa» y sin la línea de colores.

## Historias
- Historias de texto se abren en modo lectura (/texto).
- Sin barra de colores (CintaStripe) en páginas, catálogo ni galerías.
- Si no hay foto, se muestra la imagen de cintas de la historia (nunca el avatar repetido).
- Filtro por eje oculto por ahora.
- Formulario paso 2: «Una imagen que identifique tu historia» va en la columna izquierda; País y Ciudad, Edad y Género de a dos.

## Después de enviar (historia o respuesta)
- Historia: «[Alias], tu historia llegó.» + «Una persona del equipo la leerá antes de publicarla. Si nos dejaste tu correo, te avisaremos cuando aparezca en el mapa.» Imagen de cintas, Descargar y Compartir.
- «¿Quieres seguir?» con tres botones iguales: Cuenta otra historia · Preguntas para ti · Explorar el mapa.
- Respuesta: «Tu respuesta llegó, [alias]» y la misma lógica de revisión humana.

## Compartir
- Tarjeta de WhatsApp de una historia: la imagen de cintas a pantalla completa con «Conté mi historia en AlmaMundi y estos son sus colores. ¿Cuáles serían los de la tuya?».
- Quien publica: «Conté mi historia en AlmaMundi. Se llama [título] y estos son sus colores. ¿Cuáles serían los de la tuya?» + enlace.
- Invitar a una pregunta: «AlmaMundi tiene una pregunta para ti: [pregunta] ¿Qué responderías?» + enlace.
- Todos los correos llevan botones para contar otra historia, responder preguntas y compartir almamundi.org. El correo de rechazo lleva un solo botón.

## Modales (¿Cómo funciona?, Propósito)
- Misma X en los dos. Se cierran con Esc o tocando afuera. El texto se desplaza por dentro.
- Propósito: un solo texto seguido, sin pestañas y sin la frase sobre Precisar.

## Legal y cookies
- Fuentes: docs/legal/textos-legales-almamundi.md y docs/legal/codigo-de-conducta.md.
- OpenAI figura como proveedor en el Aviso de privacidad (transcripción para la imagen de cintas).
- Google Ads se carga solo si la persona toca «Aceptar» (Consent Mode v2).
- Aviso de cookies: barra ancha (máx. 1080px), Aceptar y Rechazar del mismo tamaño.

## Producto
- Sin selector de audiencia y sin edición de la historia por su autor.
- Mayores de 18 años para enviar historias y respuestas, en cualquier formato.
