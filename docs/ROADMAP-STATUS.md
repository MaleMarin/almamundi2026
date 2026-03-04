# AlmaMundi — Estado del roadmap

Revisión según el código actual.

---

## FASE 1 — La experiencia base

| Item | Estado | Dónde |
|------|--------|--------|
| **1A. Visor cinematográfico** | ✅ Hecho | Flujo actual: clic en punto → zoom globo (1200 ms) → overlay oscuro → panel se desliza → `StoryViewer` emerge sobre el mapa. Globo sigue visible detrás. Cerrar revierte. (`app/mapa/page.tsx`, `components/mapa/StoryViewer.tsx`) |
| **1B. Fotos Ken Burns** | ⚠️ Parcial | `PhotoStoryViewer.tsx` existe y se usa en **pestaña Fotos** de `StoryObservatory` (página `app/mapa/historias/[id]`). El visor principal es ahora **StoryViewer** (overlay); ahí **no** se muestran fotos Ken Burns. Si una historia solo tiene fotos y se abre desde el mapa, el overlay no tiene soporte foto. |
| **1C. "Cerrar los ojos"** | ⚠️ Parcial | Botón + Web Speech en `StoryObservatory` (página historias/[id]). **StoryViewer** (overlay) no tiene botón "Cerrar los ojos" para texto. |
| **1D. "La historia que te eligió"** | ✅ Hecho | `pickStoryForMe()` + botón "Déjame sorprender" en el mapa. (`app/mapa/page.tsx`, `lib/sessionTracker.ts`) |

---

## FASE 2 — La emoción después de leer

| Item | Estado | Dónde |
|------|--------|--------|
| **2A. El Eco** | ✅ Hecho | `EcoRecorder.tsx` (10 s), bloque "¿Dejar un eco?" en `StoryViewer`, `POST /api/stories/eco` + Firebase Storage. |
| 2B. El Último Segundo | ❌ No | — |
| 2C. "¿Quieres que el autor sepa…?" | ❌ No | — |
| 2D. El Momento Justo | ❌ No | — |

---

## FASE 3 — La red invisible

| Item | Estado |
|------|--------|
| 3A. Cadena de lugares | ❌ No |
| 3B. "Alguien está aquí ahora" | ❌ No |
| 3C. Arcos en el globo | ❌ No |
| 3D. Mapa de tu vida | ❌ No |

---

## FASE 4 — Lo que llega por fuera

| Item | Estado |
|------|--------|
| 4A. Postales por email | ❌ No |
| 4B. "Alguien pensó en ti" | ❌ No |
| 4C. Modo WhatsApp | ❌ No |

---

## FASE 5 — La atmósfera

| Item | Estado |
|------|--------|
| 5A. Historias con clima | ❌ No |
| 5B. Ken Burns paralax completo | ❌ No |
| 5C. Transición de cámara completa | ✅ Cubierto por el flujo actual (zoom + overlay + panel + visor). |

---

## Extras ya implementados (fuera del doc)

- **Carrusel de relacionadas** en el visor (`RelatedCarousel.tsx`): historias similares con efecto 3D; tocar la central carga esa historia y el globo hace zoom.
- **Noticias** abren en nueva pestaña (sin página interna).
- **Panel izquierdo** unificado (sin cajitas), sin iconos, tipografía mayor.
- **Frase de atmósfera** sin horario, solo texto.

---

## Resumen

- **Fase 1:** 1A y 1D completos en el flujo actual. 1B y 1C existen en la ruta `historias/[id]` pero no en el visor overlay; si quieres que el overlay sea la experiencia principal, habría que llevar **fotos Ken Burns** y **"Cerrar los ojos"** a `StoryViewer`.
- **Fase 2:** Solo 2A (Eco) hecho.
- **Fases 3, 4 y 5:** Sin implementar (salvo 5C cubierto por la transición actual).
