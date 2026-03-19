# Dónde están los videos del sitio

## En el proyecto (archivos locales)

- **Carpeta:** `public/`  
  Los archivos de video (`.mp4`, `.webm`) están en la raíz de `public/`.  
  Ejemplos: `Earth_wAtmos_spin_02_1080p60.mp4`, `earth-blue-marble-720p-60fps.mp4`, etc.

- **Listado para la galería:** `lib/demo-video-stories.ts`  
  Cada entrada tiene `videoUrl: '/nombre-del-archivo.mp4'` (ruta desde `public/`).  
  Esa lista se usa en **/historias/videos** (CinemaGallery) y se mezcla con las historias que vengan de la API.

## En producción / API

- Las historias con video que vienen de **Firestore** (colección `stories`) tienen el campo `videoUrl` o `media.videoUrl` con una URL (por ejemplo de Firebase Storage o un CDN).  
- Esas historias las devuelve la API y también se muestran en /historias/videos.

**Resumen:** archivos en `public/` + listado en `lib/demo-video-stories.ts`; en producción además las URLs que guardes en Firestore.
