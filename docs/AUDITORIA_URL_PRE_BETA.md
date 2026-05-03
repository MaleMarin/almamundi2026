# Auditoría por URL — AlmaMundi (producto público, pre-beta)

**Alcance:** revisión basada en **código y copy fuente** del repositorio; no sustituye prueba manual en dispositivos reales ni revisión legal.  
**Checkpoint de referencia mencionado por el equipo:** `91416d48` (asumido publicado en remoto).  
**Fecha del diagnóstico:** 2026-05-01.

---

## Hallazgos transversales (afectan a más de una URL)

| # | Problema | Gravedad | Solución recomendada | Dónde corregir |
|---|-----------|----------|----------------------|----------------|
| T1 | **Kicker naranja** en listados de historias: para audio, texto y foto el texto sigue siendo **«Historias en video»** (misma constante para los cuatro formatos). | **Alta** | Definir kickers por formato: p. ej. «Historias en audio», «Historias en texto», «Historias en fotografía». | `lib/historias/historias-format-list-ui.ts` (`historiasListFormatOrangeKicker`) |
| T2 | **Etiqueta del carrusel** (`HISTORIAS_LIST_EXPO_LABEL`): en **todas** las rutas de formato dice **«alma.mundi / historias en video»**, incluso en `/historias/audios`, `/escrito`, `/fotos`. | **Alta** | Etiquetas por formato coherentes con la pestaña activa. | `lib/historias/historias-format-list-ui.ts` + pasar desde cada `page.tsx` si hace falta |
| T3 | **«Beta pública»** vs **historia demo:** en código, demo usa `DEMO_STORY_LABEL` / aviso sin «beta»; **visión** incluye línea «Beta pública — …». Coherencia **correcta** a nivel de criterio; conviene que **ningún otro** surface muestre «beta» salvo `/vision`. | Baja | Revisión visual rápida en staging (grep `beta` / `Beta` en `*.tsx` visibles). | Búsqueda global + revisión |
| T4 | **Footer** enlaza **«Política de privacidad»** pero la página se titula **«Aviso de Privacidad»**. | **Media** | Unificar etiqueta del enlace con el H1 (p. ej. «Aviso de privacidad») o aclarar «Aviso de privacidad (antes política…)» si negocio lo pide. | `components/layout/Footer.tsx` |
| T5 | **Carta al autor:** leyenda **«…(con moderación)»** sugiere moderación humana amplia; la API `affective-message` aplica **filtro de tono (IA)** y guarda en Firestore **sin** garantizar entrega al autor ni revisión humana explícita en el mensaje. | **Media** | Ajustar copy a lo real: p. ej. «…El mensaje se revisa con un filtro automático de respeto y queda registrado para el equipo.» o similar acordado con producto. | `lib/historias/historias-format-list-ui.ts` (`HISTORIAS_SHARE_ICONS_LEGEND`) + texto del modal en `components/stories/ResonanceMailbox.tsx` si hace falta |
| T6 | **Tono «usted» vs «tú»:** en flujo ético aparece **«podrá»**; en otros sitios predominan **«tú»** / **«vos»**. | Baja | Unificar voseo o tuteo según linea editorial (Argentina / neutro). | `components/stories/EthicalShareFlow.tsx` |
| T7 | Uso frecuente de la palabra **«archivo»** (visión, roadmap, metadatos): puede sonar **fría** frente al criterio de preferir *memoria viva / relatos / colección*. | **Media** | Sustituir o alternar en `/vision` y metadata: p. ej. «colección viva», «relatos reunidos», «memoria compartida». | `app/vision/page.tsx`, `ROADMAP` en el mismo archivo, `metadata.description` |
| T8 | **Historias demo:** dependen de `NEXT_PUBLIC_SHOW_DEMO_STORIES` y de datos; cuando están activas, `DemoStoryDisclosure` es clara. Si la variable es `false`, no hay demos en cliente — **riesgo** de globo/listas vacías sin explicación. | **Media** (operación) | Documentar en despliegue y, si aplica, copy cuando no hay historias públicas. | `lib/demo-stories-public.ts`, paneles de mapa/listado |

