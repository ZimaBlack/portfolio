# ASSETS.md — Proyecto «Wanderlust Videos: de la marca a la plataforma»

Qué asset se usó, de dónde salió y qué es placeholder.
Origen de todo lo que no es código propio: `Downloads/Proyectos listos/Wander Design/` (abreviado `WD/`).

**Estados**
- **REAL** — archivo existente, exportado/convertido a WebP sin retoque de contenido.
- **REAL · REVISAR** — usable, pero necesita tu confirmación (autorización de la empresa o licencia).
- **PLACEHOLDER** — se dibuja un marco oscuro morado con halo de luz y la etiqueta «PLACEHOLDER» (Montserrat). No hay archivo: reemplazalo por el real.
- **GENERADO** — código escrito desde cero para el portfolio (marca neutra, sin datos de la empresa).

El proyecto es una sola página con 7 capítulos: `src/components/wander/WanderStory.astro` (datos de portada en `src/content/works/wanderlust-videos.md`). Para ocultar las marcas «PENDIENTE» antes de publicar: `showPending = false` en ese componente (los placeholders se siguen dibujando hasta que los reemplaces).

---

## 1. Assets reales usados (`public/works/wanderlust-videos/…`)

| Archivo publicado | Origen (`WD/…`) | Dónde se usa | Estado |
|---|---|---|---|
| `marca/iso-anterior.webp` | `Recursos/Static Landing Pages/brand-iso-dark.png` | Cap. 1 · Punto de partida («antes») | REAL · REVISAR — confirmá que es el isologo degradé anterior a 2023 |
| `marca/logo-anterior.webp` | `Recursos/Recursos Wander/Brand Wander.png` | Cap. 1 · Punto de partida («antes») | REAL · REVISAR — ídem |
| `marca/iso-blanco.webp` | `Recursos/wander/Graficas Iniciales/Frame 23.png` | Capítulo 2 · La marca (y portada) | REAL · REVISAR (marca de la empresa) |
| `marca/logo-blanco.webp` | `Recursos/wander/Graficas Iniciales/Frame 22.png` | Cap. 2 · La marca | REAL · REVISAR |
| `marca/logo-sobre-oscuro.webp` | `Recursos/wander/Graficas Iniciales/Frame 24.png` | Cap. 2 · La marca | REAL · REVISAR |
| `campanas/cyber-desktop.webp` | `Recursos/GROWTH/BGDESKTOP01.png` | Cap. 5 · Campañas | REAL |
| `campanas/cyber-mobile.webp` | `Recursos/GROWTH/BGMOBILE01.png` | Cap. 5 · Campañas / Más piezas | REAL |
| `campanas/calling-all.webp` | `Recursos/Recursos Wander/Group 63.png` | Cap. 5 · Campañas / Más piezas | REAL (solo tipografía, sin fotos) |
| `campanas/filmstrip.webp` | `Recursos/wander/Captura.png` | Cap. 5 · Campañas / Más piezas | REAL |
| `campanas/ipad-pricing.webp` | `Recursos/IpadWanderFreebiesMobile.png` | Cap. 5 · Campañas / Más piezas | REAL (el mockup solo dice «Pricing»; no muestra cifras) |
| `plataforma/flow-estados.webp` | `Originales/Flow de Estado de Proyecto.pdf` (página renderizada con `sips`) | Cap. 4 · Plataforma | REAL · REVISAR — no tiene nombres de personas; sí el logo de la empresa |
| `plataforma/flow-proceso-a.webp`, `flow-proceso-b.webp` | `Originales/Flow de Proceso en Plataforma.pdf` (renderizado y partido en dos) | Cap. 4 · Plataforma | REAL · REVISAR — ídem |
| `plataforma/ia-base.webp`, `ia-pensando.webp` | `Recursos/wander/Wander AI Character/head-pose.png`, `head-pose-thinking.png` | Cap. 4 · Plataforma | REAL |
| `experiencias/sobre.webp` | `Recursos/Recursos Wander/packs.png` | Cap. 6 / Más piezas | REAL — el QR no está en la imagen; ver pendiente |
| `experiencias/gorra-navy.webp`, `gorra-negra.webp` | `Mocks y muestras/CapDesign/Samples/NavyCap.png`, `BlackCap.png` | Caps. 2 y 6 | REAL |
| `experiencias/merch-botella.webp` | `Recursos/wander/Growth/ModeloBotella01.png` | Cap. 6 / Más piezas | REAL |
| `experiencias/silla-estrella.webp` | `Recursos/star.png` | Cap. 6 · Experiencias | REAL |
| `experiencias/afterwrap-logo.webp` | `Recursos/AFTER WRAP/PNG/LOGO SQUARE DARK.png` | Más piezas | REAL |

