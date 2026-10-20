# Carrusel de LogoFolio

Soltá acá los SVG (o PNG/WebP/JPG). El sitio los detecta solo, sin tocar código:

| Archivo | Dónde va |
|---|---|
| `01a.svg` | Lámina 1, columna ancha (izquierda, 8/12) |
| `01b.svg` | Lámina 1, columna angosta (derecha, 4/12) |
| `02a.svg` / `02b.svg` | Lámina 2, y así sucesivamente |

- **Formato:** SVG (recomendado, escala sin perder nitidez) o PNG con fondo transparente. Los números pueden ir con o sin cero (`1a` o `01a`). El objeto queda centrado en su cuadro (alto: 75 vh).
- **Tamaño de referencia:** `a` ≈ 1800 × 1200 px (3:2) y `b` ≈ 900 × 1200 px (3:4). Dejá un 10 % de margen alrededor del objeto.
- **Peso:** idealmente menos de 300 KB cada uno.
- Si falta una de las dos imágenes de una lámina, esa columna muestra un recuadro con las medidas.
- Los **subtítulos** de cada lámina se escriben en `src/content/works/logofolio.md`, en la lista `slides` (el primero corresponde a `01`, el segundo a `02`…).
- Para otro proyecto: carpeta `src/assets/works/<nombre-del-proyecto>/carrusel/` con el mismo formato y su lista `slides`.

## Ambiente de color
Al compilar, el sitio lee los colores de cada SVG (ponderados por el tamaño de cada forma) y arma, para cada lámina, un degradado circular suave sobre el lado derecho con dos tonos armónicos de sus logos. Al cambiar de lámina el ambiente se funde con el siguiente. Si los logos son blancos, grises o negros, usa una luz neutra. (La lógica está en `src/lib/palette.ts`.)

## Archivos que no se usan
Los que no siguen el formato `NNa` / `NNb` (por ejemplo `6a-1.svg`) se ignoran.
