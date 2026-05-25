# PRE-LAUNCH CHECKLIST — AlmaMundi

> Verificación pre-lanzamiento. Marcar con `[x]` a medida que se completa cada ítem.
> Bloques A, B y D son **obligatorios** para lanzar. Bloque C puede esperar a post-launch.

---

## Cómo usar este documento

1. Trabajar por bloques en orden (A → B → D → C).
2. Marcar cada ítem cuando se verifique en producción (no en local).
3. Si un ítem falla, crear issue o nota en el item antes de avanzar.
4. Al final de cada bloque, hacer commit con mensaje `chore: launch-check — bloque X completo`.

---

## 🔴 BLOQUE A — Bloqueantes (sin esto NO se lanza)

### A1. Globo cortado en producción

Problema conocido: en producción el globo se ve cortado / mal recortado.

- [ ] Reproducir el problema en `almamundi.org` y registrar screenshot
- [ ] Verificar `components/globe/Globe.tsx` y contenedor padre: dimensiones, overflow, aspect-ratio
- [ ] Verificar `components/map/MapCanvas.tsx` y `UniverseStage` (contenedor)
- [ ] Verificar en Chrome desktop
- [ ] Verificar en Safari desktop
- [ ] Verificar en Firefox desktop
- [ ] Verificar en iPhone Safari (dispositivo físico real)
- [ ] Verificar en Android Chrome (dispositivo físico real)
- [ ] Verificar en iPad Safari

**Criterio de éxito:** el globo se ve completo, centrado, no cortado, en todos los dispositivos arriba.

---

### A2. Sentry DSN configurado

- [ ] Variable `SENTRY_DSN` (o `NEXT_PUBLIC_SENTRY_DSN`) seteada en Vercel: Production
- [ ] Misma variable seteada en Vercel: Preview
- [ ] `sentry.client.config.ts` lee la variable
- [ ] `sentry.server.config.ts` lee la variable
- [ ] `sentry.edge.config.ts` lee la variable
- [ ] Forzar un error en producción (ej. ruta inexistente o `throw` temporal) y confirmar que llega al dashboard de Sentry
- [ ] Configurar alertas en Sentry (email a tu cuenta para errores críticos)
- [ ] Quitar el error de prueba después de verificar

**Criterio de éxito:** errores reales en producción se capturan y notifican.

---

### A3. Variables de entorno en Vercel

Verificar que TODAS las variables de `.env.example` están seteadas en Vercel (Production y Preview):

- [ ] `FIREBASE_ADMIN_PROJECT_ID`
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL`
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY` (cuidado con saltos de línea)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `RESEND_API_KEY`
- [ ] `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`
- [ ] `SENTRY_DSN`
- [ ] Cualquier otra variable propia del proyecto

**Criterio de éxito:** `vercel env ls` en CLI o panel web muestra todas las variables. Ninguna falta.

---

### A4. Reglas de Firestore en producción

- [ ] Revisar `firestore.rules` con foco en:
  - Solo curadores autenticados pueden escribir en `stories` con `status: "published"`
  - Lectura pública solo de stories con `status: "published"`
  - `submissions` solo escribible por usuarios autenticados (o vía API server-side)
  - `users` solo lectura/escritura del propio uid
  - `private` collections sin lectura pública
- [ ] Desplegar reglas a producción: `firebase deploy --only firestore:rules`
- [ ] Test manual: como usuario no autenticado, intentar escribir en `stories` desde consola → debe fallar con permission-denied
- [ ] Test manual: como usuario autenticado pero no curador, intentar publicar → debe fallar
- [ ] Revisar `firestore.indexes.json` y desplegar: `firebase deploy --only firestore:indexes`
- [ ] Revisar `storage.rules` con la misma lógica para archivos subidos

**Criterio de éxito:** ningún test manual abusivo logra escribir o leer datos sensibles.

---

### A5. Modal resize después de click en card

Problema conocido: al hacer click en una card, el modal no se redimensiona correctamente.

- [ ] Reproducir el problema y registrar en qué cards / formatos pasa
- [ ] Verificar `components/home/StoryModal.tsx` y `components/home/PropositoModal.tsx`
- [ ] Verificar que no hay race conditions entre el click y la apertura del modal
- [ ] Probar en mobile y desktop
- [ ] Test: abrir y cerrar 5 modales seguidos, ninguno debe quedar mal dimensionado

**Criterio de éxito:** click en cualquier card abre modal con dimensiones correctas, en todos los dispositivos.

---

## 🟡 BLOQUE B — Importantes (lanzás sin esto, pero te perjudica)

### B1. Lighthouse audit

Objetivos mínimos (ejecutar en Chrome DevTools → Lighthouse → Mobile):

Para cada ruta:
- Performance ≥ 75
- Accessibility ≥ 90
- Best Practices ≥ 90
- SEO ≥ 90

Rutas a auditar:
- [ ] `/` (home)
- [ ] `/historias/videos`
- [ ] `/historias/audios`
- [ ] `/historias/fotos`
- [ ] `/historias/escrito`
- [ ] `/mapa`
- [ ] `/subir`
- [ ] `/muestras`
- [ ] `/temas`
- [ ] `/privacidad`

Documentar issues que aparezcan repetidamente para resolverlas en bloque.

**Criterio de éxito:** todas las rutas pasan los umbrales arriba en mobile.

