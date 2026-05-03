# Informe: qué hace AlmaMundi — flujos y acciones

**Alcance:** descripción funcional basada en el código del repositorio `almamundi` (Next.js 16, React 19).  
**No sustituye** políticas legales ni textos legales publicados en `/privacidad`.

---

## 1. Qué es AlmaMundi (propósito en el producto)

AlmaMundi es una **plataforma web** para **descubrir, leer, escuchar y ver historias humanas** asociadas a lugares, con un **mapa/globo** como pieza central de exploración. Las personas pueden **explorar** relatos en varios formatos, **guardar** favoritos, **compartir con cuidado ético** y **enviar mensajes** a quien narra, y **enviar su propia historia** para revisión editorial antes de publicarse.

La página **`/vision`** describe la **hoja de ruta** del proyecto (qué existe hoy y qué está planificado). El pie de página enlaza propósito, cómo funciona, historias, mapa, privacidad, datos personales, visión y guía de conducta.

---

## 2. Superficie del sitio (rutas principales)

| Área | Rutas típicas | Rol |
|------|----------------|-----|
| **Inicio** | `/` | Presentación, intro, acceso a formatos de historias, sección de mapa embebido, modal «Cómo funciona». |
| **Mapa** | `/mapa`, ancla `/#mapa` en home | Globo a pantalla completa (o embebido en home): historias, noticias, sonidos según configuración del cliente. |
| **Historias (público)** | `/historias`, `/historias/videos`, `/audios`, `/escrito`, `/fotos` | Listados con filtros (país, año, palabras clave) y carrusel de exposición; apertura de contenido sin salir de la lista cuando aplica. |
| **Historia por id** | `/historias/[id]`, `/historias/[id]/video`, `/audio`, `/texto`, `/foto` | Ficha o experiencia a pantalla completa según formato. |
| **Mi colección** | `/historias/mi-coleccion` | Historias guardadas en el dispositivo (local). |
| **Subir historia** | `/subir`, `/subir/foto` | Flujo de envío: formato → captura → impronta (huella) → datos del autor → confirmación; integración con almacenamiento y API de envíos. |
| **Temas / archivo / exposiciones** | `/temas`, `/temas/[tema]`, `/archivo`, `/exposiciones`, … | Descubrimiento y vitrinas según implementación de cada página. |
| **Perfil público** | `/perfil`, `/u/[username]` | Presencia de usuario cuando existe. |
| **Privacidad y datos** | `/privacidad`, `/mis-datos-personales` | Aviso de privacidad y solicitud de ejercicio de derechos (formulario + correo al equipo). |
| **Visión** | `/vision` | Roadmap editorial del producto. |
| **Muestras / recorridos / educación** | `/muestras`, `/recorridos`, `/educacion-mediatica`, … | Contenidos o prototipos según ruta. |
| **Administración y curaduría** | `/admin`, `/curaduria` | Herramientas internas (acceso restringido según despliegue). |

Existen además rutas de **demo**, **preview** y **prototipo** (`/preview-home`, `/globo-v2`, etc.) orientadas a desarrollo o pruebas, no al flujo principal del visitante.

---

## 3. Flujos de usuario (visitante → lector → participante)

### 3.1 Descubrimiento (home y mapa)

1. Entra en **`/`**: ve propósito, cómo funciona (modal), tarjetas de formatos, mapa.  
2. Puede ir al **mapa completo** (`/mapa` o `#mapa`) para explorar **puntos** (historias, capas adicionales según UI).  
3. Desde el mapa o listados puede **abrir** una historia concreta.

### 3.2 Lectura y exposición (historias)

1. Navega a **`/historias/...`** (vídeo, audio, escrito, fotos).  
2. **Filtra** por país, año y palabras clave; puede **limpiar filtros**.  
3. Navega el **carrusel** de exposición; al seleccionar una tarjeta puede abrir **reproductor**, **lector** o **álbum** según formato.  
4. Puede usar **compartir ético** (flujo con recordatorio y tarjeta/enlace) y **carta al autor** (buzón de resonancia), cuando la UI los muestra (listados y carrusel según props).

### 3.3 Participación (subir)

