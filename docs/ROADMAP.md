# AlmaMundi — Roadmap Completo
## Todo lo que construimos. En orden de impacto y dependencias.

---

## FASE 1 — La experiencia base tiene que impresionar primero
*Sin esto, todo lo demás no importa.*

### 1A. El visor cinematográfico con paralax
Cuando alguien hace clic en un punto del globo:
- El globo hace zoom suave hacia ese punto (movimiento de satélite)
- Todo lo demás del mapa se oscurece
- El contenido emerge desde abajo con paralax
- El globo sigue girando lentamente detrás como fondo vivo
- Al cerrar, el globo vuelve a su estado normal con transición inversa

**Archivos:** `app/mapa/historias/[id]/page.tsx` + modificar `pointOfView` en `page.tsx`  
**Tiempo:** 1 prompt de Cursor

### 1B. Fotos con presentación cinematográfica
Historia de fotos = Ken Burns lento, una foto por vez, con silencio entre cada una.  
Nombre de la foto + fecha aparecen como subtítulo de película.  
No hay galería. No hay flechas. Solo el tiempo.

**Archivos:** Nuevo componente `PhotoStoryViewer.tsx`  
**Tiempo:** 1 prompt de Cursor

### 1C. "Versión para cerrar los ojos"
Botón en historias de texto → Web Speech API lee el texto en voz suave.  
El fondo responde igual que con el audio real.  
Sin librerías externas — solo `window.speechSynthesis`.

**Archivos:** Agregar a `app/mapa/historias/[id]/page.tsx`  
**Tiempo:** Media hora

### 1D. "La historia que te eligió"
Botón flotante en el mapa: *"Déjame sorprender"*  
Algoritmo: hora del día + historias leídas en sesión + atmósfera actual → elige una.  
Sin explicar por qué. Solo te lleva.

**Archivos:** Función `pickStoryForMe()` + botón en `page.tsx`  
**Tiempo:** 1 prompt de Cursor

---

## FASE 2 — La emoción después de leer

### 2A. El Eco — grabar 10 segundos de reacción
### 2B. El Último Segundo (addendum a los 30s)
### 2C. "¿Quieres que el autor sepa que esto te llegó?"
### 2D. El Momento Justo (20 min en sitio → ofrecer dejar historia)

---

## FASE 3 — La red invisible

### 3A. La cadena de lugares (mini-globo de lecturas)
### 3B. El tiempo real de lectura ("Alguien está aquí ahora")
### 3C. Historias en cadena — arcos en el globo
### 3D. El mapa de tu propia vida (tras 5 historias)

---

## FASE 4 — Lo que llega por fuera del sitio

### 4A. Postales por email
### 4B. "Alguien pensó en ti cuando leyó esto"
### 4C. Modo WhatsApp

---

## FASE 5 — La atmósfera

### 5A. Historias que se activan con el clima
### 5B. El visor de fotos con paralax completo (Ken Burns)
### 5C. La transición de cámara completa

---

## Orden de implementación sugerido

| Semana | Enfoque        | Items   |
|--------|----------------|--------|
| 1      | Experiencia base | 1A, 1B, 1C, 1D |
| 2      | Emoción        | 2A, 2B, 2C, 2D |
| 3      | Red            | 3A, 3B, 3C, 3D |
| 4      | Afuera         | 4A, 4B, 4C     |
| 5      | Atmósfera      | 5A, 5B, 5C     |

---

*Lo que hace a AlmaMundi imposible de copiar: no es una feature, es que todas juntas crean un sitio que siente el tiempo, el lugar, la emoción, conecta sin exponer y llega donde los demás no llegan.*