La **marca de Wanderlust, los flujos de plataforma y las campañas son de la empresa**: pedí su autorización por escrito antes de publicar (y revisá tu acuerdo de transición, que no abrí).

## 2. Placeholders (no hay archivo — hay que reemplazarlos)

| Dónde | Qué mostrar | Por qué falta |
|---|---|---|
| Cap. 1–2 | Bocetos y rondas de iteración | Casi todo está en estado final |
| Cap. 1–2 | Prueba del logo antes/después sobre un frame de video | Hace falta un frame sin personas identificables |
| Cap. 3 · Sistema | Captura de la plataforma «antes» | No hay captura sin datos de clientes |
| Cap. 3 · Sistema | Tabla/inventario de componentes | A armar (botones, chips, campos, tablas, alertas) |
| Cap. 4 · Plataforma | Pantallas finales de la plataforma | `LaptopPlataform*.png` muestran **nombres reales de parejas clientes** (No usado). Hace falta una captura anonimizada |
| Cap. 5 · Campañas | Brief y variantes de campaña | No hay bocetos |
| Cap. 5 · Campañas | Special Christmas Offer | La pieza lleva foto de pareja: confirmar licencia o reemplazar |
| Cap. 5 · Campañas | Newsletter Elopement Videos | PSD en blanco en miniatura: reexportar con foto libre |
| Cap. 6 · Experiencias | Planta del stand WPPI | `Planta stand Wander WPPI.ai` no se ve en miniatura: reexportar PNG/PDF |
| Cap. 6 · Experiencias | Storyboards de «Videos Estrella» | `Interarea Bocetos.psd`: reexportar |
| Cap. 6 · Experiencias | Foto del stand armado | No hay fotos (sin personas identificables) |
| Archivo | Newsletter WPPI (mail) | Lleva foto de stock: confirmar licencia |
| Archivo | Planta del stand, Christmas, Elopement | Los mismos de arriba |

## 3. Código y demos generados (`demo-src/` → `public/demo/`)

`public/works/wanderlust-videos/cover.webp` es la portada vertical de la tarjeta: isologo blanco centrado sobre `#282931`, compuesta con ffmpeg (GENERADO).

Todo **GENERADO** desde cero, con marca neutra («Aster» / «Relevo»), sin datos de la empresa. Estructura inspirada en tu `variables` + `theme-pablo`, **no copiada**.

- `demo-src/design-system/` — `_tokens`, `_mixins` (con `respond()`), `_typography`, `_buttons`, `_states`, `style.scss`. Compilado a `public/demo/design-system/style.css` con `npm run demo`.
- `demo-src/landing/style.scss` — hero → features → testimonios → how-it-works → pricing → CTA. Textos y precios **ficticios**.
- `public/demo/email/newsletter.html` y `signature.html` — email en tablas con estilos inline, modo oscuro, firma sin personas.
- `public/demo/fonts/` — Montserrat Variable (`@fontsource-variable/montserrat`, licencia OFL).

Contraste verificado (WCAG): blanco/primario 6,1:1 · blanco/acento 5,2:1 · muted/paper 5,7:1 · estados sobre su fondo suave ≥ 4,6:1.

