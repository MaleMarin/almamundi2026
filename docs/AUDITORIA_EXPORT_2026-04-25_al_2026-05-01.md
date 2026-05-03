# Export de auditoría — AlmaMundi (repositorio `almamundi-clone`)

**Ventana:** 25 de abril de 2026 → 1 de mayo de 2026 (inclusive).  
**Generado:** 2026-05-01 (export estático; volver a ejecutar los comandos del final para actualizar).

**Rama:** `main`  
**HEAD al generar:** `54bf6fdb96f7d4ce39e2ae2932121de85fe4cc4d` — `2026-05-01 19:47:04 -0400`

---

## 1. Resumen ejecutivo

| Periodo | Commits en `main` |
|--------|-------------------|
| 2026-04-25 → 2026-04-30 | Ninguno |
| 2026-05-01 | 13 commits (ver sección 2) |

**Trabajo local sin commit** al momento del export: sección 3.

---

## 2. Commits (`git log --since="2026-04-25" --until="2026-05-02"`)

Orden: del más reciente al más antiguo.

| Fecha (ISO) | Hash corto | Asunto |
|-------------|------------|--------|
| 2026-05-01T19:47:04-04:00 | `54bf6fdb` | fix(vision): remove beta wording from roadmap status chips |
| 2026-05-01T19:44:45-04:00 | `2d54156b` | feat(footer): link Guía de conducta PDF from public |
| 2026-05-01T19:40:36-04:00 | `58449d05` | chore(footer): remove Términos de uso link |
| 2026-05-01T19:29:49-04:00 | `d42dc1a7` | feat(vision): add /vision roadmap page and footer link |
| 2026-05-01T19:13:19-04:00 | `052142c3` | docs(privacy): replace AlmaMundi page with neutral Aviso de Privacidad |
| 2026-05-01T18:58:59-04:00 | `3d74579b` | feat(privacy): mis datos personales form, API email, footer link |
| 2026-05-01T18:53:30-04:00 | `f2125dca` | fix(copy): renew ¿Cómo funciona? modal with editorial policy text |
| 2026-05-01T18:31:46-04:00 | `b85d06c9` | feat(historias): align interior nav header with home pill style |
| 2026-05-01T18:00:26-04:00 | `89a972cc` | Revert "feat: add public beta notice to footer" |
| 2026-05-01T17:57:18-04:00 | `c14bcf69` | feat: add public beta notice to footer |
| 2026-05-01T17:41:20-04:00 | `907d8956` | chore: prepare AlmaMundi public beta |
| 2026-05-01T17:12:33-04:00 | `36403078` | fix(firebase): parse FIREBASE_SERVICE_ACCOUNT_BASE64 as JSON or base64 |

### 2.1 Cuerpos de commit (texto completo exportado)

