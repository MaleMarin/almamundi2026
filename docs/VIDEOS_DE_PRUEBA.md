# Cómo subir y usar videos de prueba en AlmaMundi

## Dónde salen los videos en el sitio

- **`/historias/videos`** (CinemaGallery): muestra historias con video. Si no hay ninguna desde la API, se usan las **videos de demostración** definidas en código.
- Esas demos viven en **`lib/demo-video-stories.ts`** y pueden usar:
  - Archivos en **`public/`** (rutas como `/nombre.mp4`), o
  - URLs públicas de vídeo (MP4 u otro formato que acepte `<video src>`).

---

## Opción 1: Videos locales (recomendada para prueba)

1. **Pon el archivo de video en la carpeta `public/`**
   - Ejemplo: `public/mi-historia.mp4`
   - Formatos que suelen funcionar: MP4 (H.264), WebM.

2. **Añade una entrada en `lib/demo-video-stories.ts`**
   - Copia un bloque existente de `DEMO_VIDEO_STORIES` y cambia:
     - `id`: único, ej. `'demo-video-6'`
     - `videoUrl`: ruta pública del archivo, ej. `'/mi-historia.mp4'`
     - `title`, `authorName`, `city`, `country`, `label`, etc.
   - Opcional: `imageUrl` con una imagen en `public/` para la miniatura (si no, se puede usar el propio `videoUrl` o dejar que el reproductor use el primer frame).

3. **Reinicia el servidor de desarrollo** si estaba corriendo (`npm run dev`).

Así el video queda de prueba en `/historias/videos` mientras no haya historias con video llegando desde la API.

---

## Opción 2: URLs externas (MP4 en un servidor/CDN)

Si el video está en una URL pública (ej. un CDN o tu propio servidor) que devuelve un MP4 directo (no una página de YouTube/Vimeo):

1. En `lib/demo-video-stories.ts` añade una entrada con:
   - `videoUrl: 'https://tu-dominio.com/ruta/al-video.mp4'`
   - El resto de campos igual que en las demás demos.

Nota: enlaces de **YouTube o Vimeo** no se pueden usar como `src` directo de `<video>`. Para esos, el flujo actual del sitio es usar la página **Subir** (`/subir`) y pegar la URL; el backend guarda el enlace y luego se puede usar en historias publicadas (con reproductor embed o similar).

---

## Flujo “real” de historias con video (no solo prueba)

- En **`/subir`**, eligiendo “Video”, hoy solo se acepta **URL de YouTube o Vimeo** (no subida de archivo).
- Esas historias se guardan como envíos; cuando se publican/curan, pasan a la API y entonces pueden salir en `/historias/videos` en lugar de las demos.
- Si en el futuro quieres **subir archivos de video** (como con las fotos), haría falta un endpoint que suba a Firebase Storage u otro almacenamiento y guarde la URL en la historia; hoy ese flujo no está implementado para video.

---

## Resumen rápido

| Objetivo                         | Qué hacer                                                                 |
|----------------------------------|---------------------------------------------------------------------------|
| Ver un video **solo de prueba**  | Archivo en `public/` + nueva entrada en `lib/demo-video-stories.ts` con `videoUrl: '/archivo.mp4'`. |
| Ver varios videos de prueba      | Varios archivos en `public/` y varias entradas en `DEMO_VIDEO_STORIES`.    |
| Que el sitio use “tus” videos   | Mientras no haya historias con video desde la API, se usan esas demos.    |
