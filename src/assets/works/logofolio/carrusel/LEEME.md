# Carrusel de LogoFolio

Soltá acá los PNG. El sitio los detecta solo, sin tocar código:

| Archivo | Dónde va |
|---|---|
| `01a.png` | Lámina 1, columna ancha (izquierda, 8/12) |
| `01b.png` | Lámina 1, columna angosta (derecha, 4/12) |
| `02a.png` / `02b.png` | Lámina 2, y así sucesivamente |

- **Formato:** PNG con fondo transparente. El objeto queda centrado en su cuadro (alto: 75 vh).
- **Tamaño de referencia:** `a` ≈ 1800 × 1200 px (3:2) y `b` ≈ 900 × 1200 px (3:4). Dejá un 10 % de margen alrededor del objeto.
- **Peso:** idealmente menos de 300 KB cada uno.
- Si falta una de las dos imágenes de una lámina, esa columna muestra un recuadro con las medidas.
- Los **subtítulos** de cada lámina se escriben en `src/content/works/logofolio.md`, en la lista `slides` (el primero corresponde a `01`, el segundo a `02`…).
- Para otro proyecto: carpeta `src/assets/works/<nombre-del-proyecto>/carrusel/` con el mismo formato y su lista `slides`.
