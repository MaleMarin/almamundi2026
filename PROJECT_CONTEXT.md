# Almamundi – Contexto del Proyecto

## Objetivo
Almamundi es una plataforma pública para contar y explorar historias humanas reales.
No buscamos algo infantil ni tecnológico-futurista, sino una experiencia cinematográfica,
emocional, accesible y seria.

## Estado actual
- El sitio YA FUNCIONA.
- Las personas ya pueden subir historias (texto / audio / video).
- Existe un mapa donde conviven historias y noticias en vivo.
- NO queremos cambiar textos ni estructura base.

## Qué NO hacer
- No inventar nombres nuevos de secciones.
- No cambiar la narrativa existente.
- No rehacer la arquitectura desde cero.
- No estética "espacio / universo / neón / infantil".

## Qué SÍ hacer
- Aplicar una capa visual base (glass suave + neumorfismo ligero).
- Mantener todo accesible y claro.
- Pensar el sitio como un museo vivo de historias.
- Preparar el terreno para:
  - historias colaborativas
  - ramas narrativas
  - cartas entre historias
  - remix narrativo
  (pero sin romper lo actual).

## Referencias clave
- whatismissing.org → experiencia cinematográfica, no scroll infinito
- logartis.info → sobriedad cultural, museo, archivo vivo

## Regla principal
Primero capacidades, luego estética fina.

---

## INSTRUCCIÓN DURA (regla de oro)

**Prohibido editar:** `app/page.tsx`, routing, estructura de secciones, textos.

**Solo permitido editar:**
- `app/globals.css`
- `tailwind.config.*` (si existe)
- `app/layout.tsx` (solo wrappers / tipografía)
- Archivos de tokens (si existen)

**Objetivo:** capa visual base (glass suave + neumorfismo ligero), accesible, sobria, sin neón, sin "espacio".

**Antes de proponer cambios:** lista exactamente qué archivos vas a tocar y por qué.
