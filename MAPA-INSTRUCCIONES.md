# Cómo ver /mapa en local y mergear a main

## Ver /mapa en local

1. **Instalar y arrancar**
   ```bash
   cd /Users/malehofmann/Documents/almamundi-clones/almamundi-clone
   npm install
   npm run dev
   ```
2. **Abrir en el navegador**
   - **http://localhost:3000/mapa**  
   Debe mostrarse solo el globo nocturno + panel derecho (“Explora el mapa”, Historias / Actualidad / En vivo), sin header del sitio y sin botón “Activar”.

### Si el puerto 3000 está ocupado (EADDRINUSE)

- Ver qué proceso usa el puerto (ej. 3000):
  ```bash
  lsof -i :3000
  ```
- Matar el proceso (sustituir `<PID>` por el número que salga):
  ```bash
  kill -9 <PID>
  ```
- O usar el script estable en otro puerto:
  ```bash
  npm run dev:stable
  ```
  Luego abrir **http://localhost:3001/mapa**.

### Si hay “Turbopack panic” o errores raros en dev

- Usar modo estable (webpack, sin Turbopack):
  ```bash
  npm run dev:stable
  ```
  Abrir **http://localhost:3001/mapa**.

- Opcional: limpiar caché y volver a levantar:
  ```bash
  rm -rf .next
  npm run dev
  ```

---

## Mergear a main cuando apruebes

1. **Confirmar que todo está commiteado**
   ```bash
   git status -sb
   git branch --show-current
   ```
   Debe estar en `feat/nuevas-funciones` y sin cambios sin commitear (o solo los que quieras incluir).

2. **Mergear a main**
   ```bash
   git checkout main
   git pull origin main   # si trabajas con remoto
   git merge feat/nuevas-funciones
   git push origin main   # si quieres subir
   ```

3. **O crear PR**
   - Sube la rama: `git push -u origin feat/nuevas-funciones`
   - Abre un Pull Request de `feat/nuevas-funciones` → `main` en GitHub y aprueba/mergea ahí.

---

## Criterios de aceptación (ya cumplidos)

- **http://localhost:3000/mapa** (o 3001 con `dev:stable`) muestra el globo nuevo + panel derecho, sin header del sitio.
- No aparece “Activar” ni “Memoria” en la UI (solo “Historias”, “Actualidad”, “En vivo”).
- El dropdown “Temas” abre completo y sin cortes (portal a `document.body`, z-index alto).
- Cambios commiteados en `feat/nuevas-funciones` (mapa, lib, api, public/audio, public/textures, .gitignore, etc.).
