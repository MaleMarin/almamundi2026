# Cómo hacer que las historias se guarden y se vean en el mapa

## 1. Configurar Firebase para que lo que se sube se guarde

Las historias del formulario (Texto, Audio, Video, Foto) se envían a **POST /api/submit**. Esa ruta guarda en Firestore solo si **Firebase Admin** está configurado.

### Pasos

1. En [Firebase Console](https://console.firebase.google.com) → tu proyecto → **Configuración del proyecto** (engranaje) → **Cuentas de servicio**.
2. **Generar nueva clave privada** (JSON). Descarga el archivo.
3. En la raíz del proyecto crea o edita **`.env.local`** (nunca hagas commit de este archivo).

### Opción A (recomendada): una sola variable

Convierte el JSON de la cuenta de servicio a **base64** y pégalo en:

```env
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Iiw...
```

**Forma rápida (script del proyecto):** descarga el JSON, luego en la raíz del proyecto:

```bash
node scripts/prepare-firebase-base64.mjs ruta/al-archivo-descargado.json
```

El script imprime la línea completa; cópiala y pégala en `.env.local`.

**Alternativa en terminal (Mac/Linux):**

```bash
base64 -i ruta/al-archivo-descargado.json | tr -d '\n' | pbcopy
```

Pega el resultado en `FIREBASE_SERVICE_ACCOUNT_BASE64=` en `.env.local`.

### Opción B: tres variables

Del mismo JSON copia:

```env
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

(En `FIREBASE_PRIVATE_KEY` deja los `\n` literales dentro de las comillas.)

4. **Reinicia el servidor** (`npm run dev`). A partir de ahí, cada envío desde el formulario se guarda en Firestore en la colección **`story_submissions`** con `status: "pending"`.

---

## 2. Token para curaduría y publicación

Para listar envíos y publicarlos hace falta un token que solo usa el equipo de curaduría.

En `.env.local` añade:

```env
ADMIN_PUBLISH_TOKEN=un_string_secreto_que_solo_conozcas_tu
```

(Ese mismo valor lo usarás en la página de curaduría o en las llamadas a la API.)

---

## 3. Cómo se ve una historia después de curada

1. **Usuario envía** → la historia queda en Firestore en **`story_submissions`** con `status: "pending"`.
2. **Curador revisa** → entra en **Curaduría** (ver más abajo) o usa la API.
3. **Curador publica** → se llama a **POST /api/admin/publish** con el `submissionId`. Eso:
   - Crea un documento en la colección **`stories`** (con `status: "published"`).
   - Actualiza el envío a `approved` y guarda el `publishedStoryId`.
   - (Opcional) Envía un email al autor si tienes configurado Resend.
4. **El mapa** lee la colección **`stories`** (vía `/api/stories`). Solo las historias **publicadas** se ven en el globo.

Resumen: **lo que se sube** → `story_submissions` (pending). **Después de curada y publicada** → `stories` (published) → **se ve en el mapa**.

---

## 4. Publicar desde la interfaz de curaduría

En el proyecto hay una página para hacer curaduría sin tocar la API a mano:

- **URL:** `http://localhost:3004/curaduria` (o la URL de tu app + `/curaduria`). Si usas otro puerto (ej. 3002), cambia el número.
- **Uso:** introduces el **token** (el mismo que `ADMIN_PUBLISH_TOKEN`). La página lista los envíos pendientes y, para cada uno, puedes pulsar **Publicar**. Eso llama a `/api/admin/publish` y la historia pasa a `stories` y se ve en el mapa.

Si no usas la página, puedes publicar con curl (ver `docs/CURACION_FLUJO.md`).

---

## 5. Resumen de variables útiles en `.env.local`

| Variable | Para qué |
|----------|----------|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` (o las tres FIREBASE_*) | Que los envíos se guarden en `story_submissions`. |
| `ADMIN_PUBLISH_TOKEN` | Listar envíos y publicarlos (curaduría). |
| `RESEND_API_KEY` + `MAIL_FROM` | Enviar email al autor cuando publicas su historia. |
| `PUBLIC_SITE_URL` | Enlace que se manda en el email (ej. `https://www.almamundi.org`). |

Sin Firebase Admin configurado, el formulario sigue mostrando “Gracias, tu historia dejó una Impronta” pero **no se guarda nada** (el ID que ves será `dev-...`). En cuanto configuras las variables y reinicias, los nuevos envíos sí se guardan y, después de publicarlos desde curaduría, se ven en el mapa.
