# Firebase Admin — variables de entorno

Para que funcione la subida de foto (`/subir/foto`) y cualquier ruta API que use Firebase Admin, configura **una** de estas opciones en `.env.local`.

## Opción A: JSON en base64

1. Toma el archivo JSON de la service account (ej. `almamundi-6d294-firebase-adminsdk-....json`).
2. Convierte todo el contenido a base64:
   ```bash
   base64 -i ruta/al-archivo.json | tr -d '\n' > base64.txt
   ```
3. En `.env.local`:
   ```
   FIREBASE_SERVICE_ACCOUNT_BASE64=<pegas aquí el contenido de base64.txt>
   FIREBASE_STORAGE_BUCKET=almamundi-6d294.firebasestorage.app
   ```
   (El JSON de la service account no suele traer `storage_bucket`; por eso se pone aparte.)

## Opción B: Variables sueltas

En `.env.local` define:

```
FIREBASE_PROJECT_ID=almamundi-6d294
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@almamundi-6d294.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=almamundi-6d294.firebasestorage.app
```

- **FIREBASE_PRIVATE_KEY**: copia el valor de `private_key` del JSON. Si lo pegas con saltos de línea reales, en muchos entornos hay que convertirlos a `\n` (barra invertida + n) y dejar el valor entre comillas dobles.
- **FIREBASE_STORAGE_BUCKET**: suele ser `almamundi-6d294.firebasestorage.app` o `almamundi-6d294.appspot.com`. Si no sube, revisa en Firebase Console → Storage el nombre del bucket.

Reinicia el servidor de desarrollo (`npm run dev`) después de tocar `.env.local`.