---

## `/` (inicio)

| Campo | Contenido |
|--------|-------------|
| **URL** | `/` |
| **Función** | Presentar propósito, intro, tarjetas de formatos, sección de mapa embebido, modal «Cómo funciona»; acceso al resto del sitio vía header/footer. |
| **Problemas detectados** | 1) **Candado de diseño** en home: no se audita aquí cambio visual; solo producto/copy. 2) No se detectó **inglés visible** obvio en los fragmentos revisados del cliente home. 3) Contraste/foco/móvil: requiere **prueba manual** (regla: no inferir de código). |
| **Gravedad** | Baja (pendiente verificación manual). |
| **Solución recomendada** | Checklist manual: foco visible en tarjetas y modal, lectura en 360px, contraste del hero. |
| **Archivo / componente** | `components/home/HomePageClient.tsx`, `HomeFirstPart.tsx`, `ComoFuncionaModal.tsx` |
| **Texto sugerido** | — |

---

## `/historias`

| Campo | Contenido |
|--------|-------------|
| **URL** | `/historias` |
| **Función** | Reexporta **la misma página** que `/historias/videos` (mismo carrusel y hero de vídeo). |
| **Problemas detectados** | **Dos URLs** con la misma experiencia de **vídeo** puede confundir (SEO, enlaces compartidos, expectativa de “índice” de todos los formatos). |
| **Gravedad** | Media |
| **Solución recomendada** | Opción A: redirección 308 de `/historias` → `/historias/videos`. Opción B: página índice mínima con cuatro enlaces a formatos. |
| **Archivo / componente** | `app/historias/page.tsx` |
| **Texto sugerido** | Si se crea índice: breve párrafo «Elegí un formato para explorar relatos.» |

---

## `/historias/videos`

| Campo | Contenido |
|--------|-------------|
| **URL** | `/historias/videos` |
| **Función** | Listado con filtros, carrusel de exposición, apertura de reproductor; compartir ético + buzón según historia activa. |
| **Problemas detectados** | 1) Compartir ético: viñeta **«Tu historia es tuya»** en contexto de **compartir la historia de otra persona** — puede interpretarse como si el visitante fuera el autor. 2) Hallazgos **T1, T2, T5, T6** si aplica. |
| **Gravedad** | Media (copy); T1/T2 no aplican errores de formato en esta ruta concreta. |
| **Solución recomendada** | Reformular viñeta hacia quien **narra** vs quien **difunde**. | `components/stories/EthicalShareFlow.tsx` (paso ethics) |
| **Texto sugerido** | Sustituir por algo como: «**Quien narra** decide publicar aquí y puede pedir retirar su relato cuando quiera.» |

---

## `/historias/audios`

| Campo | Contenido |
|--------|-------------|
| **URL** | `/historias/audios` |
| **Función** | Igual que vídeo pero filtra historias con audio y abre reproductor de audio. |
| **Problemas detectados** | **T1** (kicker «Historias en video»), **T2** (expo «…en video»), T5/T6. |
| **Gravedad** | **Alta** (etiquetas incorrectas del producto). |
| **Solución recomendada** | Corregir constantes por formato (ver transversal). |
| **Archivo / componente** | `lib/historias/historias-format-list-ui.ts`, `app/historias/audios/page.tsx` |
| **Texto sugerido** | Kicker: «Historias en audio». Expo: p. ej. «alma.mundi / historias en audio». |

---

## `/historias/escrito`

| Campo | Contenido |
|--------|-------------|
| **URL** | `/historias/escrito` |
| **Función** | Carrusel + lectura de texto en la misma experiencia. |
| **Problemas detectados** | Mismos que audios: **T1**, **T2**. |
| **Gravedad** | **Alta** |
| **Solución recomendada** | Idem audios. |
| **Archivo / componente** | `lib/historias/historias-format-list-ui.ts`, `app/historias/escrito/page.tsx` |
| **Texto sugerido** | «Historias en texto» / «…en texto» (o «escrito» si preferís una sola palabra en toda la UI). |

---

## `/historias/fotos`

