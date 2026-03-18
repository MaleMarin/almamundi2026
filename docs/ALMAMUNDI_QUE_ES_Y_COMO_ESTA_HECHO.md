# AlmaMundi — Qué es, qué hace y cómo está hecho

## 1. Qué es AlmaMundi

**AlmaMundi** es un **archivo vivo de historias humanas conectadas al planeta**. No es una red social: la diferencia es de enfoque.

- **Redes sociales:** maximizan volumen, algoritmos y likes; te conectan con tu burbuja.
- **AlmaMundi:** maximiza significado; el punto de entrada es **el mundo**, no tu círculo. Una historia de un pescador en Oaxaca ocupa el mismo lugar que la de un empresario en Tokio.

Frase del sitio: *"No todo conocimiento se estudia. Parte se atraviesa."* — Se trata de experiencias que te cambian, no de teorías en un estante. Es un **espacio de escucha**, no de ruido.

---

## 2. Qué hace el sitio (funcionalidades)

### 2.1 Home (/)

- **Globo terrestre** (vídeo NASA): Tierra girando con atmósfera/nubes, en un círculo. Arrastrar para girar; el vídeo hace autoplay (local `earth-1080p60.mp4`).
- **Franja de fecha/hora/ciudad** (TimeBar): hora local, ciudad (ej. Región Metropolitana) según zona horaria.
- **Dock de acciones:** Historias, Sonidos, Noticias, Bits, Buscar. Al hacer clic se abre un **drawer** lateral con el contenido.
- **Sonido ambiente:** al llegar con scroll al globo se activa sonido de “universo”; el usuario puede activar/desactivar y elegir atmósferas (mar, bosque, ciudad, lluvia, etc.).
- **Navegación por voz** (VoiceNav): comandos para abrir secciones o buscar.
- **Secciones clásicas:** Nuestro propósito (modal), Inspiración (temas y preguntas para contar), Historias, Mapa (enlace a /mapa), Subir (enlace a /subir).

### 2.2 Mapa (/mapa)

- **Globo 3D interactivo** (react-globe.gl + Three.js): texturas día/noche (earth-day.jpg, earth-night), norte arriba, Américas al centro por defecto.
- **Bits:** ~100 puntos fijos en lat/lon (lib/bits-data.ts): lugares del mundo que se pueden seleccionar en el panel “Bits”.
- **Paneles:** Historias, Noticias, Sonidos, Bits. Cada uno se abre en el drawer.
- **Historias publicadas** aparecen en el globo; al hacer clic se abre el visor (título, texto, audio, video, foto).
- **Noticias:** capa de noticias con tema (API /api/world).
- **TimeBar** debajo del globo (misma regla que en home: franja fija, no solapada al canvas).
- **Cámaras en vivo:** enlaces a streams (YouTube, HLS) por ubicación.

### 2.3 Subir historias (/subir, /subir/foto)

- El usuario elige formato: **Video** (YouTube/Vimeo), **Audio**, **Texto** o **Foto**.
- Formulario: alias, email, tema (de una lista de temas), fecha, lugar, contexto, consentimientos (derechos, curaduría, postales).
- Los envíos se guardan en **Firestore** (colección `story_submissions`) vía **POST /api/submit** (y /api/submissions/photo para fotos).
- Estado: `pending` hasta que curaduría los publique.

### 2.4 Curaduría (/curaduria)

- Página interna para el equipo: listar envíos **pendientes** y **publicarlos**.
- Requiere **token** (ADMIN_PUBLISH_TOKEN en .env.local); el token se puede guardar en sessionStorage.
- Al publicar, el envío pasa a la colección **stories** con `status: 'published'` y ya aparece en el mapa y en listados públicos.

### 2.5 Historias públicas

- **/historias** — listado de historias.
- **/historias/[id]** — página de una historia (StoryViewer: título, autor, lugar, texto, audio, video, fotos).
- **/mapa/historias**, **/mapa/historias/[id]** — mismo contenido integrado en la ruta del mapa (incl. modales).

### 2.6 Temas (/temas, /temas/[tema])

- Lista de **temas** (trabajo, familia, lugar, comida, memoria, cuerpo, fe, frontera, migración, comunidad, naturaleza, arte-cultura).
- Cada tema tiene slug, nombre y color. En /temas/[tema] se muestran historias filtradas por ese tema.

### 2.7 Archivo (/archivo)

- Historias con status **archived** (archivo).
- Vistas: por **semana**, por **tema**, **muestras**. Permite explorar el archivo de forma ordenada.

### 2.8 Noticias (/mapa/noticias/[id])

- Detalle de una noticia del mapa (origen: capa de noticias / API world).

### 2.9 Cámaras (/mapa/camaras/[slug])

- Página de una cámara en vivo (embed de YouTube o reproductor HLS).

### 2.10 Exposiciones y muestras

- **/exposiciones**, **/exposiciones/[slug]** — exposiciones.
- **/muestras**, **/muestras/[slug]** — muestras (contenido curado por tema).