## 4. Material que NO se usó (a propósito)

- Facturas, contratos, acuerdos de transición/retención, notas fiscales y claves: no se abrieron.
- Presentaciones del equipo y carpetas de fotos de personal/firmas: tienen nombres, cargos y fotos.
- `LaptopPlataform*.png`: muestran nombres reales de clientes.
- Fotos de bodas/parejas (`Recursos Wander`, `Recursos Varios`, `WPPI NL`, `Nuevas capturas`, `MediaOthers`): licencia sin verificar.
- Datos de infraestructura, herramientas internas, precios y cifras internas.

## 5. Pendientes de contenido («PENDIENTE» en pantalla)

- **Cap. 1:** prueba del logo antes/después sobre un frame de video real; confirmar que `iso-anterior` y `logo-anterior` son el logo previo a 2023.
- **Cap. 4:** capturas anonimizadas de la plataforma; equipo y alcance exactos.
- **Cap. 5:** foto libre para Christmas Offer y Elopement Videos.
- **Cap. 6:** qué parte del entorno 3D se concretó y con qué herramientas; planta y foto del stand armado.
- **Cap. 7:** todos los indicadores (tiempos de armado, consultas al diseñador, aperturas/clics/ventas, adopción del PM con IA, QR y visitas). No se inventó ninguno.
- Rol exacto, tamaño del equipo y años: confirmar en `src/content/works/wanderlust-videos.md`.

---

## 6. Colorada · «Videos de prueba con IA» (`public/works/colorada/videos/`)

| Archivo | Origen | Estado |
|---|---|---|
| `prueba-01.mp4` / `.webp` | `Downloads/gemini_generated_video_7fe7ad4c.mp4` (recomprimido a 540 px, con audio; póster del segundo 0,3) | REAL · generado con IA (Gemini) |
| `prueba-02.mp4` / `.webp` | `Downloads/gemini_generated_video_edc650e8.mp4` | ídem |
| `prueba-03.mp4` / `.webp` | `Downloads/gemini_generated_video_8401a2e5.mp4` | ídem |

Los subtítulos son la transcripción del audio (Whisper, con tiempos por palabra): 01 «Fluo, neón, oscuro, colorada», 02 «Fluo, neón, oscuro, kawaii, caos, colorada». El 03 no tiene voz detectable: se recortó a 5,9 s sin audio y funciona como loop del cambio de color del pelo, con el logotipo sin isotipo (`mark.svg`) que toma los colores de lo que se ve (tonos elegidos a mano, cuadro a cuadro, en `ColoradaVideos.astro`). Las capas (logo de entrada, subtítulos con código, marcas, paleta, sticker y cierre con el líquido del hero) son **GENERADAS** por código en `src/components/ColoradaVideos.astro`; no hay nada quemado en los videos. Los hex mostrados en el selector de la prueba 03 (plata, violeta, menta) son referencias decorativas, no parte de la paleta madre.

## 7. Wanderlust · «Próximamente»

El proyecto está cargado completo pero con `locked: true` (mismo formato que Pirulo: contenido desenfocado bajo una cubierta). Para publicarlo: quitar `locked: true` y `coverKind` de `src/content/works/wanderlust-videos.md`.

### Beats de fondo (originales, libres de copyright)

`demo-src/beats/make_beats.py` sintetiza tres beats desde cero con numpy (sin samples ni melodías de terceros): 01 La menor y 02 Do mayor, a 96 BPM y 10 s exactos (4 compases), y 03 un loop de 8 pulsos (5,92 s) con un arpegio que sube mientras cambia el color del pelo. Van mezclados dentro del audio de cada `prueba-0N.mp4` (la voz de los clips 1 y 2 queda por encima), así que no hay nada que sincronizar. La entrada del logo dura 2 pulsos (1,25 s) y el cierre entra en el 4.º compás (7,5 s). Para regenerarlos: `python3 demo-src/beats/make_beats.py <carpeta>`.