| Campo | Contenido |
|--------|-------------|
| **URL** | `/historias/fotos` |
| **Función** | Carrusel + álbum fotográfico. |
| **Problemas detectados** | **T1**, **T2**. |
| **Gravedad** | **Alta** |
| **Solución recomendada** | Idem. |
| **Archivo / componente** | `lib/historias/historias-format-list-ui.ts`, `app/historias/fotos/page.tsx` |
| **Texto sugerido** | «Historias en fotografía» / «…en fotografía». |

---

## `/historias/mi-coleccion`

| Campo | Contenido |
|--------|-------------|
| **URL** | `/historias/mi-coleccion` |
| **Función** | Muestra historias **guardadas en el navegador**; copiar enlace, ir a subir inspirado, quitar. |
| **Problemas detectados** | 1) Estado vacío: solo menciona **«Videos o Audios»** para guardar — **ignora** texto y fotos si el guardado existe allí. 2) Mezcla **voseo** («Compartilas») con **tuteo** («has guardado», «haz clic»). 3) «Compartir» aquí es **solo copiar URL**, no el flujo ético completo — puede **desalinearse** con la promesa de “compartir con respeto” en listados. |
| **Gravedad** | Media |
| **Solución recomendada** | Ampliar texto vacío a los cuatro formatos; unificar persona gramatical; aclarar «Copiar enlace» vs «Compartir con resguardo». |
| **Archivo / componente** | `app/historias/mi-coleccion/page.tsx` |
| **Texto sugerido** | Vacío: «En **Videos, Audios, Escritos o Fotos**, elegí una historia y **Guardar en mi colección**.» Botón: renombrar a **«Copiar enlace»** si no abre el flujo ético. |

---

## `/mapa`

| Campo | Contenido |
|--------|-------------|
| **URL** | `/mapa` |
| **Función** | Mapa/globo a pantalla completa: exploración de historias y capas previstas por `MapFullPage` / dock / drawer. |
| **Problemas detectados** | 1) **Demo:** panel de historias usa `DemoStoryDisclosure` cuando aplica — coherente con criterio. 2) Complejidad UI: **accesibilidad** (teclado, foco en canvas, contraste en overlays) requiere **auditoría manual** y quizá herramientas (axe, Lighthouse). 3) No se listó inglés usuario en `StoriesPanel` (placeholders en español). |
| **Gravedad** | Media (a11y hasta verificar). |
| **Solución recomendada** | Sesión de prueba con teclado + VoiceOver/ TalkBack; revisar orden de foco al abrir drawer. |
| **Archivo / componente** | `components/map/MapFullPage.tsx`, `HomeMap.tsx`, `components/map/panels/StoriesPanel.tsx` |
| **Texto sugerido** | — |

---

## `/subir`

| Campo | Contenido |
|--------|-------------|
| **URL** | `/subir` |
| **Función** | Flujo por pasos: elegir formato → captura → impronta → datos → confirmación; subida a almacenamiento y envío a curación/API. |
| **Problemas detectados** | 1) **No** se explica en el **primer bloque** (tarjetas) que el relato **pasa por revisión editorial** antes de publicarse (el criterio pedía esto explícito temprano). 2) Mensaje final: **«Te avisaremos por email»** — palabra **«email»** en inglés; mejor «correo». 3) Tras envío: «**Quedó en revisión**» es correcto pero **no** detalla plazos ni canal (gestionar expectativa). |
| **Gravedad** | Media |
| **Solución recomendada** | Añadir 1–2 frases en cabecera de `/subir` o bajo el hero de tarjetas sobre **revisión previa a publicación**; sustituir «email» → «correo». |
| **Archivo / componente** | `app/subir/page.tsx` (paso `cards` y mensaje `received`) |
| **Texto sugerido** | Ej.: «**Antes de verse en el mapa o en Historias**, cada envío es **revisado por el equipo** de AlmaMundi. Te escribiremos al **correo** que indiques.» |

---

## `/privacidad`

