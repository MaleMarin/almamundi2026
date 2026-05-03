# Monitoreo post-lanzamiento — Beta pública AlmaMundi

Guía para las **primeras horas tras abrir beta pública**. No sustituye el smoke previo (`docs/SMOKE_TEST_EDITORIAL_P0.md`, `docs/GO_LIVE_BETA_PUBLICA.md`).

**Alcance de este doc:** vigilancia técnica, incidentes rápidos, operación editorial. **Fuera de alcance:** cambiar pipeline P0, reglas Firestore o deploy rutinarios salvo tabla de rollback.

---

## 1. Checklist — primeras 48 horas

Revisar como mínimo **cada bloque una vez por turno** (mañana / tarde / noche) durante 48 h; si hay picos de tráfico o reportes, acortar intervalo.

| # | Ítem | Cómo / dónde |
|---|------|----------------|
| 1 | **Vercel Runtime Logs** | Vercel → proyecto → Logs / Observability → filtrar `Error`, rutas `/api/*`, status ≥ 400. |
| 2 | **Errores 500** | Mismo lugar; correlacionar con hora reportada por usuario si aplica. |
| 3 | **`GET /api/health/firebase`** | `https://www.almamundi.org/api/health/firebase` esperado `{ "ok": true, "firestore": "ok" }`. |
| 4 | **Envíos en Firestore** | Consola Firebase → colecciones de submissions / historias según proceso acordado; verificar escrituras recientes coherentes con formularios. |
| 5 | **Submissions pendientes / cola editorial** | Listados solo con roles autorizados; contar pendientes nuevos vs atascados sin movimiento ≥ 24–48 h. |
| 6 | **`GET /api/stories`** | Explorador o `curl`; sin 500; JSON con lista esperada (mezcla real + demo sólo si `NEXT_PUBLIC_SHOW_DEMO_STORIES=true` en build). |
| 7 | **`/api/world`** y **`/api/world/field/*`** | Misma idea: 200 vs 500, payload coherente. |
| 8 | **`/api/submissions`** (upload / listado público autorizado si aplica) | Errores 4xx esperables por validación; no bucles ni 500 sostenidos. |
| 9 | **Confusión demo vs real** | Redes / correos / soporte interno; si aumentan quejas sin etiquetas visibles → ver matriz incidentes «demos sin etiqueta». |
|10 | **Mobile** | Safari iOS + Chrome Android: `/`, `#mapa`, `/historias/*`, `/mapa`, envío desde `/subir` si existe. |
|11 | **Carga mapa/globo** | Home `#mapa` y `/mapa`: globo llega a estado usable; sin spinner infinito; panel Historias usable. |

**Notas:**

- **`NEXT_PUBLIC_*`** se fija en **build**. Un cambio de variable en Vercel **no** llega al cliente hasta **redeploy**.
- Logs de errores pueden incluir mensajes con fragmentos de paths; no copiar secretos a tickets públicos.

---

## 2. Matriz de incidentes

| Incidente | Severidad | Qué revisar | Acción rápida | Cuándo rollback |
|-----------|-----------|-------------|---------------|-----------------|
| **Firebase health falla** (`/api/health/firebase` no `ok`) | **P1** | Vercel env Admin (Base64 / credenciales), cuota Firebase, logs función | Ver mensaje de error en logs; revalidar env; redeploy si env corregida | Si **toda** lectura/escritura Admin cae y no hay fix en &lt; 30 min |
| **Demos sin etiqueta** «Historia demo / no real» | **P2** | Build con `NEXT_PUBLIC_SHOW_DEMO_STORIES`, `DemoStoryDisclosure`, datos `beta_demo` / flags en API | Corregir datos o flag en historias; redeploy si copy desincronizado | Rollback **solo** si confusión masiva y fix no inmediato (último deploy conocido bueno) |
| **`/subir` (o flujo envío) no envía** | **P1** | Network tab, Firestore rules (lectura/escritura usuario), logs `/api/submit`, `/api/submissions` | Ver 4xx/500; Turnstile/rate limit si aplica | Si envíos **cero** y error 500 generalizado |
| **`/historias` o detalle rompe (500 / blank)** | **P1** | Logs rutas historia, errores SSR, Firebase | Deploy hotfix sobre rama estable | Si páginas públicas histórias **todas** caídas |
| **`/mapa` no carga (canvas vacío)** | **P1** | Consola web, CSP, errores Three/WebGL, `useStories`/API | Probar redeploy; revisar errores cliente | Si mapa unusable prolongado tras redeploy sin causa clara |
| **Admin / curaduría no protegido** ( datos sensibles expuestos) | **P0** | Rutas `/api/admin/*`, `/api/curate/*`, Firebase Auth middleware | Bloquear tráfico o deshabilitar ruta si es posible; rotar secrets si filtraron | **Inmediato** rollback + comunicación interna |
| **Error 500 en APIs públicas masivo** | **P1** | Logs por ruta; dependencias Firebase | Revert último cambio sospechoso | Si degradación general &gt; 15 min sin fix |

**Convenciones sugeridas:** P0 máxima urgencia · P1 servicio público degradado · P2 producto/confusión · P3 menor.

---

## 3. Checklist editorial — beta pública

Uso recomendado: **lista de verificación diaria** mientras siga abierta la beta con tráfico real.

