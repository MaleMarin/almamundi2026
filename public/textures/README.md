# Texturas del globo (mapa)

Coloca aquí las texturas del globo para `/mapa`. El globo prioriza la vista día (océanos azules, tierra verde, nubes) tipo mapa mundi / iPhone.

## Archivos

| Archivo            | Uso                                      |
|--------------------|------------------------------------------|
| `earth-day.png` / `earth-day.jpg` | **Principal** – Tierra de día (océanos, continentes verdes). Se usa por defecto en /mapa. |
| `earth-night.jpg`  | Noche – luces de ciudades (transición día/noche).       |
| `earth-clouds.png` | Capa de nubes sobre el globo (opcional; si falta, no hay nubes). |

## Estilo “mapa mundi / iPhone”

Para que se vean bien los océanos, las partes verdes del mundo y las nubes:

- **earth-day.jpg**: Usa una textura tipo **Blue Marble** (océanos azules, tierra verde/marrón, sin demasiado relieve). Resolución recomendada: **4k o 8k**.
- **earth-clouds.png**: Textura de nubes en proyección esférica (equirectangular), con transparencia donde no hay nubes. El globo la muestra con opacidad ~48%.

## Dónde conseguir texturas (libres de uso)

- [NASA Visible Earth](https://visibleearth.nasa.gov/) – “Blue Marble”, “earth day”, “earth night”, “black marble”.
- [Solar System Scope](https://www.solarsystemscope.com/textures/) – Earth day/night; descarga y guarda como `earth-day.jpg` / `earth-night.jpg`.
- [NASA Blue Marble](https://visibleearth.nasa.gov/collection/1484/blue-marble) – Imágenes clásicas de la Tierra de día.

Servir desde esta carpeta evita problemas de CORS.
