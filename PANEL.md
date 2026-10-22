# Panel de edición

Para editar textos, imágenes y proyectos sin tocar código:

```bash
npm run panel
```

Se abre `http://localhost:4321/keystatic` en el navegador.

- **Proyectos**: lista de todos los trabajos. `Add` crea uno nuevo (título, textos ES/EN, imágenes, galería, destacado en Home, orden). Las imágenes que subas quedan en `public/works/<proyecto>/`.
- **Textos y datos del sitio**: nombre, correo, WhatsApp, CV en PDF, redes, y los textos principales de la Home, el perfil y el pie de página (ES y EN).

Cada `Save` escribe directamente en los archivos del proyecto (`src/content/works/*.md` y `src/data/editable.json`). El sitio se actualiza al instante en el servidor de desarrollo. Para publicar, hacé commit de esos cambios (cuando se decida subir a GitHub Pages).

El panel solo existe en modo desarrollo: el sitio publicado (`npm run build`) sigue siendo 100 % estático y no incluye nada del panel.

Notas:
- Al guardar un proyecto, Keystatic renombra sus imágenes a `cover.png`, `hero.png`, etc. dentro de `public/works/<proyecto>/` y actualiza las rutas solo.
- Las imágenes del carrusel de LogoFolio siguen yendo en `src/assets/works/logofolio/carrusel/` (01a, 01b…); desde el panel se editan sus textos y ajustes.
