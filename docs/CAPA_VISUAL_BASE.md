# Capa visual base – Entrega

Solo se modificó **app/globals.css**. No existe `tailwind.config.js` en el proyecto (Tailwind v4 con PostCSS); no se creó para no alterar el build.

---

## 1. Lista de cambios

| Archivo | Cambio |
|---------|--------|
| **app/globals.css** | • Nuevas variables en `:root`: `--arena`, `--earth-500`, `--glass-bg`, `--glass-border`, `--glass-blur`, `--neo-shadow`, `--neo-light`, `--neo-radius`, `--ease-soft`. |
| | • `body`: fondo en gradiente suave (cream → cream-100), `line-height` 1.6, `letter-spacing` 0.01em, `-webkit-font-smoothing: antialiased`, transición suave. |
| | • `:focus-visible`: outline ocre suave (accesible, sin neón). |
| | • Clases opcionales `.glass-base` y `.neumo-base` para uso futuro (glass suave + neumorfismo ligero). |
| **tailwind.config.js** | No modificado ni creado (Tailwind v4 no lo usa por defecto). |

**No tocado:** app/page.tsx, routing, estructura, textos, nuevas páginas o componentes.

---

## 2. Diff (resumen)

```diff
--- app/globals.css (antes)
+++ app/globals.css (después)

+ Comentario: "CAPA VISUAL BASE (solo tokens y base global)"

  :root {
+   --arena: #e8e0d5;
+   --earth-500: #6b6258;
+   --glass-bg: rgba(255, 255, 255, 0.4);
+   --glass-border: rgba(255, 255, 255, 0.55);
+   --glass-blur: 12px;
+   --neo-shadow: 8px 8px 20px rgba(163, 177, 198, 0.18);
+   --neo-light: -8px -8px 20px rgba(255, 255, 255, 0.6);
+   --neo-radius: 24px;
+   --ease-soft: 0.25s ease;
  }

  body {
-  background: var(--cream);
+  background: linear-gradient(180deg, var(--cream) 0%, var(--cream-100) 100%);
+  font-size: 1rem;
+  line-height: 1.6;
+  letter-spacing: 0.01em;
+  -webkit-font-smoothing: antialiased;
+  transition: background var(--ease-soft), color var(--ease-soft);
  }

+ :focus-visible { outline: 2px solid var(--ochre-400); outline-offset: 2px; }
+ .glass-base { ... }
+ .neumo-base { ... }
```

---

## 3. Cómo revertir

**Opción A – Git**
```bash
git checkout HEAD -- app/globals.css
```

**Opción B – Manual**  
Restaurar el contenido anterior de `app/globals.css`:

- Quitar comentarios "CAPA VISUAL BASE" y "No modifica layout ni textos".
- En `:root`: eliminar `--arena`, `--earth-500`, `--glass-bg`, `--glass-border`, `--glass-blur`, `--neo-shadow`, `--neo-light`, `--neo-radius`, `--ease-soft`.
- En `body`: dejar `background: var(--cream);` sin gradiente; quitar `font-size`, `line-height`, `letter-spacing`, `-webkit-font-smoothing`, `transition`.
- Eliminar la regla `:focus-visible` y las clases `.glass-base` y `.neumo-base`.

---

*Generado al aplicar solo la capa visual base. app/page.tsx no fue modificado.*