```
---
Commit: 54bf6fdb96f7d4ce39e2ae2932121de85fe4cc4d
Fecha: 2026-05-01T19:47:04-04:00
Autor: MaleMarin <30419738+MaleMarin@users.noreply.github.com>
Asunto: fix(vision): remove beta wording from roadmap status chips

Cuerpo:
Co-authored-by: Cursor <cursoragent@cursor.com>


---
Commit: 2d54156bd8b59632cb1b4dd0150e38d7e9ab3223
Fecha: 2026-05-01T19:44:45-04:00
Autor: MaleMarin <30419738+MaleMarin@users.noreply.github.com>
Asunto: feat(footer): link Guía de conducta PDF from public

Cuerpo:
- Add Guia de conducta AlmaMundi.pdf to public for static serving
- Footer opens PDF in new tab

Co-authored-by: Cursor <cursoragent@cursor.com>


---
Commit: 58449d0565032015b86328c44e0fac638b18b02b
Fecha: 2026-05-01T19:40:36-04:00
Autor: MaleMarin <30419738+MaleMarin@users.noreply.github.com>
Asunto: chore(footer): remove Términos de uso link

Cuerpo:
Co-authored-by: Cursor <cursoragent@cursor.com>


---
Commit: d42dc1a7b2b3ae5cbbc16158c4ba772109c1cef8
Fecha: 2026-05-01T19:29:49-04:00
Autor: MaleMarin <30419738+MaleMarin@users.noreply.github.com>
Asunto: feat(vision): add /vision roadmap page and footer link

Cuerpo:
- Editorial copy with status badges (beta / desarrollo / futuro)
- Neumorphic styling aligned with privacidad/terminos; no home changes

Co-authored-by: Cursor <cursoragent@cursor.com>


---
Commit: 052142c360198730496212d2498d3be57aee93d8
Fecha: 2026-05-01T19:13:19-04:00
Autor: MaleMarin <30419738+MaleMarin@users.noreply.github.com>
Asunto: docs(privacy): replace AlmaMundi page with neutral Aviso de Privacidad

Cuerpo:
- New intro and sections 1–19; law-agnostic framing; link to /mis-datos-personales
- Keep #s5 anchor for AgeGate under section 14 (menores)
- Metadata title: Aviso de Privacidad

Co-authored-by: Cursor <cursoragent@cursor.com>


---
Commit: 3d74579bd0727442a916bc6c392598e880b485ca
Fecha: 2026-05-01T18:58:59-04:00
Autor: MaleMarin <30419738+MaleMarin@users.noreply.github.com>
Asunto: feat(privacy): mis datos personales form, API email, footer link

Cuerpo:
- Add /mis-datos-personales form (copy acordado, sin leyes ni documentos sensibles)
- POST /api/privacy-data-request via Resend to PRIVACY_DATA_REQUEST_TO or hola@almamundi.org
- Footer link; sitemap; .env.example PRIVACY_DATA_REQUEST_TO

Co-authored-by: Cursor <cursoragent@cursor.com>


---
Commit: f2125dca87cef26e0c2d28a4ed29401a45ea97df
Fecha: 2026-05-01T18:53:30-04:00
Autor: MaleMarin <30419738+MaleMarin@users.noreply.github.com>
Asunto: fix(copy): renew ¿Cómo funciona? modal with editorial policy text

Cuerpo:
Co-authored-by: Cursor <cursoragent@cursor.com>


---
Commit: b85d06c94635c2a7509696a719434b466c3116b2
Fecha: 2026-05-01T18:31:46-04:00
Autor: MaleMarin <30419738+MaleMarin@users.noreply.github.com>
Asunto: feat(historias): align interior nav header with home pill style

Cuerpo:
- Add HistoriasInteriorSiteHeader (fixed bar, logo, PillNavButton + HistoriasAccordion)
- Use on format list layout, story detail, and mi-coleccion; pad main under fixed header
- Keep HomeFirstPart unchanged

Co-authored-by: Cursor <cursoragent@cursor.com>


---
Commit: 89a972ccc318d3975cb097ff5f64b74798d055ac
Fecha: 2026-05-01T18:00:26-04:00
Autor: MaleMarin <30419738+MaleMarin@users.noreply.github.com>
Asunto: Revert "feat: add public beta notice to footer"

Cuerpo:
This reverts commit c14bcf69bfe7c6e324df86f332c732184533619b.


---
Commit: c14bcf69bfe7c6e324df86f332c732184533619b
Fecha: 2026-05-01T17:57:18-04:00
Autor: MaleMarin <30419738+MaleMarin@users.noreply.github.com>
Asunto: feat: add public beta notice to footer

Cuerpo:
Co-authored-by: Cursor <cursoragent@cursor.com>


---
Commit: 907d895623f6af6b1fe3abed699e0ea102fa7cc9
Fecha: 2026-05-01T17:41:20-04:00
Autor: MaleMarin <30419738+MaleMarin@users.noreply.github.com>
Asunto: chore: prepare AlmaMundi public beta

Cuerpo:
Co-authored-by: Cursor <cursoragent@cursor.com>


---
Commit: 36403078e1bd01cf466f779175576e938f66d2e9
Fecha: 2026-05-01T17:12:33-04:00
Autor: MaleMarin <30419738+MaleMarin@users.noreply.github.com>
Asunto: fix(firebase): parse FIREBASE_SERVICE_ACCOUNT_BASE64 as JSON or base64

Cuerpo:
- Trim env value; strip whitespace from base64 before decode
- Accept full service account JSON when value starts with {
- Strip UTF-8 BOM before JSON.parse and improve error hint

Co-authored-by: Cursor <cursoragent@cursor.com>
```

---

## 3. Árbol de trabajo sin commit (`git status` / `git diff --stat`)

**Estado corto:**

```
## main...origin/main
 M app/vision/page.tsx
 M components/stories/DemoStoryDisclosure.tsx
 M components/stories/EthicalShareFlow.tsx
 M components/stories/ResonanceMailbox.tsx
 M lib/demo-stories-public.ts
 M tsconfig.tsbuildinfo
?? docs/COPY_LANZAMIENTO_BETA.md
?? docs/POST_LAUNCH_MONITORING.md
?? lib/historias/historias-exhibition-icons.ts
```

**`git diff --stat HEAD` (solo tracked modificados):**

```
 app/vision/page.tsx                        | 14 +++++++++++++-
 components/stories/DemoStoryDisclosure.tsx |  2 +-
 components/stories/EthicalShareFlow.tsx    | 14 +++++++++++---
 components/stories/ResonanceMailbox.tsx    | 24 ++++++++++++++++++++----
 lib/demo-stories-public.ts                 |  7 ++++---
 tsconfig.tsbuildinfo                       |  2 +-
 6 files changed, 50 insertions(+), 13 deletions(-)
```

**Nota:** `tsconfig.tsbuildinfo` suele ser artefacto de compilación; valorar no versionarlo si ya está en `.gitignore`.

---

## 4. Cómo regenerar este export

Desde la raíz del repositorio:

```bash
git log --since="2026-04-25 00:00:00" --until="2026-05-02 23:59:59" \
  --pretty=format:'---%nCommit: %H%nFecha: %ad%nAutor: %an <%ae>%nAsunto: %s%n%nCuerpo:%n%b%n' --date=iso-strict

git status -sb
git status --porcelain
git diff --stat HEAD
```

Para un rango distinto, ajustar `--since` / `--until`.
