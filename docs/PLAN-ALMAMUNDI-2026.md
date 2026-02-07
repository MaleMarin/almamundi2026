# Plan Integral de Evolución – Almamundi.org 2026

Documento de referencia para desarrollo en este repositorio. **El sitio actual almamundi.org no se toca**; todo se desarrolla aquí (rama `features/historias-vivas` / almamundi2026) y se integrará cuando esté listo.

---

## 1. Mantención del contenido y estructura actual

- **Historias existentes y flujo de subida:** se mantienen sin cambios.
- **Backend y navegación principal:** sin cambios disruptivos; misma base tecnológica.
- **Entorno seguro:** este repo es el clon donde se implementan y prueban cambios; producción (almamundi.org) permanece intacta hasta la fusión aprobada.

---

## 2. Nuevas funcionalidades (módulos independientes)

Todas en **rutas nuevas** (`/huellas`, `/remix`, `/cartas`, `/tejiendo`, etc.) para convivir con la plataforma actual.

| # | Módulo | Ruta sugerida | Descripción breve |
|---|--------|----------------|-------------------|
| 1 | **Home con identidad fuerte** | `/` | Hero emotivo a pantalla completa, CTA "Explorar historias", colores tierra/ocre, presentación de valor concisa. |
| 2 | **Mapa de Huellas Emocionales** | `/huellas` o `/tejiendo-caminos` | Red interactiva: nodos = historias, líneas = conexiones emocionales; force-directed graph; hover/clic con tarjeta; zoom/pan; leyenda; sin coordenadas geográficas. |
| 3 | **Noticias en vivo** | Integrado en mapa | Pulsos en nodos cuando hay noticia relacionada con la emoción; snippet al clic; capa ON/OFF; API News/RSS en fase posterior. |
| 4 | **Exploración por estados emocionales** | Filtros en mapa/lista | Sliders por ejes (Calma↔Agitación, Oscuro↔Luminoso, Íntimo↔Universal, etc.); filtro dinámico en mapa y lista; presets ("Relajante", "Intenso"). |
| 5 | **Historias compuestas / Red** | `/tejiendo-caminos` | "Crear historia basada en este fragmento"; crédito "Inspirado en X"; red visual de inspiración/cita/continuación. |
| 6 | **Historias mutantes** | `/historias-mutantes` | Ramas alternativas "¿y si...?"; árbol interactivo; nodos con resumen + "Leer". |
| 7 | **Remix narrativo** | `/remix` | Editor tipo Canva/Notion: bloques (texto, imagen, audio, cita) arrastrables; paleta; guardado como JSON o HTML. |
| 8 | **Modo "Inspirarse en"** | En editor de historias | Sugerencias similares mientras escribe; botones "Citar" / "Usar como base"; al publicar: "Inspirado en la historia de X". |
| 9 | **Cartas entre historias** | `/story/[id]` + editor | Botón "Escribir carta en respuesta"; editor formato carta; se vincula a historia madre; listado "Cartas recibidas". |
| 10 | **Modo íntimo de lectura** | `/historia/[id]/lectura` o toggle | Pantalla completa, minimalismo, música ambiental opcional, ambientación visual sutil. |
| 11 | **Experiencia sensorial opcional** | Global | Microanimaciones, sonidos suaves, preferencias On/Off (animaciones, sonido). |

---

## 3. Diseño visual

- **Paleta:** tierra, ocre, verde hoja suave, crema, marfil (ej. fondo `#FDF8F4`, acentos ocre `#D9A24B`).
- **Tipografía:** Inter (cuerpo), Raleway o DM Sans (títulos); legibilidad y calidez.
- **Glassmorphism:** tarjetas/modales con fondo translúcido y blur.
- **Neumorfismo suave:** botones y contenedores con sombras suaves (Soft UI).
- **Tailwind** para estilos; componentes consistentes; responsive; accesibilidad (contraste, `prefers-reduced-motion`).

