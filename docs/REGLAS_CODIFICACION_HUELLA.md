# Guía de la Perfección Visual: de los datos a la geometría

La huella es una visualización contenida en un **círculo perfecto y nítido**, compuesta por **múltiples capas** de rectángulos y píxeles superpuestos que generan profundidad. **Geometría de precisión**: formas vectoriales de bordes duros (hard-edged), sin desenfoque ni partículas.

## Estructura y composición

- **Constraint de forma:** Todo queda dentro de un círculo perfecto y centrado. Nada de dispersiones fuera.
- **Capas múltiples:** Base → Core → Fragmentación → (opcional) Capa por modo. La superposición crea profundidad y nuevos tonos por transparencia.
- **Geometría de precisión:** Bordes nítidos, sin blur ni “wisps” artísticos.

## Entradas de diseño (desde GPT / análisis)

| Entrada | Origen | Rango | Efecto visual |
|--------|--------|-------|----------------|
| **tone** | Tono de voz / emoción (grave↔agudo, calma↔energía) | 0–1 | **Paleta**: 0 = fría, 1 = cálida |
| **rhythm** | Ritmo de movimiento / escritura (lento↔rápido) | 0–1 | **Densidad del core**: 0 = bloques grandes / poca superposición, 1 = píxeles pequeños / alta densidad |
| **depth** | Complejidad narrativa / volumen (simple↔compleja) | 0–1 | **Capas y superposición**: 0 = menos capas; 1 = más capas y transparencia, nuevos colores donde se tocan |
| **modo** (format) | Tipo de historia (texto, audio, video, imagen) | — | **Capa por modo**: tinte translúcido distintivo (ej. audio = más verde/teal) sobre toda la composición |

## 1. Mapeo de colores (tone)

- **tone bajo (grave/calma):** Paleta **fría**
  - Base: cerulean profundo, violeta, azul, teal (translúcidos).
  - Core: magenta, púrpura profundo.
  - Fragmentación: naranja vibrante, verde.
- **tone alto (agudo/energía):** Paleta **cálida**
  - Base: rojo profundo, naranja (translúcidos).
  - Core: magenta, amarillo.
  - Fragmentación: verde, azul, teal.

## 2. Mapeo de densidad (rhythm)

- **rhythm bajo (lento/pausado):** Core con bloques **grandes**, **poca superposición** central, **baja densidad**.
- **rhythm alto (rápido/frenético):** Core con bloques **muy pequeños** (tipo píxel), **muy densos**, **alta superposición** central.

## 3. Mapeo de complejidad (depth)

- **depth bajo (simple):** Menos capas, bloques de base más grandes, **menos fragmentos** periféricos.
- **depth alto (compleja):** **Múltiples capas** superpuestas, más fragmentos en la periferia, tonos secundarios donde las capas se tocan.

## 4. Capa por modo (diferenciación)

Cada tipo de historia tiene un **tinte translúcido** sobre toda la composición, dentro del círculo:

- **Audio:** Teal/verde (`rgba(20, 184, 166, 0.14)`).
- **Video:** Magenta suave (`rgba(219, 39, 119, 0.08)`).
- **Imagen:** Tinte cálido (`rgba(234, 179, 8, 0.06)`).
- **Texto:** Cerulean suave (`rgba(30, 95, 116, 0.06)`).

## Estilos de referencia

- **Huella nostálgica/profunda (cromáticamente fría):** Base cerulean y violeta (hard-edged, translúcida). Core denso de cyan eléctrico, magenta y naranja profundo superpuestos. Fragmentación verde y amarillo en racimos controlados en la periferia. Opcional: capa por modo (ej. audio = teal/verde translúcido). Círculo nítido, sin partículas ni bordes difusos.
- **Huella energética/compleja (cálida):** Base rojo y naranja; core muy denso (magenta+amarillo); fragmentación verde+azul+teal en racimos densos en toda la periferia. Bordes nítidos, contenido en círculo perfecto.

## Implementación

- **Tipos:** `lib/huella/types.ts` (`StoryAnalysis.tone`, `HuellaVisualParams.modeOverlay`).
- **Traducción:** `lib/huella/translate.ts` (`getPalette(tone)`, `buildBase`, `buildCore`, `buildFragmentation`, `getModeOverlay(format)`).
- **Análisis:** `lib/huella/analyze.ts` (prompt GPT con `tone`, `rhythm`, `depth`; se pasa `format` a `analysisToVisualParams`).
- **Render:** `app/page.tsx` `ImprontaFromVisualParams` dibuja base → core → fragmentation → `modeOverlay` (fill del círculo con el rgba) → borde del círculo.