- [ ] Revisar **submissions nuevas** (prioridad tiempo de respuesta razonable acordado con el equipo).
- [ ] **No publicar historias reales** sin evidencia explícita de **consentimiento** según proceso interno.
- [ ] Garantizar que contenido demo quede marcado editorialmente (**demo / no real** en UI y campo `beta_demo` o equivalente en datos).
- [ ] **Archivar** o apartar rápidamente contenido problemático según política (abuso, datos sensibles indebidos, etc.).
- [ ] Detectar historias públicas **sin coordenadas** cuando el producto espera ubicación → corregir o no publicar en mapa según norma.
- [ ] Confirmar que **historias reales aprobadas** **no** muestren la etiqueta de demo.
- [ ] Confirmar que **historias demo** **sí** muestren la etiqueta («Historia demo / no real») en carrusel, detalle y experiencias fullscreen según cobertura en `DemoStoryDisclosure` y relacionados.

**Referencia técnica de copy demo:** centralizado conceptualmente en `lib/demo-stories-public.ts`, `DemoStoryDisclosure`, y checklist de smoke editorial.

---

## 4. Estado actual en código (solo lectura — sin cambiar en este paso)

- **Banner beta sitio amplio:** no hay hoy una franja o bloque único dedicado «beta pública AlmaMundi» en la home cerrada (`HomeFirstPart`) ni una cinta global en `app/layout.tsx` descrita sólo como beta general.
- **Demos marcadas:** el producto ya prevé etiquetas por historia mediante `DemoStoryDisclosure` + flags/API cuando `NEXT_PUBLIC_SHOW_DEMO_STORIES=true`; eso cubre «algunas historias demostrativas», **no** sustituye un aviso **global** de beta.
- **Feedback explícito:** no hay botón/formulario público denominado «Enviar feedback» en el Footer (`components/layout/Footer.tsx`). Existencia de `mailto:` en páginas legales (`privacidad` / otros) orientada a otros fines; AlmaMundi usa correos de producto como `hola@almamundi.org` en flujos de email del backend.

---

## 5. Propuestas mínimas de producto (siguiente implementación — **solo si las apruebas**)

Sin rediseño de hero ni reorder de `#intro`. Objetivo: **clave de lectura soberbia** sin competir visualmente con el cookie banner (z-index bajo él o segunda fila en footer).

### 5.1 Banner o aviso beta discreto — **ubicación recomendada**

| Opción | Dónde | Pros | Contras |
|--------|--------|-----|--------|
| **A (preferida)** | **Footer**, línea texto pequeña encima de la hilera actual de enlaces (mismo fondo `#E0E5EC`, `text-xs`, color gris) | No altera `#intro`/cards/map lock; repetido en todas las páginas con footer global | Ligero cambio estético del bloque inferior de página |
| **B** | `RootLayout`: cinta **`position: sticky` top**, altura única línea·dos, después del skip-link | Muy visible en primera carga | Más prominente en home; debe diseñarse para no pisar navegación fija donde exista |
| **C** | Enlace texto en **`HighContrastToggle` / zona utilidades** si existe zona común fuera home | Minimal | Menos usuarios ven utilidades marginal |

**Copy sugerido (beta pública + demos):**

> AlmaMundi está en **beta pública**. Algunas historias son demostrativas y están marcadas como tales. Estamos probando la experiencia antes de abrir el archivo a más relatos reales.

*(Variantes más cortas están en `docs/COPY_LANZAMIENTO_BETA.md`.)*

**Condicional:** mostrar sólo cuando exista **`NEXT_PUBLIC_PUBLIC_BETA_SITE=true`** (nueva variable opcional), **o** reutilizar `NEXT_PUBLIC_SHOW_DEMO_STORIES === 'true'` si no quierés añadir env (implica ligar mensaje beta a esa bandera ya usada por demos).

### 5.2 Feedback — **solución mínima recomendada**

1. **`mailto:` desde el mismo bloque footer** después del párrafo beta: texto del estilo «**Enviar comentarios**» →  
   `mailto:hola@almamundi.org?subject=Feedback%20beta%20AlmaMundi`
2. Opcional: variable **`NEXT_PUBLIC_FEEDBACK_EMAIL`** (fallback `hola@almamundi.org`) para no endurecer el dominio sin deploy si cambia soporte.

**No** crear formulario con backend nuevo inmediato si el objetivo es velocidad.

---

## 6. Qué implementar ya vs sólo documentar

| Qué | Decisión recomendada |
|-----|----------------------|
| **Este PR / iteración** | Dejar **`docs/POST_LAUNCH_MONITORING.md`** + **`docs/COPY_LANZAMIENTO_BETA.md`** como base operativa y de comunicaciones. Sin commit automático hasta cierre revisión equipo. |
| **Próximo micro-PR producto** (si aprobás explicitamente banner + feedback que no tocan reglas/deploy) | Añadir en **Footer**: línea de texto beta + enlace mailto feedback; opcional nueva env solo si querés banner independiente de demos; **tests manuales** en mobile. |
| **No hacer ahora sin ticket aparte** | Formularios con DB, SLA automático de alertas Vercel, cambios Firestore/editorial más allá del checklist. |

Última actualización: fecha de inclusión del documento según proceso interno (`git blame`/`log` sobre este fichero si hace falta auditoría).