---

## 4. Seguridad y privacidad

- HTTPS obligatorio.
- OAuth (Google/Apple) para acciones que requieran cuenta.
- Políticas claras: Términos, Privacidad, normas de comunidad.
- Analíticas respetuosas (ej. Plausible, sin tracking invasivo).
- Rate limiting, protección anti-scraping/bots.
- Opción de publicación anónima y control de visibilidad.
- Derecho al olvido (eliminación de cuenta y datos).

---

## 5. Tecnología y desarrollo

- **Rama:** `almamundi2026` o `features/historias-vivas` para desarrollo; merge a main solo cuando esté probado.
- **Rutas nuevas:** `/huellas`, `/remix`, `/cartas`, `/tejiendo-caminos`, `/historias-mutantes`, `/story/[id]`, `/privacy`, etc.
- **Stack:** Next.js (App Router), React, Tailwind.
- **Librerías:** react-force-graph-2d (mapa/red), @dnd-kit (Remix drag & drop), Framer Motion (animaciones), opcional react-tree-graph (árbol mutantes).
- **Base de datos:** ampliar modelo para relaciones (inspiración, ramas, cartas, emociones); migraciones en staging primero.
- **Despliegue:** staging/preview (ej. Vercel por rama); producción almamundi.org solo tras aprobación.

---

## 6. Estado actual en este repositorio

| Módulo | Estado | Notas |
|--------|--------|--------|
| Tejiendo Caminos (red de historias) | ✅ Implementado | `app/tejiendo-caminos`, `components/StoriesNetwork.tsx`; nodos, enlaces (inspiración/cita/continuación), clic a `/story/[id]`. |
| Remix narrativo | ✅ Implementado | `app/remix`, `components/RemixBlock.tsx`; paleta + canvas, drag & drop con @dnd-kit. |
| Historias mutantes | ✅ Implementado | `app/historias-mutantes`; árbol SVG interactivo, nodos con "Leer". |
| Modo Inspirarse en | ✅ Componente | `components/NewStoryWithInspiration.tsx`; sugerencias, "Citar"/"Usar como base", "Inspirado en X". Falta integrar en flujo de creación. |
| Cartas entre historias | ✅ Implementado | `components/LetterEditor.tsx`, `app/story/[id]` con botón "Escribir carta en respuesta". |
| Política de privacidad | ✅ Implementado | `app/privacy/page.tsx`. |
| Home nueva | Pendiente | Hero emotivo, CTA "Explorar historias", paleta tierra/ocre. |
| Mapa con nombre /huellas | Opcional | Actualmente `/tejiendo-caminos`; se puede aliasar o unificar con "Mapa de Huellas". |
| Noticias en vivo | Pendiente | Pulsos en nodos, API/RSS en fase posterior. |
| Sliders emocionales | Pendiente | Filtros por ejes emocionales en mapa y lista. |
| Modo íntimo de lectura | Pendiente | Pantalla completa, música opcional. |
| Experiencia sensorial | Parcial | Framer Motion disponible; microanimaciones y sonidos opcionales por definir. |

---

## 7. Próximos pasos sugeridos

1. **Home:** rediseñar hero y CTA según plan; enlazar a `/tejiendo-caminos`, `/remix`, `/historias-mutantes`.
2. **Integrar** `NewStoryWithInspiration` en la ruta o pantalla de "crear historia".
3. **Noticias en vivo:** datos simulados primero; luego API/RSS y pulsos en nodos.
4. **Exploración emocional:** sliders + filtrado en mapa y listas.
5. **Modo íntimo:** ruta o toggle de lectura a pantalla completa con ambientación.
6. **Backend:** modelos y APIs para inspiración, ramas, cartas y emociones cuando se defina stack de producción.

---

*Documento generado a partir del Plan Integral de Evolución Almamundi.org 2026. Última actualización: febrero 2026.*
