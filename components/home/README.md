# Primera parte de la home (clone)

Esta carpeta contiene **la parte clonada de la primera parte de la home**: header (logo + nav), intro (titular + subtítulo) y las tres tarjetas (Video, Audio, Texto).

## Cómo usarla en el repo original sin borrar nada

1. Copia el archivo `HomeFirstPart.tsx` al repo original (por ejemplo en `components/home/HomeFirstPart.tsx`).
2. En la página principal del original, importa y renderiza la primera parte donde quieras:

```tsx
import { HomeFirstPart } from '@/components/home/HomeFirstPart';

// En tu página:
<HomeFirstPart
  onShowPurpose={() => setShowPurpose(true)}
  onShowComoFunciona={() => setComoFuncionaOpen(true)}
  onRecordVideo={() => setModalMode('Video')}
  onRecordAudio={() => setModalMode('Audio')}
  onWriteStory={() => setModalMode('Texto')}
  onUploadPhoto={() => setModalMode('Foto')}
  basePath=""   // o "/" si los enlaces #historias / Mapa deben ir a la misma app
/>
```

3. No hace falta borrar nada del original: puedes reemplazar solo el bloque (header + intro + cards) por este componente, o añadir una ruta nueva que muestre solo esta parte para comparar.

## Vista previa en el clone

En este repo puedes ver solo esta parte en: **[/preview-home](/preview-home)**.
