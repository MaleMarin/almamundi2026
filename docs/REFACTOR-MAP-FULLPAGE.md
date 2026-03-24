# Plan de Refactor: `MapFullPage.tsx` 🗺️

**Fecha del Plan:** 2026-03-20  
**Objetivo:** Dividir el "God Component" masivo `MapFullPage.tsx` (~5,1k líneas) en componentes más pequeños y hooks reutilizables, respetando la regla del proyecto de no hacer refactors masivos sin plan previo.

## Hallazgos de la Auditoría

`MapFullPage.tsx` concentra múltiples responsabilidades en un solo archivo:

1. **Map Canvas/Globo:** Lógica de three.js/react-globe.gl.
2. **Paneles HUD:** Historias, Noticias, Sonidos, Bits.
3. **UI Overlays/HUD:** MapDock, MapDrawer, TimeBar, LiveOverlay.
4. **Estado Global:** Gestión de sesiones, ubicación, historias, sonido, noticias locales.
5. **Manejo de Errores:** MapErrorBoundary (clase) definido localmente.

Esto lo hace extremadamente difícil de mantener y probar.

---

## Estrategia de División (Paso a Paso)

Este plan debe ejecutarse de forma secuencial y acotada, probando cada paso. **No se debe tocar el código de `MapFullPage.tsx` hasta que el plan esté aprobado.**

### Paso 1: Extracción del Error Boundary

Mover la definición de `MapErrorBoundary` a un archivo propio: `/components/map/MapErrorBoundary.tsx`.

- **Archivo origen:** `MapFullPage.tsx` (Líneas 66-100 aprox.)
- **Nuevo archivo:** `/components/map/MapErrorBoundary.tsx`
- **Acción:** Extraer y exportar la clase. Importarla en `MapFullPage.tsx`.

### Paso 2: Extracción del Map Canvas

Separar la lógica del globo 3D en su propio componente: `/components/globe/MapCanvas.tsx`.

- **Archivo origen:** `MapFullPage.tsx` (Toda la lógica de Three/ReactGlobeGL y sus props/hooks).
- **Nuevo archivo:** `/components/globe/MapCanvas.tsx`
- **Acción:** Extraer y exportar. Importarlo en `MapFullPage.tsx`. Pasarle las props necesarias (selectedLocation, dots, etc.).

### Paso 3: Extracción de Paneles HUD

Dividir los paneles de HUD en sus componentes individuales: `/components/map/panels/`.

- **Archivo origen:** `MapFullPage.tsx` (Busca y extrae components/map/panels/*).
- **Nuevos archivos:** Un archivo por panel (HistoriasPanel, NewsPanel, etc.) si aún no existen en su propia carpeta.
- **Acción:** Asegurar que cada panel sea un componente independiente, pasándole el estado y callbacks necesarios.

### Paso 4: Extracción de Overlays de UI

Mover la lógica de los overlays HUD a sus propios componentes en `/components/map/hud/`.

- **Archivo origen:** `MapFullPage.tsx` (Busca y extrae MapDock, MapDrawer, TimeBar, LiveOverlay).
- **Nuevos archivos:** Un archivo por componente HUD.
- **Acción:** Extraer y exportar. Importar en `MapFullPage.tsx`.

### Paso 5: Extracción de Hooks y Lógica

Extraer la lógica de estado local (hooks y utilidades) a `/lib/map-data/` o `/hooks/`.

- **Archivo origen:** `MapFullPage.tsx` (Toda la lógica de gestión de estado y llamadas a APIs/Firebase).
- **Nuevos archivos:** Utilidades y Hooks reutilizables (useMapStories, useMapNews, useMapSession, etc.).
- **Acción:** Extraer y exportar. Importar en `MapFullPage.tsx`.

### Paso 6: Limpieza Final y Re-Importación

`MapFullPage.tsx` debe quedar como un orquestador que importa sus componentes extraídos.

- **Acción:** Eliminar el código sobrante de `MapFullPage.tsx` y asegurarse de que el orquestador final (MapaPageContent) solo componga los componentes extraídos.

---

## Respeto a las Reglas del Proyecto

Este plan está acotado para cumplir con la directriz de **"sin refactors masivos"**. Cada paso es un cambio local y rastreable. La orquestación final de `MapFullPage.tsx` asegurará que el "candado de la home" se mantenga.
