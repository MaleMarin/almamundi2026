# Código del Mapa de AlmaMundi

Referencia rápida de dónde vive cada parte del mapa.

## En la home (`#mapa`)

| Qué | Archivo | Notas |
|-----|---------|--------|
| **Sección completa (3 capas A, B, C)** | `app/page.tsx` → función `MapSection()` | Capa A = transición, B = título, C = UniverseStage |
| **Contenedor del universo (globo + dock + drawer)** | `components/map/HomeMapSection.tsx` | Renderiza `MapFullPage` con `embedded` |
| **Estilos sección mapa** | `app/globals.css` → `.mapSection` | Fondo, bordes, sin línea negra |

## Componentes del mapa

| Componente | Archivo | Rol |
|------------|---------|-----|
| **MapFullPage** | `components/map/MapFullPage.tsx` | Página lógica: globo, dock, drawer, controles, historias/noticias/sonidos |
| **MapCanvas** | `components/map/MapCanvas.tsx` | Globo 3D (Three.js / react-globe.gl), luces, atmósfera |
| **MapDock** | `components/map/MapDock.tsx` | Franja pill (Historias, Sonidos, Noticias, Buscar) |
| **MapDrawer** | `components/map/MapDrawer.tsx` | Panel lateral que se abre al elegir modo |
| **MapTopControls** | `components/map/MapTopControls.tsx` | Botón mute/sonido |
| **Paneles** | `components/map/panels/StoriesPanel.tsx`, `NewsPanel.tsx`, `SoundsPanel.tsx` | Contenido del drawer |

## Página full `/mapa`

- Ruta: `app/mapa/page.tsx` → usa `MapFullPage` con `embedded={false}` (pantalla completa).
- Mismo `MapFullPage` que en home; solo cambia `embedded` y el layout (fixed vs contenido).

## Texturas y estilos del globo

- Texturas: `public/textures/earth-night.jpg`, `earth-day.jpg`
- Estilos mapa: `app/mapa/mapa-ui.css`, `app/mapa/liquid-metal.css`
- Atmósfera/overlay: `components/AtmosphereOverlay.tsx`
