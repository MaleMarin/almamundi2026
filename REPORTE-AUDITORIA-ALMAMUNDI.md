# REPORTE DE AUDITORÍA — AlmaMundi
**Fecha:** 19 de marzo de 2025

---

## ERRORES DE TIPO (tsc --noEmit)

- **Total:** 0 errores
- **Salida:** Solo advertencia de npm (`Unknown env config "devdir"`), no relacionada con el código.
- **Archivos afectados:** Ninguno
- **Errores críticos:** Ninguno

---

## ARCHIVOS FALTANTES

| Archivo | Estado |
|---------|--------|
| `lib/almamundi/temas.ts` | ✗ (el proyecto usa **lib/temas.ts**, no dentro de almamundi) |
| `lib/almamundi/story-schema.ts` | ✗ (el proyecto usa **lib/story-schema.ts** en la raíz de lib) |
| **app/privacidad/page.tsx** | ✗ **FALTA** — la ruta /privacidad no existe |

El resto de archivos del inventario **existen**:
- ✓ components/historia/VideoPlayer, AudioPlayer, TextoReader, FotoAlbum
- ✓ components/stories/StoriesFanCarousel
- ✓ components/perfil/PerfilPage, MuestraCard, NuevaMuestraModal, GuardadasGrid
- ✓ components/admin/CurationPanel
- ✓ components/subir/AgeGate
- ✓ lib/almamundi/queries.ts, perfil-queries.ts
- ✓ app/historias/videos, [id]/video, [id]/audio, [id]/texto, [id]/foto
- ✓ app/u/[username]/page.tsx, app/perfil/page.tsx, app/admin/page.tsx
- ✓ app/api/curate/publish/route.ts, app/api/stories/route.ts, app/api/stories/[id]/route.ts

---

## PROBLEMAS POR MÓDULO

### Video
- **OK:** onClose, Escape, botón X en intertitle y playing, 3 stages (intertitle → playing → ended), end screen "Ver de nuevo" y "Más historias".
- **Problema:** VideoPlayer **no** usa `ReactDOM.createPortal` en `document.body`; renderiza en el árbol normal. Quien monta en portal es StoriesFanCarousel al envolver a VideoPlayer.
- **Problema:** `app/historias/[id]/video/page.tsx` es **Client Component** ('use client') y carga la historia por fetch a `/api/stories/[id]`, no es Server Component que lea Firestore directamente. Tiene generateMetadata solo vía cliente; la página en sí no tiene generateMetadata (por ser client).

### Audio
- **OK:** onClose, Escape, botón X, ReactDOM.createPortal en document.body, 16 barras (BAR_COUNT=16), frases progresivas, end screen, botones skip ±10s, isMobile con resize.

### Texto
- **OK:** Barra de progreso (scroll listener), drop cap primeras 2 palabras, IntersectionObserver por párrafo, firma autor, botón volver si onClose, tiempoLectura, max-width por breakpoint.
- **OK:** app/historias/[id]/texto/page.tsx es Server Component, redirige si no hay contenido, calcula tiempoLectura.

### Foto
- **OK:** IntersectionObserver foto activa, extractColor canvas 1×1, bgColor transition, Ken Burns, Polaroid en escritorio, indicador puntos, firma autor, isMobile + isTablet.
- **OK:** app/historias/[id]/foto redirige si no hay imágenes y mapea correctamente.

### Carrusel
- **OK:** Estado inicial `Math.floor(stories.length / 2)`, getPos() 3D, filmstrip dots, fondo transparente, teclas ← →, importa VideoPlayer y lo monta en portal.
- **Problemas:**
  - **No** importa AudioPlayer: en modo video solo abre VideoPlayer; para audio llama `onSelectStory` pero no abre AudioPlayer en portal.
  - Al hacer clic en tarjeta central: solo `videoUrl → openCinema`. **No** hay `router.push` para formato texto ni foto; al clicar una historia de texto o foto no se navega a `/historias/[id]/texto` ni `/historias/[id]/foto`.
- **OK:** app/historias/videos usa StoriesFanCarousel, título "El mundo tiene millones de historias...", subtítulo "Estas son algunas.", no duplica título.

### Curación
- **OK:** CurationPanel usa detectarTemas() y TEMAS de lib/temas, temas seleccionables, ubicación y cita editables, Publicar/Rechazar, preview destinos, POST /api/curate/publish con payload correcto.
- **OK:** API curate/publish valida storyId/curadorId/temas, TEMAS_MAP, lee y escribe en colección 'stories', guarda en 'curation_log', retorna formato/temas/publishedAt.
- **Problema crítico:** CurationPanel llama **POST /api/curate/reject**. La ruta **app/api/curate/reject/route.ts no existe** → el botón Rechazar devolverá 404.

