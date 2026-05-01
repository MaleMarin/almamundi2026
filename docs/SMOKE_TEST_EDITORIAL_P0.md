# Smoke test manual — Editorial + globo (P0)

**Antes:** credenciales Admin en `.env.local`, proyecto Firebase correcto, `NEXT_PUBLIC_*` apuntando al mismo proyecto.

---

## P0 — Beta pública y demos (`NEXT_PUBLIC_SHOW_DEMO_STORIES`)

Ejecutar cada bloque con **ambas** configuraciones de env (build o `vercel env` + redeploy), porque el flag se inyecta en build-time.

| Prueba | `NEXT_PUBLIC_SHOW_DEMO_STORIES` | Esperado |
|--------|-----------------------------------|----------|
| Variable explícita activa | `true` | Demos visibles donde el producto las mezcla (`/api/stories`, globo, listas, etc.); copy **«Historia demo / no real»** en tarjeta y en **modales / pantalla completa** (TextoReader, FotoAlbum, VideoPlayer, AudioPlayer), observatorio `/mapa/historias/[id]` y modal interceptado. |
| Variable desactivada | omitida o `false` | Sin merge de fallbacks de globo; sin filas `demo-*` en carruseles; `GET /api/stories/[id]` para ids demo → 404 donde aplique; **`STORIES_MOCK` en `/mapa`** (vista Sonidos / tour) **vacío**: sin chips de recorrido basados en mocks, `startTour` no arranca con pool vacío; **rutas que usan `getStoryById` / `getStoryForObservatory` en `lib/map-data/stories.ts`** no resuelven puntos estáticos demo. |
| Historia real `approved` | cualquiera | `isRealStory: true` (o sin flags demo); **sin** bloque demo en UI. |
| `pending` / draft / reviewing / rejected / archived | cualquiera | **No** aparecen en API pública ni en globo listas; dueño sigue pudiendo gestionar lo suyo según app; **Firestore:** sin lectura pública de esos estados (reglas `stories`). |

### Checklist rápido por superficie (repetir con `true` y `false`)

1. **Carrusel** (`/historias/videos`, `/escrito`, `/fotos`, `/audios`): con `true`, abrir una tarjeta demo → debe mostrarse aviso; con `false`, no debe haber ítems demo en lista.
2. **Detalle** (`/historias/[id]`, subrutas texto/foto/video): demo con `true` muestra disclosure; historia aprobada real sin etiqueta.
3. **Mapa / globo** (`/` `#mapa`, `/mapa`): con `true`, pins demo + panel Historias con aviso; con `false`, sin fallbacks demo de API.
4. **Modal / fullscreen mapa** (`/mapa` → historia, modal `(.)historias/[id]` u observatorio de página): aviso demo visible en cuerpo (`StoryObservatory` + shell).
5. **Modales de formato** (portal TextoReader / FotoAlbum / VideoPlayer / AudioPlayer desde listas): aviso demo dentro del modal, no solo en la tarjeta previa.
6. **Archivo / unpublish:** una historia pasada a **`archived`** no debe comportarse como contenido público en listas globo/API (misma política que estados no públicos); si el producto expone `/archivo` vía Admin, validar que **no** replica “publicación” en sentido editorial.

---

## Opción A — Demos públicos (referencia)

| Prueba | Esperado |
|--------|----------|
| `beta_demo` en Firestore con coords | Pin en `/api/stories` con metadata demo; detalle y mapa con `DemoStoryDisclosure`. |
| Demo sin coords | No pin en `/api/stories`; puede listarse en formato según reglas de cada lista. |

---

## A. Envío sin publicar (`/subir`)

1. Abrir `/subir`, completar flujo y enviar historia.
2. Firestore **`submissions`**: doc con **`status: "pending"`** (o equivalente del flujo).
3. **`GET /api/stories`:** no incluye el envío hasta existir doc público en **`stories`** con coords si aplica política de pins.
4. **Firestore rules:** cliente anónimo **no** puede leer docs `stories` en `pending` / `draft` / etc.; **no** puede escribir **`editorial_audit_log`**.

