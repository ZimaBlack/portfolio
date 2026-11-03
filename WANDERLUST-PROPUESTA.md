# Wanderlust Videos: propuesta para que un reclutador entienda qué hiciste

Los textos entre `[corchetes]` son datos que solo vos podés confirmar. No los inventé: completalos o borrá la frase.

## 1. Diagnóstico

La página de hoy cuenta bien el trabajo, pero lo ordena por **entregable** (marca, sistema, plataforma, campañas, experiencias, impacto). Un reclutador se hace otras preguntas y no tiene dónde responderlas:

1. ¿Qué era la empresa y qué lugar tenías vos?
2. ¿Qué hiciste personalmente y qué hizo el equipo?
3. ¿Qué cambió gracias a tu trabajo?
4. ¿Qué herramientas y habilidades demuestra?

Además, hoy hay cosas que le restan:

- Las etiquetas «Pendiente» y «A confirmar» (`showPending = true`) dejan la impresión de un trabajo sin terminar.
- Las métricas son una lista de indicadores vacíos.
- Hay cinco recuadros sin imagen (pantallas finales, Christmas, newsletter, planta del stand, stand armado).
- El rol dice «Visual designer & front end · Equipo IT & Growth», que es correcto pero no explica el alcance.

## 2. Recomendación

**Mantener los 7 capítulos como evidencia y agregar arriba una ficha de 30 segundos que conteste las cuatro preguntas.** Quien quiera profundizar baja; quien solo escanea se lleva lo importante.

### Estructura propuesta

| Lugar | Qué va | Cambio |
|---|---|---|
| Arriba, antes del capítulo 01 | **Ficha**: empresa, mi rol, equipo, período, herramientas, 3 resultados | Nuevo |
| Capítulo «Qué hice yo» | Responsabilidades en 5 líneas, en primera persona | Nuevo |
| Capítulos 01 a 06 | Mismo orden; se reescribe solo la bajada de cada uno (ver 3.4) | Texto |
| Capítulo 07 «Impacto» | Resultados cualitativos concretos, sin tabla de métricas vacías | Se reemplaza |
| Etiquetas «Pendiente» | Poner `showPending = false` y ocultar los recuadros sin imagen hasta tener el material | Config |

### Por qué importa este proyecto

Es el que mejor muestra tu perfil híbrido: diseñás y también escribís el código de lo que diseñás. Ese hilo se repite en tus otros proyectos y conviene decirlo una sola vez, igual en todos:

- **Wanderlust:** manual de marca convertido en variables, mixins y componentes (SCSS).
- **NovaPsi:** diseño y desarrollo completo de un producto, con tres accesos y dos bases de datos.
- **Turnero y Seguimiento médico:** UX/UI y desarrollo.
- **Colorada:** sistema de identidad con manual interactivo.

Propuesta: subirlo a `featured: true` (hoy es `false`) y darle el rol de **caso de estudio de empresa**, al lado de NovaPsi como **caso de producto propio**.

## 3. Textos

### 3.1 Titular y bajada (reemplazan `summary` y `text` del proyecto)

**ES**
> **Titular:** Diseñé y programé el sistema de marca de una plataforma B2B de video.
> **Bajada:** En Wanderlust Videos rediseñé el isologo para que se lea sobre video, convertí el manual de marca en un sistema de diseño en código y lo apliqué a la plataforma, a las campañas y al stand de la empresa en la feria WPPI.

**EN**
> **Headline:** I designed and coded the brand system of a B2B video platform.
> **Intro:** At Wanderlust Videos I redesigned the logo so it stays legible over video, turned the brand manual into a design system in code, and applied it to the platform, the campaigns and the company's stand at the WPPI trade show.

### 3.2 Ficha de 30 segundos

| | ES | EN |
|---|---|---|
| Empresa / Company | Wanderlust Videos: post-producción de video de bodas para filmmakers (B2B) | Wanderlust Videos: wedding-video post-production for filmmakers (B2B) |
| Mi rol / My role | Visual designer y front end, en el equipo de IT & Growth | Visual designer and front end, in the IT & Growth team |
| Período / Period | [2023 – año de cierre] | [2023 – end year] |
| Equipo / Team | [Con quién trabajaba: producto, edición, QA, marketing] | [Who I worked with: product, editing, QA, marketing] |
| Herramientas / Tools | SCSS, HTML/CSS, [Figma, Photoshop, Illustrator, Trello, Sheets: confirmar cuáles] | SCSS, HTML/CSS, [Figma, Photoshop, Illustrator, Trello, Sheets: confirmar cuáles] |
| Alcance / Scope | Marca, sistema de diseño, flujos de la plataforma, campañas, stand | Brand, design system, platform flows, campaigns, stand |