1. Entra en **`/subir`** (o flujo foto dedicado).  
2. Elige **formato** (vídeo, audio, texto, foto).  
3. **Captura** contenido (grabación, archivo, texto, imágenes) dentro de límites definidos en código (duración, tamaño, número de fotos, caracteres).  
4. **Impronta**: generación/visualización de huella asociada al relato.  
5. **Formulario**: datos del autor, ubicación, correo obligatorio para avisos, etc.  
6. **Recibido**: confirmación; el relato entra en el circuito de **revisión/publicación** (no es público inmediato salvo lógica demo o excepciones).

### 3.4 Confianza y derechos

1. **`/privacidad`**: lee el aviso.  
2. **`/mis-datos-personales`**: completa el formulario; el backend puede enviar solicitud por **correo** (p. ej. Resend) a la bandeja configurada en entorno.

---

## 4. Acciones concretas en la interfaz

| Acción | Dónde suele aparecer | Qué hace (técnico/UX) |
|--------|----------------------|------------------------|
| **Compartir (ético)** | Carrusel de exposición, filtros de listados de historias | Abre flujo **EthicalShareFlow**: compromiso, copia de enlace, descarga de tarjeta con QR/crédito, uso responsable del relato. |
| **Carta / buzón al autor** | Mismo contexto que compartir | **ResonanceMailbox**: modal; envía mensaje vía API con moderación/filtro (p. ej. reformulación si el contenido no cumple reglas). |
| **Guardar en «Mi colección»** | Historias | Persistencia **local** en el navegador (no sustituye cuenta en servidor salvo que exista otra integración). |
| **Filtros de historias** | `/historias/videos` etc. | Reduce el conjunto mostrado; la selección para compartir sigue la historia **activa** en el carrusel. |
| **Navegación interior de historias** | Cabecera en rutas `/historias/*` | Misma familia visual que la home (pastillas, acordeón de formatos) para saltar entre vídeo, audio, escrito, fotos y mi colección. |
| **Demo / no real** | Mapa, listados, detalle cuando el punto es demo | **DemoStoryDisclosure**: aviso fijo de que el relato es de demostración (copy centralizado en `lib/demo-stories-public.ts`). |
| **Enlaces del footer** | Global | Propósito, cómo funciona, historias (acordeón), mapa, privacidad, mis datos, visión, PDF de guía de conducta. |

---

## 5. Servidor y APIs (acciones del sistema)

Las rutas bajo **`app/api/`** cubren, entre otras cosas:

- **Historias:** listado y detalle (`/api/stories`, `/api/stories/[id]`), similares, lectores, eco, addendum.  
- **Compartir y afecto:** `/api/stories/[id]/share`, `/api/stories/[id]/affective-message`, `/api/stories/[id]/postal`, `/api/stories/[id]/resonance`.  
- **Envíos y medios:** `/api/submit`, `/api/submissions/*`, subida de fotos y medios, impronta (`/api/impronta/analyze`).  
- **Mundo / mapa:** `/api/world`, `/api/world/field/[field]`, textura de globo.  
- **Noticias y pulso:** `/api/news`, `/api/news-live`, `/api/pulse`.  
- **Curaduría y admin:** `/api/curate/*`, `/api/admin/*` (publicación, estadísticas, colecciones, verificación).  
- **Privacidad:** `/api/privacy-data-request`.  
- **Salud:** `/api/health/*`.

La persistencia principal usa **Firebase** (cliente y admin); variables de entorno gobiernan claves, correo y demos públicas.

---

## 6. Mensajes clave para informes externos

- AlmaMundi **no es solo un blog**: combina **archivo de historias**, **mapa** y **flujos de participación** con **revisión editorial**.  
- **Compartir** está diseñado como **ritual ético** (no compartir «a ciegas»).  
- Las **historias de demostración** están **marcadas** para no confundirse con casos reales cuando la demo pública está activa.  
- **Privacidad** y **datos personales** tienen caminos explícitos en el sitio y en API.

---

## 7. Mantenimiento de este documento

Tras cambios grandes de producto, revisar:

- `app/**/page.tsx` (rutas nuevas o retiradas).  
- `components/layout/Footer.tsx` (enlaces globales).  
- `app/api/**/route.ts` (nuevos contratos).

**Stack de referencia (package.json):** Next 16.1.0, React 19.2.3, Firebase 12.x, Tailwind 4, Resend, Sentry, Upstash (rate limit / Redis según uso).
