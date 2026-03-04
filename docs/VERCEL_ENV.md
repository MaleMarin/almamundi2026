# Variables de entorno en Vercel

**Nombres exactos y cliente vs servidor:** ver [ENV_VARS.md](./ENV_VARS.md).

Configura **dos grupos** en el proyecto de Vercel:

1. **Preview** — para deploys del CLONE (preview, branches, etc.)
2. **Production** — para almamundi.org

En ambos grupos usa **exactamente los mismos nombres** (y mismos valores donde aplique).

---

## Cliente (NEXT_PUBLIC_*)

Mismos nombres en Preview y Production:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key del proyecto Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | authDomain (ej. `almamundi-6d294.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | projectId |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | storageBucket (ej. `almamundi-6d294.firebasestorage.app`) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | appId |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | measurementId (Analytics, opcional) |

---

## Servidor (solo backend / API routes)

**No** exponer en el cliente. Añadir en Vercel solo para Preview/Production según necesites:

| Variable | Descripción |
|----------|-------------|
| `FIREBASE_ADMIN_PROJECT_ID` | Mismo que `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (projectId) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Email del service account (ej. `firebase-adminsdk-xxx@almamundi-6d294.iam.gserviceaccount.com`) |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Clave privada del service account (pegada con `\n`; el código hace `.replace(/\\n/g, "\n")`) |
| `RESEND_API_KEY` | API key de Resend (envío de correo al publicar historia) |
| `MAIL_FROM` | Remitente del correo (ej. `AlmaMundi <hola@almamundi.org>`) |
| `PUBLIC_SITE_URL` | URL base del sitio (ej. `https://www.almamundi.org`) para links en el email |
| `ADMIN_PUBLISH_TOKEN` | Token secreto para **POST /api/admin/publish** (header `x-admin-token`). En prod: Auth + claims o Basic Auth. |
| `SUBMISSIONS_WRITE_TOKEN` | Token para **POST /api/submissions** (header `x-submissions-token`). Anti-spam sin Auth. |

---

## Cómo configurarlo en Vercel

1. Proyecto → **Settings** → **Environment Variables**.
2. Añade cada variable y marca **Preview** y/o **Production**.
3. Guarda. Los próximos deploys usarán estas variables.

Los valores de cliente son los de tu `.env.local` o la consola de Firebase. Los de admin salen del JSON del service account (no subas ese JSON al repo).

---

- **Curaduría y publicación**: ver [CURACION_FLUJO.md](./CURACION_FLUJO.md) (modelo Firestore, reglas, API, mail_queue).

---

## Reglas de seguridad mínimas

- **Nunca** uses `firebase-admin` ni `lib/firebase/admin` en componentes cliente. Solo en API routes, Server Actions o código marcado con `"server-only"`.
- En **cliente**: Firestore solo para lecturas públicas o con reglas estrictas.
- **Escrituras / curaduría**: hacerlas desde API routes con `getAdminDb()`.
- **Storage**: subidas ideales vía signed URLs o flujo controlado por API + reglas en Firebase.