### 2.11 Recorridos (/recorridos, /recorridos/[slug])

- Recorridos temáticos (rutas o listas de historias/lugares).

### 2.12 Vista previa y admin

- **/vista-previa** — vista previa de contenido.
- **/admin** — panel admin (verificación, estadísticas, colecciones, historias). Uso interno.

### 2.13 Huella y análisis

- El proyecto incluye un sistema de **“huella”** visual (lib/huella): análisis semántico/emocional (p. ej. con GPT) que traduce una historia en parámetros visuales (bloques, colores, fragmentación). Pensado para visualizaciones alternativas de historias (no necesariamente expuesto en todas las páginas).

---

## 3. Cómo está hecho (tecnología y arquitectura)

### 3.1 Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS 4** (estilos)
- **Firebase:** Firestore (historias, envíos), Storage (archivos subidos), opcionalmente Auth
- **Three.js** y **react-globe.gl** para el globo 3D en /mapa
- **Framer Motion** para animaciones
- **Zod** para validación de esquemas
- **Resend** para envío de emails (postales, notificaciones)
- **OpenAI** (opcional) para análisis de historias / huella
- **HLS.js** para streaming (cámaras)
- **RSS-parser** para fuentes de noticias

### 3.2 Estructura principal

```
app/
  page.tsx              → Home (globo NASA, dock, drawer, propósito, inspiración)
  layout.tsx            → Layout raíz (lang=es, fondo oscuro)
  mapa/page.tsx         → Página del mapa (MapFullPage)
  mapa/historias/       → Listado y detalle de historias en contexto mapa
  historias/            → Listado y detalle de historias (páginas normales)
  temas/                → Temas y filtro por tema
  subir/, subir/foto/   → Formularios de envío
  archivo/              → Archivo (historias archivadas)
  curaduria/            → Curaduría (publicar envíos)
  exposiciones/, muestras/, recorridos/
  api/                  → Rutas API (submit, stories, curate, world, etc.)

components/
  map/                  → HomeMap, MapFullPage, MapCanvas, VideoGlobe, MapDock, MapDrawer, TimeBar, panels (Stories, News, Sounds, Bits)
  NASAEpicEarthVideo.tsx, NASAEarthVideo.tsx  → Vídeo globo home
  VoiceNav.tsx          → Navegación por voz
  mapa/                 → StoryViewer, WorldClock, etc.
  globe/                → Componentes globo 3D

lib/
  proposito-text.ts     → Textos del propósito
  map-data/             → stories, stories-server (Firestore), types, bits
  bits-data.ts          → 100 puntos Bits (lat, lon, lugar, país)
  firebase/             → client, admin, upload, types
  sound/ambient.ts      → Sonido ambiente (mar, universo, ciudad, etc.)
  themes.ts, temas-list.ts
  huella/               → analyze, translate, types (análisis y huella visual)
  world/                → API mundo (noticias, etc.)
```

### 3.3 Flujo de datos

- **Envíos:** formulario (subir) → POST /api/submit (o /api/submissions/photo) → Firestore `story_submissions` (pending).
- **Publicación:** curaduría usa /api/curate/submissions y /api/curate/publish o /api/admin/publish → documento en `stories` con status `published`.
- **Lectura de historias:** Server: getStoriesAsync() desde Firestore (stories-server.ts). Cliente: getStories / getStoryById vía API (ej. /api/stories, /api/stories/[id]).
- **Mapa:** historias publicadas + BITS_DATA se pintan en el globo; noticias vía /api/world.

### 3.4 Reglas de diseño (del proyecto)

- **Mapa (home y /mapa):** degradado solo bajo el título “Mapa de AlmaMundi”; el Dock va dentro del contenedor del mapa (UniverseStage), no como franja superior. TimeBar en franja propia debajo del globo, sin solaparlo.
- **Globo:** norte arriba; en home vídeo NASA girando; en /mapa globo 3D con texturas día/noche y auto-rotación.
- **Checkpoint:** cuando algo se da por “listo”, se recomienda commit (chore: checkpoint).
- **Sin placeholders:** código completo; no inventar archivos ni APIs.

### 3.5 Configuración importante

- **Firebase:** `.env.local` con FIREBASE_SERVICE_ACCOUNT_BASE64 (o FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) para que los envíos se guarden y las historias se lean desde Firestore.
- **Curaduría:** ADMIN_PUBLISH_TOKEN en .env.local; en /curaduria se envía en header `x-admin-token`.
- **Índice Firestore:** colección `stories` con índice compuesto (status, publishedAt) para las consultas; ver firestore.indexes.json y `firebase deploy --only firestore:indexes`.

---

## 4. Resumen en una frase

**AlmaMundi** es un sitio que pone **el planeta como punto de entrada**: un globo (home y mapa) desde el que se exploran **historias humanas** (texto, audio, video, foto) enviadas por la gente, curadas por un equipo y organizadas por lugar, tema y tiempo, con sonido ambiente y navegación por voz, sin likes ni algoritmos de engagement — pensado para escucha y significado, no para volumen.
