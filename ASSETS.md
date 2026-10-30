# ASSETS.md — Sistema de casos de estudio

Qué asset se usó, de dónde salió y qué es placeholder.
Origen de todo lo que no es código propio: `Downloads/Proyectos listos/Wander Design/` (abreviado `WD/`).

**Estados**
- **REAL** — archivo existente, exportado/convertido a WebP sin retoque de contenido.
- **REAL · REVISAR** — usable, pero necesita tu confirmación (autorización de la empresa o licencia).
- **PLACEHOLDER** — se dibuja un marco oscuro morado con halo de luz y la etiqueta «PLACEHOLDER» (Montserrat). No hay archivo: reemplazalo por el real.
- **GENERADO** — código escrito desde cero para el portfolio (marca neutra, sin datos de la empresa).

Para ocultar las marcas «PENDIENTE» antes de publicar: `showPending = false` en `src/data/cases.ts` (los placeholders se siguen dibujando hasta que los reemplaces).

---

## 1. Assets reales usados (`public/casos/…`)

| Archivo publicado | Origen (`WD/…`) | Dónde se usa | Estado |
|---|---|---|---|
| `wanderlust/iso-anterior.webp` | `Recursos/Static Landing Pages/brand-iso-dark.png` | Caso 1 · Proceso («antes») | REAL · REVISAR — confirmá que es el isologo degradé anterior a 2023 |
| `wanderlust/logo-anterior.webp` | `Recursos/Recursos Wander/Brand Wander.png` | Caso 1 · Proceso («antes») | REAL · REVISAR — ídem |
| `wanderlust/iso-blanco.webp` | `Recursos/wander/Graficas Iniciales/Frame 23.png` | Caso 1 · portada | REAL · REVISAR (marca de la empresa) |
| `wanderlust/logo-blanco.webp` | `Recursos/wander/Graficas Iniciales/Frame 22.png` | Caso 1 · resultado | REAL · REVISAR |
| `wanderlust/logo-sobre-oscuro.webp` | `Recursos/wander/Graficas Iniciales/Frame 24.png` | Caso 1 · resultado | REAL · REVISAR |
| `campanas/cyber-desktop.webp` | `Recursos/GROWTH/BGDESKTOP01.png` | Casos 1 y 4, Home, archivo | REAL |
| `campanas/cyber-mobile.webp` | `Recursos/GROWTH/BGMOBILE01.png` | Caso 4, archivo | REAL |
| `campanas/calling-all.webp` | `Recursos/Recursos Wander/Group 63.png` | Caso 4, archivo | REAL (solo tipografía, sin fotos) |
| `campanas/filmstrip.webp` | `Recursos/wander/Captura.png` | Caso 4, archivo | REAL |
| `campanas/ipad-pricing.webp` | `Recursos/IpadWanderFreebiesMobile.png` | Caso 4, archivo | REAL (el mockup solo dice «Pricing»; no muestra cifras) |
| `plataforma/flow-estados.webp` | `Originales/Flow de Estado de Proyecto.pdf` (página renderizada con `sips`) | Caso 3 · Proceso, archivo | REAL · REVISAR — no tiene nombres de personas; sí el logo de la empresa |
| `plataforma/flow-proceso-a.webp`, `flow-proceso-b.webp` | `Originales/Flow de Proceso en Plataforma.pdf` (renderizado y partido en dos) | Caso 3 · Proceso | REAL · REVISAR — ídem |
| `plataforma/ia-base.webp`, `ia-pensando.webp` | `Recursos/wander/Wander AI Character/head-pose.png`, `head-pose-thinking.png` | Caso 3 · Resultado, archivo | REAL |
| `experiencias/sobre.webp` | `Recursos/Recursos Wander/packs.png` | Caso 5, archivo | REAL — el QR no está en la imagen; ver pendiente |
| `experiencias/gorra-navy.webp`, `gorra-negra.webp` | `Mocks y muestras/CapDesign/Samples/NavyCap.png`, `BlackCap.png` | Casos 1 y 5, archivo | REAL |
| `experiencias/merch-botella.webp` | `Recursos/wander/Growth/ModeloBotella01.png` | Caso 5, archivo | REAL |
| `experiencias/silla-estrella.webp` | `Recursos/star.png` | Caso 5 · portada, Home, archivo | REAL |
| `experiencias/afterwrap-logo.webp` | `Recursos/AFTER WRAP/PNG/LOGO SQUARE DARK.png` | Caso 5 (extra), archivo | REAL |

La **marca de Wanderlust, los flujos de plataforma y las campañas son de la empresa**: pedí su autorización por escrito antes de publicar (y revisá tu acuerdo de transición, que no abrí).

## 2. Placeholders (no hay archivo — hay que reemplazarlos)

| Dónde | Qué mostrar | Por qué falta |
|---|---|---|
| Caso 1 · Proceso | Bocetos y rondas de iteración | Casi todo está en estado final |
| Caso 1 · Proceso | Prueba del logo antes/después sobre un frame de video | Hace falta un frame sin personas identificables |
| Caso 2 · Proceso | Captura de la plataforma «antes» | No hay captura sin datos de clientes |
| Caso 2 · Proceso | Tabla/inventario de componentes | A armar (botones, chips, campos, tablas, alertas) |
| Caso 3 · Resultado | Pantallas finales de la plataforma | `LaptopPlataform*.png` muestran **nombres reales de parejas clientes** (No usado). Hace falta una captura anonimizada |
| Caso 4 · Proceso | Brief y variantes de campaña | No hay bocetos |
| Caso 4 · Resultado | Special Christmas Offer | La pieza lleva foto de pareja: confirmar licencia o reemplazar |
| Caso 4 · Resultado | Newsletter Elopement Videos | PSD en blanco en miniatura: reexportar con foto libre |
| Caso 5 · Proceso | Planta del stand WPPI | `Planta stand Wander WPPI.ai` no se ve en miniatura: reexportar PNG/PDF |
| Caso 5 · Proceso | Storyboards de «Videos Estrella» | `Interarea Bocetos.psd`: reexportar |
| Caso 5 · Resultado | Foto del stand armado | No hay fotos (sin personas identificables) |
| Archivo | Newsletter WPPI (mail) | Lleva foto de stock: confirmar licencia |
| Archivo | Planta del stand, Christmas, Elopement | Los mismos de arriba |

## 3. Código y demos generados (`demo-src/` → `public/demo/`)

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

- **Caso 1:** tiempo de armado de piezas y consultas al diseñador (impacto); confirmar y medir el efecto en el equipo.
- **Caso 2:** líneas de CSS repetidas eliminadas y tiempo de armado de pantallas; confirmar cómo se vivía el problema.
- **Caso 3:** equipo y alcance exactos; adopción del PM con IA; consultas internas «¿dónde está mi proyecto?».
- **Caso 4:** aperturas, clics y ventas; confirmar el detalle de cada campaña.
- **Caso 5:** qué parte del entorno 3D se concretó y con qué herramientas; escaneos de QR y visitas al stand; motivación del proyecto.
- Todos: el rol exacto, el tamaño del equipo y el año de cada proyecto están en `src/data/cases.ts`.
