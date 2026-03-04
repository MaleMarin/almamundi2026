# CANDADO — Sección Mapa de AlmaMundi

**No modificar la sección del mapa en la home sin que el usuario lo pida explícitamente.**

## Dónde está el código "listo" del mapa

- **Commit de referencia (estado estable):** `7d264f3` (19 feb 2026, 17:08) — *feat: envío real desde modal (Foto, Video, Audio, Texto) + home 4 cards + upload Storage*
- **Antes:** `99f6e61` (16:33) — *feat: nuevas funciones del mapa y componentes*

No existe un commit a las 15:00. Los únicos commits de ayer son:
- 11:01 — fix(mapa): remove floating mode pill overlay
- 16:33 — nuevas funciones del mapa
- 17:08 — home 4 cards + upload

Para ver el código del mapa tal como estaba en el último commit:

```bash
git show 7d264f3:app/page.tsx
```

La sección `#mapa` en ese commit es: **una sola sección** con gradiente (--bg0/--bg1/--bg2), título "Mapa de AlmaMundi", subtítulo, botones (Activar/Bloquear, Tour, Sonido), MapFilterBar, MapLegend y GlobeComp con stories/newsRings.

## Regla para Cursor / asistente

- **NO** reemplazar esta sección por MapSection con 3 capas (A, B, C) ni por HomeMapSection a menos que el usuario lo pida.
- **NO** cambiar el layout del mapa (franja, dock, drawer) en la home sin petición explícita.
- Si el usuario pide "armonizar" o "arreglar", proponer cambios mínimos (por ejemplo CSS) sin reescribir la estructura de la sección.

## Archivos involucrados

- `app/page.tsx` — sección con `id="mapa"` (una sola `<section>`, gradiente + título + controles + globo).
- `app/globals.css` — si existe `.mapSection`, no alterar sin pedido.
- Componentes del mapa: `components/map/` (MapFullPage, MapCanvas, etc.) se usan en `/mapa`, no obligatoriamente en la home.

---
*Creado para no perder de nuevo el estado estable del mapa.*