---

## B. Publicar (`POST /api/admin/publish`)

1. Obtener `submissionId`, Bearer admin.
2. `curl` a `/api/admin/publish` → `{ ok: true, storyId }`.
3. Firestore **`stories`**: `status` público (p. ej. `approved`).
4. Sin `lat`/`lng`: no pin en `/api/stories` según política actual.

---

## C. Rechazo (`POST /api/curate/reject` o ruta equivalente)

1. Doc pasa a **`rejected`**.
2. API pública no expone la historia sin credencial admin.

---

## D. Deploy — comandos

**Reglas Firestore** (desde proyecto con `firebase.json` apuntando al mismo proyecto):

```bash
firebase deploy --only firestore:rules
```

Si cambiaste índices:

```bash
firebase deploy --only firestore:indexes
```

**Frontend (Vercel u otro):** variables `NEXT_PUBLIC_SHOW_DEMO_STORIES`, credenciales cliente Firebase, secrets Admin solo en servidor — **no** en `NEXT_PUBLIC_*`.

```bash
vercel --prod
```

(o el flujo CI del repositorio).

---

## Resultado esperado resumido

| Paso | Esperado |
|------|----------|
| Env sin publicar | `submissions`; sin pin público |
| Publicar | `stories` con estado permitido en API |
| Rechazo / archivo | No visible como relato público en API/globo |
| `NEXT_PUBLIC_SHOW_DEMO_STORIES=false` | Sin mocks `STORIES_MOCK` en UX de mapa música/tour; rutas estáticas de observatorio sin demos embebidas |
| Reglas | `users` (solo dueño, `frase` only update), `guardadas`, `muestras` (autor), `stories` editorial + subcolecciones bloqueadas cliente |

Registrar ids de documento o capturas para trazabilidad del release.

---

## Post-deploy — tabla OK/KO (rellenar tras cada release)

Dominio probado: __________________ · Fecha: __________________ · Responsable: __________________

Marcar **OK** o **KO** en la columna correspondiente.

| # | Caso | OK | KO | Notas |
|---|------|----|----|-------|
| 1 | Home carga correctamente | ☐ | ☐ | |
| 2 | `/subir` carga | ☐ | ☐ | |
| 3 | Envío desde `/subir` queda `pending` en Firestore | ☐ | ☐ | |
| 4 | Historia `pending` no aparece en API/listados públicos | ☐ | ☐ | |
| 5 | Admin / curaduría puede publicar (API + token allowlist) | ☐ | ☐ | |
| 6 | Historia publicada aparece en detalle / listado según formato | ☐ | ☐ | |
| 7 | Historia publicada **sin** coordenadas no aparece en globo (`/api/stories`) | ☐ | ☐ | |
| 8 | Historia publicada **con** coordenadas puede aparecer en globo | ☐ | ☐ | |
| 9 | Demo en **carrusel** muestra «Historia demo / no real» + texto legal | ☐ | ☐ | Requiere `NEXT_PUBLIC_SHOW_DEMO_STORIES=true` |
| 10 | Demo en **detalle** muestra aviso | ☐ | ☐ | |
| 11 | Demo en **fullscreen** (texto/foto/video/audio) muestra aviso | ☐ | ☐ | |
| 12 | Demo en **mapa/globo** y panel muestra aviso | ☐ | ☐ | |
| 13 | Historia real `approved` **no** muestra etiqueta demo | ☐ | ☐ | |
| 14 | **Archive** se comporta como unpublish para público (no pin/listado público esperado) | ☐ | ☐ | Alinear con política de `/api/stories` y `/archivo` |
| 15 | Usuario público **no** puede cambiar `status` en Firestore (prueba cliente / reglas) | ☐ | ☐ | |
| 16 | Cliente **no** puede escribir en `editorial_audit_log` | ☐ | ☐ | |
| 17 | **Móvil:** home, historias, mapa y subir funcionan | ☐ | ☐ | |

**Relacionado:** checklist de orden de deploy en `docs/GO_LIVE_BETA_PUBLICA.md`.
