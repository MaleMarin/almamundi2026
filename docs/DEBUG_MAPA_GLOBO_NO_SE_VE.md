# Debug: el mapa/globo no se ve en el sitio

Documento para entregar a un desarrollador que deba localizar por qué el globo 3D no aparece (o se ve solo un círculo oscuro) en la sección Mapa.

**Home (/)**: usa **VideoGlobe** (vídeo NASA Blue Marble + imagen estática `earth-day.jpg`). La imagen de día se carga desde `/textures/earth-day.jpg` para que el mapa mundi se vea de inmediato; el vídeo se superpone cuando está listo. Si todo se ve negro: revisar que existan `public/textures/earth-day.jpg` y `public/earth-1080p60.mp4` (o fallbacks en `VideoGlobe.tsx`).

---

## Cómo ver el globo (resumen rápido)

1. **Arrancar el servidor:** `npm run dev` (puerto 3005).
2. **Globo en la home (vídeo/imagen de la Tierra):**
   - Abre **http://localhost:3005**
   - **Baja con el scroll** hasta pasar el título y las cuatro cards (Tu historia, Dale voz, etc.).
   - La sección **«Mapa de AlmaMundi»** con el globo está **debajo**. Si no bajas, no lo ves.
   - Atajo: haz clic en cualquier enlace **«Ver Bits en el mapa»** o **«Mapa»** que lleve a `#mapa` para que la página baje sola hasta el globo.
3. **Globo 3D interactivo (página dedicada):** abre **http://localhost:3005/mapa** — ahí el globo ocupa toda la vista.

Si en la home solo ves un círculo oscuro: el vídeo puede no cargar; a los ~2,5 s se muestra automáticamente una imagen fija de la Tierra para que el globo siempre sea visible.

---

## 1. Qué ocurre

- **Ruta afectada:** `/mapa`
- **Síntoma:** El globo 3D (react-globe.gl) no se muestra o se ve solo un círculo oscuro con halo azul, sin continentes ni textura.
- **Tecnología:** Next.js (App Router), `react-globe.gl`, Three.js, texturas locales en `/public/textures/`.

---

## 2. Archivos clave (dónde mirar)

| Archivo | Qué hace |
|---------|----------|
| `app/mapa/page.tsx` | Página `/mapa`; monta `MapFullPage` dentro de un contenedor. |
| `components/map/MapFullPage.tsx` | Vista completa del mapa: dock, drawer, **MapCanvas** (globo), paneles. Aquí se cargan texturas día/noche y se pasa `globeImageUrl` y `globeMaterial` a MapCanvas. |
| `components/map/MapCanvas.tsx` | Monta **react-globe.gl** (dynamic, `ssr: false`). Recibe `globeImageUrl`, `globeMaterial`, luces, puntos, etc. Constante de textura por defecto: `GLOBE_IMAGE_LOCAL = '/textures/earth-night.jpg'`. |
| `components/GlobeView.tsx` | Contenedor del globo con `position: fixed`; reserva espacio superior/inferior (TimeBar, barra). Calcula POV inicial. |
| `app/globals.css` | Estilos `.globeStage` (altura del contenedor del globo) y `.globeStage canvas` si se usan. |

**Constantes de textura en MapFullPage.tsx (aprox. líneas 346–351):**

- `GLOBE_IMAGE_LOCAL` = `/textures/earth-night.jpg`
- `GLOBE_IMAGE_DAY_LOCAL` = `/textures/earth-day.jpg`
- Bump map (material custom): URL externa `unpkg.com/three-globe.../earth-topology.png` (en el pasado dio CORS/círculo negro).

---

## 3. Causas probables (orden sugerido de revisión)

### A) Altura del contenedor = 0

Si el contenedor del globo tiene altura 0, el canvas se dibuja pero no se ve.

