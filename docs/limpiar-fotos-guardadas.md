# Limpiar fotos ya guardadas

El script es `scripts/clean-stored-photos.mjs`. No forma parte del sitio y no se ejecuta en el build.

Recorre las fotos (jpg, jpeg, png, webp, heic) de `submissions/private/` y de `published/`. Ahí están los envíos, las fotos de perfil, los archivos extra y las respuestas. No toca videos ni audios.

Usa las mismas credenciales que `scripts/migrate-author-contacts.mjs`: las lee de `.env.local`. Ese archivo apunta a producción. No corras `--apply` sin aprobación.

## 1. Modo prueba

Desde la raíz del repositorio:

```bash
node scripts/clean-stored-photos.mjs
```

No descarga respaldos, no reescribe Storage y no escribe Firestore. El informe dice cuántas fotos hay, cuántas tienen GPS, cuántas tienen otro EXIF (también XMP o IPTC), cuántas superan 2048 px, cuántas siguen en HEIC y cuántas se cambiarían.

## 2. Aplicar

Solo después de leer el informe de la prueba:

```bash
node scripts/clean-stored-photos.mjs --apply
```

Antes de cambiar un archivo lo guarda en `scripts/backups/photos-fecha/`, con la misma ruta que tiene en Storage. Esa carpeta ya está en `.gitignore`. No la subas.

Después corrige la orientación, quita los metadatos, deja el lado mayor en 2048 px como máximo y convierte HEIC a JPG con calidad 0,85. Lo sube en la misma ruta. Si la extensión cambia, actualiza la URL en `submissions`, `stories` y `respuestas`, y borra el archivo anterior.

Si un archivo falla, lo anota y sigue con el siguiente. Al final lista lo cambiado y lo fallado.