| Campo | Contenido |
|--------|-------------|
| **URL** | `/privacidad` |
| **Función** | Aviso de privacidad por secciones; enlace a solicitud de datos personales. |
| **Problemas detectados** | 1) **T4** (nombre en footer vs H1). 2) No hay enlace explícito en el cuerpo a **/vision** ni a la **Guía de conducta** (pueden quedar solo en footer — **coherencia** mejorable si el aviso debe “cerrar el círculo” con conducta y roadmap). 3) Revisión legal **externa** al código. |
| **Gravedad** | Media (coherencia); legal según abogado. |
| **Solución recomendada** | Párrafo breve al final: «Para el rumbo del proyecto: **La visión de AlmaMundi**. Para normas de uso respetuoso: **Guía de conducta** (PDF).» |
| **Archivo / componente** | `app/privacidad/page.tsx`, `components/layout/Footer.tsx` |
| **Texto sugerido** | Ver arriba; adaptar a voseo si unificáis «vos» en todo el sitio. |

---

## `/mis-datos-personales`

| Campo | Contenido |
|--------|-------------|
| **URL** | `/mis-datos-personales` |
| **Función** | Formulario para solicitudes ARCO-like vía API y correo al equipo. |
| **Problemas detectados** | 1) Coherencia con footer: el footer dice «Política…» y aquí el contexto es «Privacidad» — **T4**. 2) Variable de entorno: si el envío falla, el copy ya sugiere `hola@almamundi.org` — bien. 3) **Mobile:** formulario largo — verificar **scroll** y **teclado** en iOS (manual). |
| **Gravedad** | Baja–Media |
| **Solución recomendada** | Misma unificación de nombres; prueba móvil del formulario. |
| **Archivo / componente** | `app/mis-datos-personales/MisDatosPersonalesForm.tsx`, `app/api/privacy-data-request/route.ts` |
| **Texto sugerido** | Incluir enlace «**Volver al Aviso de Privacidad**» arriba del formulario. |

---

## `/vision`

| Campo | Contenido |
|--------|-------------|
| **URL** | `/vision` |
| **Función** | Explicar propósito y **hoja de ruta** con estados (Disponible / En desarrollo / A futuro); **única** línea explícita de **«Beta pública»** (alineado con criterio de separar beta de producto vs demos). |
| **Problemas detectados** | 1) **T7** — repetición de «archivo» / «archivo vivo» / «Archivo sonoro» / «archivos familiares». 2) `metadata.description` incluye **«archivo vivo»** — mismo tono. 3) Coherencia con **revisión editorial** ya mencionada en el cuerpo — **bien**; mantener alineado con `/subir` cuando mejoréis el copy allí. |
| **Gravedad** | Media (tono) |
| **Solución recomendada** | Sustituciones puntuales por «colección viva», «relatos en audio reunidos», etc., sin perder claridad. |
| **Archivo / componente** | `app/vision/page.tsx` (ROADMAP + párrafos + `metadata`) |
| **Texto sugerido** | Ej. roadmap ítem 1: «…puede encontrar un lugar en esta **colección viva** de relatos.» Ítem «Archivo sonoro» → «**Memoria sonora**» o «**Relatos en voz**». |

---

## Resumen de gravedades (conteo aproximado)

- **Alta:** errores de **etiqueta de formato** en audios / escrito / fotos (T1, T2).  
- **Media:** coherencia footer–privacidad, copy de moderación del buzón, tono «archivo», `/historias` duplicado, `/subir` sin editorial en apertura, mezcla de personas en mi colección, visión/ética/compartir.  
- **Baja:** tuteo/voseo, «podrá», verificación manual a11y/móvil en home y mapa.

---

## Próximos pasos sugeridos (sin implementar aún)

1. Corregir **T1 + T2** antes de beta pública (impacto directo en credibilidad del producto).  
2. Ajustar **leyenda del buzón** (T5) y, si aplica, el interior del modal.  
3. Unificar **nombres** Aviso vs Política (T4).  
4. Añadir **revisión editorial** visible al inicio de `/subir` y «correo» en lugar de «email».  
5. **Pase manual** móvil + Lighthouse accesibilidad en `/`, `/mapa`, `/historias/*`, `/subir`.

*Fin del diagnóstico — sin cambios de código en el repositorio como parte de esta entrega.*
