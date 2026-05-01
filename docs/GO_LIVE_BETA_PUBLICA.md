# Go-live — Beta pública Opción A

Checklist para desplegar AlmaMundi en **beta pública con historias demo visibles**, claramente etiquetadas («Historia demo / no real»), sin nuevas funcionalidades en este documento.

**Referencias:** política editorial y smoke en `docs/SMOKE_TEST_EDITORIAL_P0.md`. Copy demo centralizado en `lib/demo-stories-public.ts` (`DEMO_STORY_LABEL`, `DEMO_STORY_NOTICE`).

---

## Prerrequisitos locales (antes de etiquetar un release)

| Comando | Uso |
|---------|-----|
| `npx tsc --noEmit` | Debe terminar sin errores antes de merge/deploy. |
| `npm run build` | Validar build producción en la rama que se despliega (requiere env mínimo en `.env.local` si el build depende de Firebase). |
| `npm run lint` | El repo puede reportar **errores y advertencias previos**; lo bloqueante para deploy es **tsc + build** en la práctica de este proyecto. Ver sección *Lint y go-live* abajo. |

---

## Checklist de deploy (orden recomendado)

### Paso 1 — Variable en Vercel Production

1. En el proyecto Vercel → **Settings → Environment Variables → Production**.
2. Añadir o editar: **`NEXT_PUBLIC_SHOW_DEMO_STORIES`** = **`true`** (beta Opción A con demos).
3. Para producción **sin** demos más adelante: valor **`false`** o **eliminar** la variable (solo activa con la cadena exacta `true` en código).

> `NEXT_PUBLIC_*` se inyecta en **build-time**: tras cambiar la variable hace falta **nuevo deploy** para que el cliente la refleje.

### Paso 2 — Reglas Firestore

Desde la raíz del repo, con Firebase CLI logueado y `firebase.json` apuntando al proyecto correcto:

```bash
firebase deploy --only firestore:rules
```

### Paso 3 — Índices Firestore

Si en el release actual cambió `firestore.indexes.json` o es el primer deploy con índices nuevos:

```bash
firebase deploy --only firestore:indexes
```

En consola Firebase, comprobar que los índices compuestos pasan a **Enabled** (puede tardar minutos).

### Paso 4 — Despliegue Vercel producción

**Opción A — CLI:**

```bash
vercel --prod
```

**Opción B — GitHub / integración Vercel (flujo equivalente):**

1. Merge a la rama que Vercel usa como **Production Branch** (p. ej. `main`).
2. Confirmar en el dashboard Vercel que el deployment de producción terminó en **Ready** y que las env de Production incluyen el paso 1.

### Paso 5 — Smoke test post-deploy

Ejecutar la tabla **Post-deploy (OK/KO)** al final de `docs/SMOKE_TEST_EDITORIAL_P0.md` en el dominio de producción (y de ser posible una pasada rápida con `NEXT_PUBLIC_SHOW_DEMO_STORIES=false` en un preview previo solo si validáis regresión).

### Paso 6 — Validación visual (desktop / móvil)

- **Home:** carga, nav, `#mapa`, sin regresiones de layout acordado.
- **Historias:** listados y detalle; modales fullscreen texto/foto/video/audio.
- **Mapa:** `/mapa` o `#mapa` en home; panel de historias; modal de historia si aplica.
- **Subir:** `/subir` usable en móvil (formulario, envío).

### Paso 7 — Criterio final go / no-go

| Criterio | Go | No-go |
|----------|----|--------|
| `tsc` + `build` verdes en la rama desplegada | ✓ | ✗ |
| Reglas Firestore desplegadas sin error | ✓ | ✗ |
| Smoke crítico (envío pending invisible, publicación visible, demo etiquetada, sin escritura cliente en audit log) | ✓ | ✗ |
| Rollback documentado abajo asumido por el equipo | ✓ | — |

---

## Rollback simple

| Problema | Acción |
|----------|--------|
| Confusión con demos en público | En Vercel Production: `NEXT_PUBLIC_SHOW_DEMO_STORIES=false` (o quitar variable) → **Redeploy** producción. |
| Reglas Firestore rompen perfil / guardadas / muestras | `git revert` del commit de reglas (o restaurar archivo anterior) → `firebase deploy --only firestore:rules`. |
| Índices en construcción o error de query | Esperar a que Firebase marque índices listos; revisar enlace de error en consola y `firestore.indexes.json`. |
| Smoke falla en publicación / API admin | **No** abrir tráfico masivo; revisar logs Vercel, credenciales Admin, allowlist `lib/adminEmails.ts` y rutas `/api/admin/*`, `/api/curate/*`. |

---

## Lint y go-live

`npm run lint` puede fallar con **muchos avisos y decenas de errores ya presentes** (p. ej. reglas `react-hooks/*`, `@typescript-eslint/no-explicit-any` en ficheros legacy). Para beta:

- **Bloqueante recomendado:** `npx tsc --noEmit` y **`npm run build`** en la misma configuración que producción.
- **Lint:** usar el informe solo para distinguir errores **nuevos** en ficheros tocados por el release; no es requisito cero-errores en todo el árbol salvo política interna nueva.

---

## Rutas demo / QA (no enlazadas en navegación principal)

Estas rutas **permanecen en el proyecto** pero **no** aparecen como enlaces en el menú público habitual de la home (`HomeFirstPart` / `HistoriasAccordion` / `Footer`: propósito, cómo funciona, mapa, historias anidadas, legales). Acceso normalmente por URL directa o documentación interna:

- `/earth-globe-demo`, `/preview-home`, `/demo-impronta`, `/demo-huellas-v2`, `/globo-validacion`, `/globo-v2`, `/vista-previa`, `/cinematic`, `/prototipo`

**Nota:** `/cinematic` en este repo puede redirigir a flujos tipo `/muestras`; igualmente no debe formar parte del menú principal de la home verificada arriba.

---

## Copy demo (Opción A)

Con `NEXT_PUBLIC_SHOW_DEMO_STORIES=true`, las superficies que muestran relatos demo deben reflejar (vía `DemoStoryDisclosure` y datos enriquecidos):

- **Etiqueta:** «Historia demo / no real»
- **Texto:** «Este relato fue creado para probar la experiencia de AlmaMundi. No corresponde a una persona real.»

Superficies a validar en smoke: carrusel, detalle, mapa/globo, panel lateral, texto/foto/video/audio fullscreen, temas/recorridos si listan demos.
