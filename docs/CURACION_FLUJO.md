# Curaduría → Publicación → Correo

Flujo: envío (story_submissions) → curaduría (API) → aprobación → publicación (stories) → correo (mail_queue).

## Modelo Firestore

### Colecciones

| Colección | Uso |
|-----------|-----|
| `story_submissions` | Lo que envía la persona. Público puede **crear** (validado por reglas); solo curador o Admin SDK lee/edita. |
| `stories` | Historias publicadas (master). Público solo lee si `status == "published"`. Escriben curador o Admin SDK. |
| `mail_queue` | Cola para correo al publicar. Solo curador o Admin SDK. |

### story_submissions (campos)

- `status`: `"pending"` \| `"needs_changes"` \| `"approved"` \| `"rejected"` \| `"published"`
- `createdAt`, `updatedAt` (Timestamp)
- `authorEmail`, `authorName?`
- `title`, `placeLabel`, `lat`, `lng`
- `format`: `"text"` \| `"audio"` \| `"video"`
- `text?`, `media?` (audioUrl, videoUrl, coverImageUrl)
- `tags`: `{ themes[], moods[], keywords[] }`
- `consent`: `{ termsAccepted: true, license: "allow_publish" }`
- `curatorNotes?`
- Tras publicar: `publishedStoryId?`

### stories (campos)

- `status`: `"published"`
- `publishedAt`, `createdAt`, `updatedAt`
- `sourceSubmissionId`
- `title`, `placeLabel`, `lat`, `lng`, `format`, `text?`, `media?`, `tags`
- `excerpt?`, `durationSec?`

### mail_queue (campos)

- `kind`: `"story_published"` \| `"submission_received"` \| `"submission_status"`
- `createdAt`, `processedAt?`
- `to`, `payload` (storyId, submissionId, authorEmail, title, placeLabel, etc.)

---

## Reglas de seguridad

Objetivo: **nada público antes de aprobar**. El público solo lee `stories` con `status == "published"`; puede crear `story_submissions` (pendiente) pero no leerlas. Solo curadores leen/editan submissions y publican.

- **stories**: `allow read` si `resource.data.status == "published"`; `allow write` si `isCurator()`.
- **story_submissions**: `allow create` para cualquiera, con validación (status pending, authorEmail, title, lat, lng, tags.moods); `allow read, update, delete` solo si `isCurator()`.
- **mail_queue**: `allow read, write` solo si `isCurator()`.

`isCurator()` = usuario autenticado con custom claim `curator == true`. Para asignar el claim: Firebase Admin (setCustomUserClaims). Si no usas Auth para curadores, haz todo el backoffice por **Admin SDK** en API routes (server); las reglas seguirán bloqueando al cliente y solo el server (service account) podrá escribir en submissions/stories/mail_queue.

Desplegar reglas: `firebase deploy --only firestore:rules`.  
Índices: `firebase deploy --only firestore:indexes` (o crear en consola a partir de `firestore.indexes.json`).

---

## API

### Envío (público o formulario)

- **POST /api/submit**  
  Body: `authorEmail`, `title`, `placeLabel`, `lat`, `lng`, `format`, `tags`, `consent`, opcionales: `authorName`, `text`, `media`, …  
  Crea documento en `story_submissions` con `status: "pending"`.

### Curaduría (backend / curador)

- **GET /api/curate/submissions?status=pending**  
  Lista envíos (ordenados por `createdAt` desc). Filtro opcional por `status`.
- **GET /api/curate/submissions/[id]**  
  Un envío.
- **PATCH /api/curate/submissions/[id]**  
  Body: `{ status?, curatorNotes? }`. Status: `pending` \| `needs_changes` \| `approved` \| `rejected`.

### Publicación + email (recomendado)

- **POST /api/admin/publish**  
  Header: `x-admin-token: <ADMIN_PUBLISH_TOKEN>`. Body: `{ "submissionId": "..." }`.  
  Acepta envíos con `status === "pending"` o `"approved"`.  
  Crea documento en `stories`, actualiza envío a `status: "approved"` y `publishedStoryId`, y **envía email al autor** con Resend (link a la historia publicada).  
  Variables: `RESEND_API_KEY`, `MAIL_FROM`, `PUBLIC_SITE_URL`, `ADMIN_PUBLISH_TOKEN`.

### Publicación solo cola (alternativa)

- **POST /api/curate/publish/[submissionId]**  
  Requiere `status === "approved"`. Crea `stories`, actualiza envío a `published` y `publishedStoryId`, escribe en `mail_queue`. El correo lo envía después una Cloud Function o extensión.

---

## Probar publicación + email (sin romper nada)

1. **Crear una submission** (desde UI o):

   ```bash
   curl -X POST "http://localhost:3010/api/submit" \
     -H "Content-Type: application/json" \
     -d '{
       "authorEmail": "tu@email.com",
       "title": "Historia de prueba",
       "placeLabel": "Madrid, España",
       "lat": 40.4,
       "lng": -3.7,
       "format": "text",
       "tags": { "themes": [], "moods": ["ciudad"], "keywords": [] },
       "consent": { "termsAccepted": true, "license": "allow_publish" }
     }'
   ```

   Respuesta: `{ "ok": true, "id": "<submissionId>" }`.

2. **Publicar y enviar email**:

   ```bash
   curl -X POST "http://localhost:3010/api/admin/publish" \
     -H "Content-Type: application/json" \
     -H "x-admin-token: TU_ADMIN_PUBLISH_TOKEN" \
     -d '{"submissionId":"<ID_DE_LA_SUBMISSION>"}'
   ```

   Verificar: existe doc en `stories`, submission tiene `status: "approved"` y `publishedStoryId`, y llega el email a `authorEmail`.

---

## Resumen

1. Usuario envía formulario → **POST /api/submit** → `story_submissions` con `status: "pending"`.
2. Curador revisa → **GET /api/curate/submissions**, **PATCH** con `needs_changes` + notas o `approved`.
3. Curador publica → **POST /api/admin/publish** (body `submissionId`, header `x-admin-token`) → se crea `stories`, se actualiza envío a `approved` + `publishedStoryId`, se envía email al autor con Resend.
