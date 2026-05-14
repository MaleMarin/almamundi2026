# Dónde está el código de las tarjetas y sus funciones

Todo está en **`app/page.tsx`** (home principal).

## 1. Tarjetas (vista)

- **Componente `SoftCard`** (tarjeta neumórfica): líneas **~545–588**
- **Las 3 tarjetas** (Video, Audio, Texto) que se ven en la home: líneas **~1665–1678**

## 2. Funciones y estado que usan las tarjetas

- **Estado del modal** (qué tarjeta se abrió): `modalMode`, `setModalMode` — líneas **~1505**
- **Estado Propósito / Inspiración**: `showPurpose`, `showInspiration`, `chosenTopic` — líneas **~1506–1510**
- **Handlers**: al hacer clic en cada tarjeta se llama `setModalMode('Video')`, `setModalMode('Audio')`, `setModalMode('Texto')` — líneas **1667, 1671, 1675**

## 3. Modales (contenido y lógica completa)

- **`useModalUX`** (cerrar con Escape, bloquear scroll): líneas **~183–199**
- **`PurposeModal`** (“Nuestro Propósito”): líneas **~591–620**
- **`InspirationModal`** (temas de inspiración; al elegir uno abre “Texto”): líneas **~622–708**
- **`StoryModal`** (flujo completo Grabar video/audio o escribir texto, formulario, envío, “recibido”): líneas **~710–1504**

Dentro de `StoryModal` está:
- Pasos: capture → details → received
- Grabación de video/audio (MediaRecorder, stream, preview)
- Formulario: título, nombre, email, edad, sexo, ciudad, país, privacidad
- Texto largo (hasta 6000 caracteres) y tema de inspiración
- Lógica de envío, resonancia visual, descarga de imagen, etc.

## 4. Resumen por archivo

| Qué | Dónde |
|-----|--------|
| Tarjetas (UI) | `app/page.tsx` ~545 (SoftCard), ~1665–1678 (las 3 instancias) |
| Estado y handlers | `app/page.tsx` ~1505–1510, 1667/1671/1675 |
| Modales Propósito e Inspiración | `app/page.tsx` ~591–708 |
| Modal Historia (Video/Audio/Texto) completo | `app/page.tsx` ~710–1504 |

La **primera parte visual** (header + intro + tarjetas) está también en **`components/home/HomeFirstPart.tsx`**, pero **sin** los modales ni la lógica de grabación/enviar; eso sigue solo en `app/page.tsx`.