- Revisar en DevTools el elemento que envuelve el canvas del globo (p. ej. el div con `stageClassName="globeStage ..."` o el contenedor en `MapCanvas`).
- Comprobar `height` / `min-height` en px o vh. Si el padre del globo tiene `height: 0` o no tiene altura definida en el flujo actual, corregir con altura mínima (ej. `min-height: 620px` o `min-height: 60vh`).

### B) Texturas no cargan (404, CORS, ruta incorrecta)

Si la textura falla, react-globe.gl puede mostrar solo la esfera sin imagen (círculo oscuro).

- **Network (pestaña Img o All):**  
  - ¿`/textures/earth-night.jpg` devuelve **200**?  
  - ¿`/textures/earth-day.png` (si se usa) devuelve **200**?  
  - Si usas bump desde una URL externa, ¿esa URL devuelve 200 y no está bloqueada por CORS?
- **Comprobar en el navegador:**  
  - `http://localhost:300X/textures/earth-night.jpg`  
  - `http://localhost:300X/textures/earth-day.png`  
  Si no abren, el fallo es de **ruta o de que el archivo no está en `public/textures/`**.

### C) Canvas tapado por overlays (z-index / posición)

Si el canvas está debajo de otro elemento (dock, drawer, overlay) con fondo opaco o que captura clicks, parece que “no se ve el mapa”.

- Revisar `z-index` del canvas del globo vs. dock/drawer/overlays.  
  Regla usada en el proyecto: canvas del globo en `z-index: 0`, UI (dock/drawer) en `z-index` mayor (ej. 20+).
- Revisar que ningún overlay con `position: absolute/fixed` cubra todo el área del globo sin `pointer-events: none` si no es necesario.

### D) SSR / hidratación

El globo se monta con `dynamic(..., { ssr: false })`. Si en algún punto se renderiza el contenedor del globo en servidor y en cliente el layout es distinto (por ejemplo altura 0 en cliente), el canvas puede no verse.

- Confirmar que el árbol que contiene el globo (MapFullPage → MapCanvas → react-globe.gl) solo se renderiza en cliente y que el contenedor tiene dimensiones válidas después de la hidratación.

### E) Errores en consola o WebGL

- **Consola del navegador:** ¿Aparece algo como `THREE.WebGLRenderer: Context Lost`, `Failed to load texture`, o errores de CORS al cargar imágenes?
- Si hay “Context Lost”, puede ser por demasiadas pestañas/WebGL o por reinicios del componente.

---

## 4. Qué entregar al desarrollador (checklist)

- [ ] **Este documento** (`docs/DEBUG_MAPA_GLOBO_NO_SE_VE.md`).
- [ ] **Cómo reproducir:** “Entrar a `/mapa` y comprobar si se ve el globo con textura (continentes/noche) o solo un círculo oscuro.”
- [ ] **Captura o descripción:**  
  - Si hay algo visible: “solo se ve un círculo oscuro con borde azul”.  
  - Si no hay nada: “no se ve ningún globo, solo el fondo”.
- [ ] **Una captura de la pestaña Network** filtrando por “textures” o por “earth”: qué pide, qué status (200, 404, CORS, etc.).
- [ ] **Una captura o copia del primer error relevante de la consola** (una línea basta), si hay alguno al cargar `/mapa`.
- [ ] **Entorno:** “Next.js, puerto X, navegador Y” (ej. Chrome, Safari).

Con eso el desarrollador puede seguir este orden (altura → texturas → overlays → SSR/consola) y localizar el fallo sin adivinar.

---

## 5. Comando rápido para verificar texturas

Con el servidor de desarrollo levantado:

```bash
# Desde la raíz del proyecto, comprobar que existen:
ls -la public/textures/earth-night.jpg public/textures/earth-day.png
```

Y en el navegador (mismo origen que el sitio):

- `http://localhost:3000/textures/earth-night.jpg`  
- `http://localhost:3000/textures/earth-day.png`  

(Reemplazar `3000` por el puerto que use.)

---

*Última actualización: según estado del repo y conversación sobre mapa NASA y smoke test.*