### 3.3 «Qué hice yo» (primera persona, con verbos de acción)

**ES**
- Rediseñé el isologo (2023): pasé de un degradé azul/fucsia, que perdía legibilidad sobre imágenes en movimiento, a una versión blanca de un solo color.
- Escribí el sistema de diseño en código: variables, mixins y componentes, con contraste AA verificado por fórmula y foco visible en todo elemento interactivo.
- Diseñé los mapas de estados y de proceso de la plataforma: cuatro roles (cliente, editor, QA y project manager) trabajando sobre un mismo proyecto, con seis estados y sub-estados por rol.
- Apliqué la marca en campañas (Cyber Monday, Elopement Videos, ofertas de Navidad, captación de filmmakers), landings y newsletters.
- [Alcance a confirmar] Participé en el stand de la marca en WPPI: sobres, merch y «Videos Estrella», un entorno 3D en el navegador.

**EN**
- I redesigned the logo (2023): from a blue/magenta gradient that lost legibility over moving images to a single-colour white version.
- I wrote the design system in code: variables, mixins and components, with AA contrast checked by formula and visible focus on every interactive element.
- I designed the platform's state and process maps: four roles (client, editor, QA and project manager) working on one project, with six states and per-role sub-states.
- I applied the brand to campaigns (Cyber Monday, Elopement Videos, Christmas offers, filmmaker outreach), landings and newsletters.
- [Scope to confirm] I took part in the brand's WPPI stand: envelopes, merch and “Videos Estrella”, a 3D environment in the browser.

### 3.4 Bajadas de los capítulos, en lenguaje de resultado

| Capítulo | ES | EN |
|---|---|---|
| 01 Punto de partida | La marca vivía en video, web, mails, hojas de cálculo y tableros, y se veía distinta en cada lugar. | The brand lived in video, web, email, spreadsheets and boards, and looked different in each. |
| 02 La marca | Un isologo de un solo color que se lee sobre cualquier fondo o video. | A single-colour logo that reads over any background or video. |
| 03 El sistema | Las reglas del manual pasaron a código: agregar un botón o un estado nuevo es una línea. | The manual's rules moved into code: adding a button or state is one line. |
| 04 La plataforma | Mapas que dicen a quién le toca actuar en cada etapa de un proyecto. | Maps that show whose turn it is at every stage of a project. |
| 05 Las campañas | Piezas y landings que reutilizan los mismos componentes, sin empezar de cero. | Pieces and landings that reuse the same components, with no starting from scratch. |
| 06 Las experiencias | La marca fuera de la pantalla: stand, merch y un entorno 3D. | The brand off the screen: stand, merch and a 3D environment. |

### 3.5 Capítulo 07: qué cambió (sin números inventados)

**ES**
> Para el equipo hubo una regla escrita en lugar de preguntar o adivinar, y las piezas y pantallas se armaban con componentes en vez de empezar de cero. [Si tenés un dato real, agregalo: «el tiempo de armado de una pieza bajó de X a Y» o «las consultas al diseñador por uso de marca bajaron».]

**EN**
> The team got a written rule instead of asking or guessing, and pieces and screens were built from components instead of from scratch. [If you have a real figure, add it: “time to build a piece went from X to Y” or “brand-usage questions to the designer dropped”.]

**Regla para este capítulo:** si no hay un número real, no se muestra ninguno. Un resultado cualitativo concreto convence más que una tabla de «Pendiente».

### 3.6 Frase común para todos los proyectos (el hilo)

**ES:** «Diseño sistemas de marca y también escribo el código que los hace funcionar.»
**EN:** “I design brand systems and also write the code that makes them work.”

Va como línea en el encabezado de Trabajos y en la bio de la portada.

## 4. Qué necesito de vos para aplicarlo

1. Período real y tamaño del equipo.
2. Qué parte del stand en WPPI fue tuya.
3. Si hay algún dato real de resultado (aunque sea aproximado).
4. Si la empresa autoriza mostrar las pantallas finales de la plataforma; si no, las quitamos.
5. Si querés que lo deje como `featured` en la portada.

Con eso cargo los textos en `src/components/wander/WanderStory.astro` y `src/content/works/wanderlust-videos.md`, en ES y EN.
