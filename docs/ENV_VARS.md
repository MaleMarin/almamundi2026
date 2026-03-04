# Variables de entorno (nombres exactos)

Objetivo: variables claras, sin mezclar cliente/servidor, sin filtrar credenciales al cliente.

**Regla:** `NEXT_PUBLIC_*` = se ve en el navegador. Todo lo demás = solo servidor.

---

## 1) Solo servidor (Vercel / .env.local)

No deben ir al cliente.

### Firebase Admin

Usa **solo una** de estas formas:

| Variable | Descripción |
|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Todo el JSON del service account en base64 (recomendado). |
| `FIREBASE_PROJECT_ID` | projectId (si no usas base64). |
| `FIREBASE_CLIENT_EMAIL` | Email del service account. |
| `FIREBASE_PRIVATE_KEY` | Clave privada (con `\n` literales; el código hace `.replace(/\\n/g, "\n")`). |

Alternativa (compatible con código existente):

| Variable | Descripción |
|----------|-------------|
| `FIREBASE_ADMIN_PROJECT_ID` | = projectId. |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | = client_email del JSON. |
| `FIREBASE_ADMIN_PRIVATE_KEY` | = private_key (pegada con `\n`). |

### Email (notificación post-curadoría)

| Variable | Descripción |
|----------|-------------|
| `EMAIL_PROVIDER` | `resend` o `sendgrid` (opcional). |
| `RESEND_API_KEY` | API key de Resend. |
| `SENDGRID_API_KEY` | API key de SendGrid (si usas sendgrid). |
| `EMAIL_FROM` | Remitente (ej. `AlmaMundi <notificaciones@almamundi.org>`). |
| `EMAIL_REPLY_TO` | Ej. `hola@almamundi.org`. |
| `PUBLIC_SITE_URL` | URL base para links en emails (ej. `https://www.almamundi.org`). |

### Seguridad endpoints

| Variable | Descripción |
|----------|-------------|
| `SUBMISSIONS_WRITE_TOKEN` | Token para **POST /api/submissions** (header `x-submissions-token`). |
| `ADMIN_PUBLISH_TOKEN` | Token para **POST /api/admin/publish** (header `x-admin-token`). |

---

## 2) Públicas (cliente) — solo si usas Firebase Web SDK en el navegador

Si no usas Firestore/Auth desde el cliente, no las agregues.

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | authDomain. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | projectId. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | storageBucket. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | appId. |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Analytics (opcional). |

---

Ver también [VERCEL_ENV.md](./VERCEL_ENV.md) para configuración en Vercel (Preview/Production).