### Perfil
- **OK:** Paleta #e8ecf0, acentos naranja #ff6b2b, hero frase editable inline si isOwner, 4 tabs, Tab Muestras con MuestraCard y sentido, "Nueva muestra" si isOwner, Tab Temas desde guardadas, isMobile.
- **OK:** NuevaMuestraModal sentido obligatorio min 20 caracteres, mensaje "Esta es la parte más importante...", createPortal, cierra al click en overlay.
- **OK:** app/u/[username] revalidate 60, getUserByUsername + notFound(), Promise.all, isOwner pasado.

### Datos
- **OK:** lib/temas.ts tiene 20 temas con slug/titulo/descripcion/color/keywords, detectarTemas exportada.
- **OK:** lib/story-schema.ts (en raíz de lib): Formato, detectarFormato, buildStoryPendiente, buildPublishUpdate, FIRESTORE_COLLECTION = 'stories'.
- **OK:** lib/almamundi/queries.ts getStoriesByFormato, getStoriesByTema (array-contains), getStoriesPendientes (pending/reviewing), índices documentados.

### Privacidad
- **Problema crítico:** **app/privacidad/page.tsx no existe.** AgeGate enlaza a `/privacidad#s5` → enlace roto; no hay tabla de permisos por edad ni 10 secciones.

### AgeGate
- **OK:** AgeGroup 'adult'|'minor', menores no video/foto propia, sí texto/audio (con condiciones)/foto otros, useFormatoPermitido exportado, botón confirmar activa estado.

---

## INCONSISTENCIAS VISUALES

- **Fuentes:** Cormorant Garamond + Jost en players de historia ✓. Fraunces + Plus Jakarta Sans en perfil y modales ✓.
- **Paleta historia:** #0d0b09 / #f5f0e8 / #c9a96e usada en VideoPlayer, AudioPlayer, TextoReader, FotoAlbum, carrusel ✓.
- **Paleta perfil/home:** #e8ecf0, naranja #ff6b2b en PerfilPage, NuevaMuestraModal, GuardadasGrid, MuestraCard ✓.
- **Portales:** VideoPlayer se monta en portal desde StoriesFanCarousel; AudioPlayer usa createPortal en document.body. TextoReader y FotoAlbum son página con scroll (no portal) ✓.
- Ninguna inconsistencia grave detectada; rutas de historias y perfil respetan sus paletas.

---

## CONEXIONES ROTAS

1. **POST /api/curate/reject** — CurationPanel llama a esta ruta al rechazar una historia; la ruta **no existe** → 404.
2. **/privacidad** — AgeGate enlaza a `/privacidad#s5`; **app/privacidad/page.tsx no existe** → 404.
3. **Carrusel → Audio / Texto / Foto:** StoriesFanCarousel no importa AudioPlayer ni usa useRouter; al clicar una historia de audio (en modo video) o de texto/foto no se abre reproductor ni se navega a la página correspondiente.

---

## PRIORIDAD DE CORRECCIONES

### CRÍTICO (bloquea funcionalidad)
1. Crear **app/privacidad/page.tsx** con las 10 secciones (incl. tabla permisos por edad, sección 5 menores, sección 6 fotografías) para que el enlace desde AgeGate funcione.
2. Crear **app/api/curate/reject/route.ts** (POST) para que el botón Rechazar del CurationPanel funcione.

### IMPORTANTE (afecta experiencia)
1. En **StoriesFanCarousel**: al clic en tarjeta central según formato — `audioUrl` → abrir AudioPlayer en portal (importar AudioPlayer, estado activeAudio); `texto` / `foto` → `router.push(\`/historias/${s.id}/texto\`)` o `.../foto`.
2. (Opcional) Hacer que **app/historias/[id]/video/page.tsx** sea Server Component que cargue desde Firestore y pase datos al cliente, o documentar que la carga vía API es intencional.

### MENOR (cosmético o secundario)
1. VideoPlayer podría usar createPortal en document.body para consistencia con AudioPlayer (o dejar como está si el diseño actual es válido).
2. Añadir generateMetadata en la página de video si se quiere metadata en servidor (hoy la página es client).

---

## RESUMEN

| Métrica | Valor |
|---------|--------|
| Módulos completamente funcionales | 6/9 (Audio, Texto, Foto, Perfil, Datos, AgeGate) |
| Módulos con problemas menores | 2/9 (Video — portal/metadata; Carrusel — solo video abierto) |
| Módulos con problemas críticos | 2/9 (Curación — reject 404; Privacidad — página inexistente) |

**Conclusión:** La base de tipos está sana y la mayoría de módulos cumple lo esperado. Los dos fallos críticos (privacidad y API reject) y la navegación desde el carrusel a texto/foto/audio deben corregirse antes de considerar la auditoría cerrada. No se han aplicado cambios; las correcciones quedan pendientes de aprobación.