---

### B2. Páginas públicas de moderación y onboarding

- [ ] Crear/publicar `/moderacion-politica` con la política de moderación que ya tenés escrita
- [ ] Crear/publicar `/curadores-onboarding` (o ruta equivalente) con el documento de onboarding
- [ ] Link a moderación accesible desde footer
- [ ] Link a onboarding desde panel admin de curaduría

**Criterio de éxito:** ambos documentos accesibles públicamente desde URLs estables.

---

### B3. Flujo completo de submission (end-to-end)

Probar cada formato como usuario real:

- [ ] **Video**: subir, recibir en cola, aprobar desde admin, ver publicado en `/historias/videos`
- [ ] **Audio**: ídem
- [ ] **Foto**: ídem
- [ ] **Texto**: ídem
- [ ] El autor recibe email de notificación vía Resend
- [ ] El email tiene contenido correcto y links que funcionan
- [ ] Rechazar una submission desde admin → autor recibe email de rechazo (si así está definido)
- [ ] Rate limiting funciona (intentar subir 10 veces seguidas debería bloquear)
- [ ] Turnstile/CAPTCHA funciona en el form de subida

**Criterio de éxito:** los 4 formatos completan el ciclo subir → curar → publicar → notificar sin fallas.

---

### B4. Test en dispositivos reales

No simuladores. Dispositivos físicos:

- [ ] iPhone (Safari) — el más complicado para WebGL
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Mac (Safari, Chrome, Firefox)
- [ ] Windows (Chrome, Edge)

Para cada uno:
- [ ] Home carga y se ve completa
- [ ] Globo funciona (rotación, click en bits)
- [ ] Navegación funciona (hamburguesa en mobile)
- [ ] Formulario de subida usable
- [ ] Audio y video se reproducen
- [ ] Sin scroll horizontal indeseado

**Criterio de éxito:** experiencia completa funcional en todos los dispositivos.

---

### B5. Open Graph y metadata para historias compartidas

- [ ] Cada ruta de historia tiene `generateMetadata` con título, descripción y `og:image`
- [ ] Probar compartir un link de historia en WhatsApp → aparece preview correcta
- [ ] Probar compartir en Twitter/X → preview correcta
- [ ] Probar compartir en Facebook → preview correcta
- [ ] El sitemap `sitemap.ts` incluye todas las rutas públicas
- [ ] `robots.ts` permite indexación de rutas públicas

**Criterio de éxito:** historias compartidas se ven bien en redes y son indexables.

---

## 🔵 BLOQUE D — Verificaciones legales

### D1. Política de privacidad
- [ ] Accesible desde el footer en todas las páginas
- [ ] Referencia RGPD, Chile, México y marcos ONU
- [ ] Datos de contacto reales (no placeholder)
- [ ] Fecha de última actualización visible

### D2. Términos de uso
- [ ] Página `/terminos` publicada y accesible
- [ ] Link desde footer

### D3. AgeGate para menores
- [ ] Aparece al intentar subir si la persona declara ser menor
- [ ] Bloquea submission si no hay consentimiento parental
- [ ] Mensaje claro y respetuoso

### D4. RGPD — solicitud de datos
- [ ] Ruta `/privacidad/data-request` (o equivalente) funciona
- [ ] Email de contacto para solicitudes recibe correctamente
- [ ] Proceso documentado

### D5. Datos de contacto reales
- [ ] Email de contacto principal funciona
- [ ] Email de prensa (si aplica) funciona
- [ ] Email de soporte funciona

**Criterio de éxito:** cualquier persona puede contactar y ejercer derechos digitales sin trabas.

---

## 🟢 BLOQUE C — Mejora de calidad (puede esperar a post-launch)

### C1. Sonidos al hover de las cards
- [ ] Definir si va o no (decisión editorial)
- [ ] Si va: implementar con respeto a la preferencia del sistema (`prefers-reduced-motion` y mute por defecto)

### C2. Microcopia revisada
- [ ] Pasada completa de textos en home, formularios, errores, vacíos, emails
- [ ] Tono unificado (cercano, claro, respetuoso)

### C3. Optimización de imágenes
- [ ] Verificar que todas las imágenes usan `next/image`
- [ ] Imágenes en `/public` están en formatos modernos (.webp o .avif donde se pueda)

### C4. Lazy loading de Three.js
- [ ] Globo se carga con `dynamic()` y `ssr: false`
- [ ] No bloquea First Contentful Paint

### C5. Roadmap post-lanzamiento
- [ ] Documento `docs/ROADMAP-POST-LAUNCH.md` con próximas funciones priorizadas

---

## Sign-off de lanzamiento

Antes de hacer público AlmaMundi:

- [ ] Bloque A: 100% completo
- [ ] Bloque B: 100% completo
- [ ] Bloque D: 100% completo
- [ ] Bloque C: revisado, items aceptables postergados a roadmap
- [ ] Backup de Firestore tomado en las últimas 24 horas
- [ ] Backup de Storage tomado en las últimas 24 horas
- [ ] Tag de release creado en git: `v1.0.0-launch`
- [ ] Mensaje de lanzamiento listo para redes / comunicación
- [ ] Plan de monitoreo de las primeras 48 horas definido

**Fecha de sign-off:** ____________

**Responsable:** Ana / Precisar
