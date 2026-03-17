# Código del mapa – referencia para buscar el error

Hay **dos** mapas:
- **Home (127.0.0.1:3005/)** → `VideoGlobe.tsx` (globo 2D con vídeo)
- **/mapa (127.0.0.1:3005/mapa)** → `MapFullPage.tsx` (globo 3D)

Los bits salen de `lib/bits-data.ts` (BITS_DATA). México = id 23, lat 23.6345, lon -102.5528.

---

## 1. VideoGlobe.tsx (HOME – globo 2D)

**Ubicación:** `components/map/VideoGlobe.tsx`

### Fórmula de posición en la esfera (misma convención que lib/globe-coords)

- Y = norte (lat +90 → y = +R), longitud 0 en +Z.
- `x = R·cos(lat)·sin(lon)`, `y = R·sin(lat)`, `z = R·cos(lat)·cos(lon)` con R=1.

### Posición en pantalla (dotPositions)

- Textura con `rotate(180deg)` → `left: 50 + x*50%`, `top: 50 + y*50%`.

### Estructura del DOM

- Un **div que rota** (`globeRotationRef`) con `transform: rotate(${deg}deg)`.
- Dentro: `<video>` y `<img>` con `transform: 'scale(1.15) rotate(180deg)'`.
- Dentro del mismo div: **overlay de bits** con `left`/`top` fijos (dotPositions).
- Cada frame solo se actualiza **opacity** y **pointerEvents** según `zView > 0.1` (visibilidad).

### Visibilidad cada frame (líneas 172-183)

```javascript
const { x, y, z } = bitPositionOnSphere(point.lat, point.lng);
const { zView } = applyRotationY(x, y, z, ry);
const visible = zView > 0.1;
el.style.opacity = visible ? '1' : '0';
el.style.pointerEvents = visible ? 'auto' : 'none';
```

---

## 2. MapFullPage.tsx (PÁGINA /mapa – globo 3D)

**Ubicación:** `components/map/MapFullPage.tsx`

### Posición de los bits en el globo 3D

Se usa **`lib/globe-coords.ts`** → `latLngToCartesian(lat, lon, R)` (convención: Y=norte, lon 0 en +Z). El mesh tiene `rotation.x = Math.PI` (norte arriba) → se pone el marcador en `(x, -y, z)`.

```javascript
import { latLngToCartesian } from '@/lib/globe-coords';
// ...
const { x, y, z } = latLngToCartesian(bit.lat, bit.lon, R);
dot.position.set(x, -y, z);
globe.add(dot);
```

### Orientación del globo 3D (líneas 3838-3852)

```javascript
mat.map.repeat.y = -1;
mat.map.offset.y = 1;
globeMesh.rotation.x = Math.PI;
globeMesh.rotation.z = 0.41;
globeMesh.rotation.y = -1.8;
```

---

## 3. Datos de los bits (Home)

**Ubicación:** `components/map/HomeMap.tsx` (líneas 56-66)

```javascript
const huellasPoints = useMemo<VideoGlobePoint[]>(
  () =>
    BITS_DATA.map((b) => ({
      lat: b.lat,
      lng: b.lon,   // ← se pasa como lng (VideoGlobe usa .lng)
      id: b.id,
      titulo: b.titulo ?? b.lugar,
      lugar: b.lugar,
      pais: b.pais,
    })),
  [BITS_DATA]
);
// ...
<VideoGlobe points={huellasPoints} ... />
```

---

## 4. Convención única (lib/globe-coords.ts)

- **VideoGlobe** y **MapFullPage** usan la misma convención geográfica: `x = R·cos(lat)·sin(lon)`, `y = R·sin(lat)`, `z = R·cos(lat)·cos(lon)` (lon 0 = +Z, Y = norte).
- Si la textura del globo 3D tuviera el meridiano 0 en -Z, habría que probar `dot.position.set(x, -y, -z)`.
- En 2D, la textura con `rotate(180deg)` se alinea con `left: 50 + x*50%`, `top: 50 + y*50%`.

---

## 5. Archivos

- **Conversión lat/lng → 3D:** `lib/globe-coords.ts` (`latLngToCartesian`)
- **VideoGlobe:** `components/map/VideoGlobe.tsx`
- **MapFullPage (bits + orientación globo):** ~3303-3332 y ~3832-3854 en `components/map/MapFullPage.tsx`
- **Bits data:** `lib/bits-data.ts`
- **Home:** `components/map/HomeMap.tsx` (BITS_DATA → huellasPoints → VideoGlobe)
