// Sistema de casos de estudio (Visual designer que construye lo que diseña).
// Todos los casos usan la misma plantilla: Contexto → Problema → Decisión clave → Proceso →
// Resultado visual → Implementación → Impacto.
//
// Convenciones:
//  · Un texto con `pending: true` es provisional: se marca «PENDIENTE» en pantalla hasta que se reescriba con datos reales.
//  · Una imagen sin `src` dibuja un PLACEHOLDER (fondo oscuro morado con halo); `ph` explica qué falta.
//  · Un indicador sin `value` es una métrica que no tengo: nunca se inventa, queda «PENDIENTE».
//  · Poné `showPending = false` para ocultar las marcas antes de publicar (los placeholders siguen dibujándose).
import type { L10n } from '../lib/i18n';

export const showPending = true;

export type T = L10n & { pending?: boolean };
export type Shot = {
  src?: string;
  alt: L10n;
  cap: L10n;
  ratio?: string;               // por defecto 16 / 10
  fit?: 'cover' | 'contain';
  surface?: 'dark' | 'light' | 'brand';   // fondo detrás de imágenes con transparencia
  zoom?: boolean;               // la imagen abre a tamaño completo en otra pestaña (mapas y flujos largos)
  ph?: L10n;                    // por qué es placeholder y qué hay que reemplazar
};
export type Snippet = { file: string; lang: string; raw?: 'tokens' | 'mixins' | 'buttons' | 'states'; from?: string; to?: string; code?: string; note: L10n };
export type Demo = { src: string; title: L10n; ratio?: string };

export type Case = {
  slug: string;
  num: string;
  pillar: L10n;
  title: L10n;
  line: L10n;                   // una línea para la tarjeta
  year: string;
  role: L10n;
  scope: 'completo' | 'estructura'; // completo = contenido real; estructura = plantilla lista con contenido provisional
  art?: 'tokens' | 'states';    // composición en código para la tarjeta (cuando no hay imagen fuerte)
  cover: Shot;
  cardCover?: Shot;             // si la tarjeta vertical necesita otra imagen que la portada panorámica
  context: T;
  problem: T;
  decisions: { title: L10n; why: T }[];
  chain?: L10n[];               // cadena de proceso en código (ej. manual → variables → mixins → componentes)
  process: Shot[];
  result: Shot[];
  demos?: Demo[];
  swatches?: { hex: string; name: string; use: L10n }[];
  impl: { text: T; snippets: Snippet[] };
  impact: { text: T; metrics: { label: L10n; value?: string }[] };
};

const t = (es: string, en: string, pending = false): T => ({ es, en, ...(pending ? { pending: true } : {}) });
const l = (es: string, en: string): L10n => ({ es, en });

export const cases: Case[] = [
  // ───────────────────────────── 1 · MARCA ─────────────────────────────
  {
    slug: 'wanderlust-marca',
    num: '01',
    pillar: l('Sistema · Marca', 'System · Brand'),
    title: l('Wanderlust Videos: rediseño de marca 2023', 'Wanderlust Videos: 2023 brand redesign'),
    line: l('Un isologo blanco, Montserrat y una paleta que complementa sin invadir.', 'A white logo, Montserrat and a palette that complements without intruding.'),
    year: '2023',
    role: l('Visual designer · Equipo IT & Growth', 'Visual designer · IT & Growth team'),
    scope: 'completo',
    cover: { src: '/casos/wanderlust/iso-blanco.webp', alt: l('Isologo de Wanderlust Videos en blanco sobre fondo oscuro', 'Wanderlust Videos logo mark in white on a dark background'), cap: l('Isologo blanco sobre fondo oscuro', 'White logo mark on a dark background'), fit: 'contain', surface: 'brand' },
    context: t(
      'Wanderlust Videos es un servicio B2B de post-producción de video de bodas para filmmakers. En 2023 rediseñé su identidad visual desde el equipo IT & Growth; el manual de marca documenta las decisiones y el porqué de cada una.',
      'Wanderlust Videos is a B2B wedding-video post-production service for filmmakers. In 2023 I redesigned its visual identity from the IT & Growth team; the brand manual documents each decision and the reason behind it.'),
    problem: t(
      'La marca vive sobre video, en una plataforma web, en mails, en hojas de cálculo y en tableros de tareas. El isologo en degradé azul/fucsia perdía legibilidad sobre imágenes en movimiento, y cada plataforma lo mostraba distinto.',
      'The brand lives on top of video, in a web platform, in emails, in spreadsheets and task boards. The blue/magenta gradient logo lost legibility over moving images, and every platform rendered it differently.'),
    decisions: [
      { title: l('Isologo blanco', 'White logo'), why: t('Un solo color sobre cualquier fondo oscuro o sobre video: la forma queda legible porque no depende de un degradé que cambia de contraste según la imagen de atrás.', 'A single colour on any dark background or video: the shape stays legible because it does not depend on a gradient whose contrast changes with the image behind it.') },
      { title: l('Montserrat como tipografía de marca', 'Montserrat as the brand typeface'), why: t('Está disponible en cualquier plataforma (Sheets, mail, Trello), así que el texto se ve igual donde el equipo trabaja, sin instalar nada ni sustituir por una fuente del sistema.', 'It is available on every platform (Sheets, email, Trello), so type looks the same wherever the team works, with no installs and no fallback to a system font.') },
      { title: l('Paleta funcional, fuera de la marca', 'Functional palette, outside the brand'), why: t('Los colores cumplen un rol (acción, alerta, fondo) y complementan la marca, pero nunca van dentro del isologo. Así el logo no cambia cuando cambia una campaña.', 'Colours have a job (action, alert, background) and complement the brand, but never go inside the logo. That way the logo does not change when a campaign does.') },
    ],
    swatches: [
      { hex: '#34343C', name: 'Gris oscuro', use: l('Fondos y texto principal', 'Backgrounds and main text') },
      { hex: '#0A6794', name: 'Azul', use: l('Botones', 'Buttons') },
      { hex: '#E84D00', name: 'Naranja', use: l('Alertas y acentos', 'Alerts and accents') },
      { hex: '#EDE9E7', name: 'Gris cálido', use: l('Fondos claros', 'Light backgrounds') },
      { hex: '#7CCDE1', name: 'Celeste', use: l('Detalles y secundarios', 'Details and secondary') },
    ],
    process: [
      { src: '/casos/wanderlust/iso-anterior.webp', alt: l('Isologo anterior en degradé azul y fucsia', 'Previous logo in a blue and magenta gradient'), cap: l('Antes: isologo en degradé azul/fucsia', 'Before: blue/magenta gradient logo'), ratio: '16 / 10', fit: 'contain', surface: 'dark' },
      { src: '/casos/wanderlust/logo-anterior.webp', alt: l('Logotipo anterior sobre fondo oscuro', 'Previous logotype on a dark background'), cap: l('Antes: logotipo con el degradé', 'Before: logotype with the gradient'), ratio: '16 / 10', fit: 'contain', surface: 'light' },
      { alt: l('Bocetos del rediseño', 'Redesign sketches'), cap: l('Bocetos y rondas de iteración', 'Sketches and iteration rounds'), ph: l('Casi todo el material está en estado final: faltan bocetos y versiones intermedias.', 'Almost everything is in its final state: sketches and intermediate versions are missing.') },
      { alt: l('Prueba de legibilidad sobre video', 'Legibility test over video'), cap: l('Prueba del logo antes/después sobre un frame de video', 'Before/after logo test over a video frame'), ph: l('Hace falta un frame de video (sin personas identificables) con ambas versiones.', 'A video frame (with no identifiable people) showing both versions is needed.') },
    ],
    result: [
      { src: '/casos/wanderlust/logo-blanco.webp', alt: l('Logotipo blanco horizontal', 'Horizontal white logotype'), cap: l('Logotipo horizontal', 'Horizontal logotype'), ratio: '16 / 10', fit: 'contain', surface: 'brand' },
      { src: '/casos/wanderlust/logo-sobre-oscuro.webp', alt: l('Logotipo blanco con su espacio de respiro', 'White logotype with its clear space'), cap: l('Logotipo con espacio de respiro', 'Logotype with clear space'), ratio: '16 / 10', fit: 'contain', surface: 'brand' },
      { src: '/casos/experiencias/gorra-navy.webp', alt: l('Gorra azul marino con el parche de la marca', 'Navy cap with the brand patch'), cap: l('Aplicación: gorra', 'Application: cap'), ratio: '16 / 10', fit: 'cover' },
      { src: '/casos/campanas/cyber-desktop.webp', alt: l('Pieza de campaña Cyber Monday', 'Cyber Monday campaign piece'), cap: l('Aplicación: campaña', 'Application: campaign'), ratio: '16 / 10', fit: 'cover' },
    ],
    impl: {
      text: t('Así se traducen las reglas del manual a variables CSS (versión recreada): la regla «los colores no van dentro de la marca» pasa a ser una convención de código y no solo una frase del PDF.', 'This is how the manual’s rules translate into CSS variables (rebuilt version): the rule “colours never go inside the brand” becomes a code convention and not just a sentence in a PDF.'),
      snippets: [
        { file: 'brand.css', lang: 'css', code: `/* Paleta funcional: cada color tiene un rol. Complementa la marca, nunca va dentro del isologo. */\n:root {\n  --ink:    #34343C; /* fondos oscuros y texto */\n  --action: #0A6794; /* botones (blanco encima: 6,2:1) */\n  --alert:  #E84D00; /* alertas y acentos; con texto blanco solo en tamaño grande */\n  --paper:  #EDE9E7; /* fondos claros */\n  --sky:    #7CCDE1; /* detalles */\n  --font-brand: 'Montserrat', system-ui, sans-serif;\n}\n\n/* El isologo siempre es blanco sobre fondo oscuro o video */\n.brand-mark { color: #fff; filter: none; }`, note: l('Tokens de marca. Los contrastes se verificaron: el naranja con texto blanco pasa solo en tamaño grande, así que se reserva para acentos.', 'Brand tokens. Contrast was checked: orange with white text only passes at large sizes, so it is reserved for accents.') },
      ],
    },
    impact: {
      text: t('Para el equipo: una regla escrita (qué color, qué tipografía, qué fondo) en lugar de preguntar o adivinar. Falta confirmar y medir ese efecto.', 'For the team: a written rule (which colour, which typeface, which background) instead of asking or guessing. That effect still needs confirming and measuring.', true),
      metrics: [
        { label: l('Tiempo de armado de una pieza nueva', 'Time to build a new piece') },
        { label: l('Consultas al diseñador por uso de marca', 'Brand-usage questions to the designer') },
      ],
    },
  },

  // ───────────────────────────── 2 · DESIGN SYSTEM ─────────────────────────────
  {
    slug: 'design-system-plataforma',
    num: '02',
    pillar: l('Sistema · Front end', 'System · Front end'),
    title: l('Design system de la plataforma', 'Platform design system'),
    line: l('Del manual a variables, mixins y estados que le dan autonomía al equipo.', 'From the manual to variables, mixins and states that give the team autonomy.'),
    year: '2023–2024',
    role: l('Visual designer + front end', 'Visual designer + front end'),
    scope: 'completo',
    art: 'tokens',
    cover: { alt: l('Tokens y botones del design system', 'Design system tokens and buttons'), cap: l('Tokens y botones', 'Tokens and buttons') },
    context: t(
      'La plataforma donde los clientes piden y siguen sus videos es una aplicación Rails con Bootstrap 4. Mantuve su template: la hoja de variables, el tema con ~26 mixins y los estilos propios de cada pantalla.',
      'The platform where clients order and track their videos is a Rails app with Bootstrap 4. I maintained its template: the variables sheet, the theme with ~26 mixins and per-screen styles.'),
    problem: t(
      'El tema de la plataforma vive en un solo archivo de más de 2.600 líneas, y en las landings la misma media query se repite una docena de veces. Falta confirmar cómo se sentía eso en el día a día del equipo.',
      'The platform theme lives in a single 2,600+ line file, and in the landings the same media query repeats a dozen times. How that felt day to day for the team still needs confirming.', true),
    decisions: [
      { title: l('Una sola fuente de verdad: variables', 'One source of truth: variables'), why: t('Paleta, estados y pesos tipográficos viven en un archivo de variables. Cambiar un color es cambiar una línea, y la marca no se desvía entre pantallas.', 'Palette, states and type weights live in one variables file. Changing a colour means changing one line, and the brand does not drift between screens.') },
      { title: l('Mixins para componer, no para copiar', 'Mixins to compose, not to copy'), why: t('Un mixin base de botón y variantes por color, contorno y círculo. Un botón nuevo se escribe en una línea y hereda foco, estados y tamaño.', 'One base button mixin plus colour, outline and circle variants. A new button is a one-liner that inherits focus, states and size.') },
      { title: l('Un mixin de media query y un archivo por componente', 'One media-query mixin and one file per component'), why: t('Un solo `respond()` reemplaza las ~12 repeticiones de la misma media query en las landings, y separar por componente hace que quien llega nuevo encuentre dónde tocar.', 'A single `respond()` replaces the ~12 repeats of the same media query in the landings, and splitting by component means newcomers can find where to edit.') },
    ],
    chain: [l('Manual de marca', 'Brand manual'), l('Variables', 'Variables'), l('Mixins', 'Mixins'), l('Componentes', 'Components'), l('Pantallas', 'Screens')],
    process: [
      { alt: l('Pantalla de la plataforma antes del sistema', 'Platform screen before the system'), cap: l('Antes: estilos repetidos por pantalla', 'Before: styles repeated per screen'), ph: l('Hace falta una captura de la plataforma, sin nombres de clientes ni datos reales.', 'A platform screenshot with no client names or real data is needed.') },
      { alt: l('Inventario de componentes', 'Component inventory'), cap: l('Inventario de componentes (tabla)', 'Component inventory (table)'), ph: l('Tabla de componentes a armar: botones, chips de estado, campos, tablas, alertas.', 'Component table to build: buttons, status chips, fields, tables, alerts.') },
    ],
    result: [],
    demos: [{ src: '/demo/design-system/index.html', title: l('Aster: el sistema recreado con marca neutra (demo viva)', 'Aster: the system rebuilt with a neutral brand (live demo)'), ratio: '16 / 11' }],
    impl: {
      text: t('El código de la empresa es privado, así que lo recreé en limpio con una marca neutra («Aster») conservando la estructura: tokens → mixins → componentes. Un mixin de media query, foco visible y contraste AA verificado.', 'The company code is private, so I rebuilt it from scratch with a neutral brand (“Aster”) keeping the structure: tokens → mixins → components. One media-query mixin, visible focus and verified AA contrast.'),
      snippets: [
        { file: '_tokens.scss', lang: 'scss', raw: 'tokens', from: '// --- Color', to: '// --- Tipografía', note: l('Los mapas son la fuente de verdad; de ahí salen las variables CSS.', 'Maps are the source of truth; CSS variables are generated from them.') },
        { file: '_mixins.scss', lang: 'scss', raw: 'mixins', from: '// Un único mixin', to: '// Texto truncado', note: l('Un mixin de media query, foco consistente y la base de las variantes de botón.', 'One media-query mixin, consistent focus and the base for button variants.') },
        { file: '_buttons.scss', lang: 'scss', raw: 'buttons', from: '// Componente: botón', to: '@keyframes', note: l('El botón: base, variantes, tamaños y estados en un solo componente.', 'The button: base, variants, sizes and states in a single component.') },
      ],
    },
    impact: {
      text: t('Para el equipo: un botón o un estado nuevo deja de ser una decisión de diseño y pasa a ser una línea. Falta medir cuánto se acortó el trabajo de las pantallas nuevas.', 'For the team: a new button or state stops being a design decision and becomes a single line. How much new-screen work got shorter still needs measuring.', true),
      metrics: [
        { label: l('Líneas de CSS repetidas eliminadas', 'Repeated CSS lines removed') },
        { label: l('Tiempo de armado de una pantalla nueva', 'Time to build a new screen') },
      ],
    },
  },

  // ───────────────────────────── 3 · PLATAFORMA ─────────────────────────────
  {
    slug: 'plataforma-flujos',
    num: '03',
    pillar: l('Producto · UX', 'Product · UX'),
    title: l('Plataforma: flujos y estados de proyecto', 'Platform: project flows and states'),
    line: l('Un sistema con cuatro roles, estados que cuentan quién tiene la pelota y un PM con IA.', 'A four-role system, states that say who holds the ball, and an AI project manager.'),
    year: '2023–2024',
    role: l('UX/UI web designer', 'UX/UI web designer'),
    scope: 'estructura',
    art: 'states',
    cover: { alt: l('Estados de proyecto', 'Project states'), cap: l('Estados de proyecto', 'Project states') },
    context: t(
      'La plataforma une a cuatro roles: cliente, editor, QA y project manager. Diseñé los mapas de estados y de proceso que ordenan quién hace qué y cuándo. Equipo y alcance exacto: por completar.',
      'The platform brings together four roles: client, editor, QA and project manager. I designed the state and process maps that organise who does what and when. Team and exact scope: to be completed.', true),
    problem: t(
      'Un proyecto pasa por pagos, material, asignación, edición, revisiones internas y del cliente. Sin un modelo común, cada rol veía algo distinto y nadie sabía a quién le tocaba actuar.',
      'A project goes through payments, footage, assignment, editing, internal and client reviews. Without a shared model, each role saw something different and nobody knew whose turn it was.', true),
    decisions: [
      { title: l('Un estado principal y sub-estados por rol', 'One main state and per-role sub-states'), why: t('Seis estados principales (Draft, Prebooked, Payment pending, Pending, In process, Approved) para leer el panorama, y sub-estados según quien mira, para saber quién debe actuar.', 'Six main states (Draft, Prebooked, Payment pending, Pending, In process, Approved) for the big picture, and sub-states depending on who is looking, to know who must act.') },
      { title: l('Color por rol y por estado', 'Colour by role and by state'), why: t('Cada rol tiene su insignia (CL, ED, PM, QA) y cada estado su color, siempre acompañado de texto. Los mapas se leen sin leyenda.', 'Each role has a badge (CL, ED, PM, QA) and each state a colour, always paired with text. The maps read without a legend.') },
    ],
    process: [
      { src: '/casos/plataforma/flow-estados.webp', alt: l('Mapa de estados de proyecto en la plataforma', 'Map of project states in the platform'), cap: l('Flow de estados de proyecto', 'Project state flow'), ratio: '2 / 3', fit: 'contain', surface: 'light', zoom: true },
      { src: '/casos/plataforma/flow-proceso-a.webp', alt: l('Flow de proceso en la plataforma, primera mitad', 'Platform process flow, first half'), cap: l('Flow de proceso (1/2): del pedido a la asignación', 'Process flow (1/2): from order to assignment'), ratio: '2 / 3', fit: 'contain', surface: 'light', zoom: true },
      { src: '/casos/plataforma/flow-proceso-b.webp', alt: l('Flow de proceso en la plataforma, segunda mitad', 'Platform process flow, second half'), cap: l('Flow de proceso (2/2): edición, revisión y cierre', 'Process flow (2/2): editing, review and close'), ratio: '2 / 3', fit: 'contain', surface: 'light', zoom: true },
    ],
    result: [
      { alt: l('Pantallas finales de la plataforma', 'Final platform screens'), cap: l('Pantallas finales en contexto', 'Final screens in context'), ph: l('El mockup disponible muestra nombres reales de clientes. Hace falta una captura anonimizada.', 'The available mockup shows real client names. An anonymised capture is needed.') },
      { src: '/casos/plataforma/ia-base.webp', alt: l('Burbuja de IA en reposo', 'AI bubble at rest'), cap: l('PM con IA: personaje en reposo', 'AI PM: character at rest'), ratio: '16 / 10', fit: 'contain', surface: 'light' },
      { src: '/casos/plataforma/ia-pensando.webp', alt: l('Burbuja de IA pensando', 'AI bubble thinking'), cap: l('PM con IA: expresión «pensando»', 'AI PM: “thinking” expression'), ratio: '16 / 10', fit: 'contain', surface: 'light' },
    ],
    impl: {
      text: t('Los estados salen de un mapa SCSS: agregar uno es una línea (versión recreada con marca neutra).', 'States come from an SCSS map: adding one is a single line (rebuilt with a neutral brand).'),
      snippets: [
        { file: '_states.scss', lang: 'scss', raw: 'states', from: '// Estados de proyecto', to: '// Alertas', note: l('Chips de estado generados desde un mapa: color y texto, nunca solo color.', 'Status chips generated from a map: colour and text, never colour alone.') },
      ],
    },
    impact: {
      text: t('Por completar: qué cambió para cada rol y cuánto se usa el PM con IA.', 'To complete: what changed for each role and how much the AI PM is used.', true),
      metrics: [
        { label: l('Adopción del PM con IA', 'AI PM adoption') },
        { label: l('Consultas internas sobre «dónde está mi proyecto»', 'Internal “where is my project” questions') },
      ],
    },
  },

  // ───────────────────────────── 4 · CAMPAÑAS ─────────────────────────────
  {
    slug: 'campanas-growth',
    num: '04',
    pillar: l('Campaña · Growth', 'Campaign · Growth'),
    title: l('Campañas de Growth', 'Growth campaigns'),
    line: l('Un sistema de campaña: Cyber Monday, Christmas Offer, Elopement Videos y «Filmmaker? Let’s Connect».', 'A campaign system: Cyber Monday, Christmas Offer, Elopement Videos and “Filmmaker? Let’s Connect”.'),
    year: '2023–2024',
    role: l('Visual designer + front end', 'Visual designer + front end'),
    scope: 'estructura',
    cover: { src: '/casos/campanas/cyber-desktop.webp', alt: l('Pieza Cyber Monday Deals', 'Cyber Monday Deals piece'), cap: l('Cyber Monday', 'Cyber Monday'), fit: 'cover' },
    cardCover: { src: '/casos/campanas/cyber-mobile.webp', alt: l('Pieza Cyber Monday Deals, versión móvil', 'Cyber Monday Deals piece, mobile version'), cap: l('Cyber Monday', 'Cyber Monday'), fit: 'cover' },
    context: t(
      'Desde Growth diseñé las campañas estacionales de Wanderlust y las llevé a código: landings estáticas, newsletters en HTML y las piezas sociales que las acompañan.',
      'From Growth I designed Wanderlust’s seasonal campaigns and built them in code: static landings, HTML newsletters and the social pieces that accompany them.', true),
    problem: t(
      'Cada campaña (Cyber Monday, Christmas Offer, Elopement Videos) necesitaba piezas para web, mail y redes en pocos días, con una identidad reconocible y sin rehacer el sistema cada vez.',
      'Every campaign (Cyber Monday, Christmas Offer, Elopement Videos) needed web, email and social pieces within days, with a recognisable identity and without rebuilding the system each time.', true),
    decisions: [
      { title: l('Una misma estructura, un tema por campaña', 'One structure, one theme per campaign'), why: t('Fondo oscuro con halo de luz, Montserrat y la paleta funcional son fijos; cambia el título, el fondo y el acento. Una campaña nueva es una variante, no un proyecto nuevo.', 'Dark background with a light halo, Montserrat and the functional palette stay fixed; the title, background and accent change. A new campaign is a variant, not a new project.') },
      { title: l('Landing con secuencia fija', 'Landing with a fixed sequence'), why: t('Hero → features → testimonios → how-it-works → pricing → CTA: el lector siempre sabe dónde está y la estructura se reutiliza de una campaña a otra.', 'Hero → features → testimonials → how-it-works → pricing → CTA: readers always know where they are and the structure is reused from one campaign to the next.') },
    ],
    process: [
      { src: '/casos/campanas/filmstrip.webp', alt: l('Tira de película con el lema de la marca', 'Film strip carrying the brand tagline'), cap: l('Elemento gráfico recurrente: la tira de película', 'Recurring graphic: the film strip'), ratio: '16 / 10', fit: 'contain', surface: 'light' },
      { alt: l('Brief y variantes de campaña', 'Campaign brief and variants'), cap: l('Brief y variantes exploradas', 'Brief and explored variants'), ph: l('Hacen falta rondas de bocetos o variantes descartadas de una campaña.', 'Sketch rounds or discarded variants of one campaign are needed.') },
    ],
    result: [
      { src: '/casos/campanas/cyber-desktop.webp', alt: l('Cyber Monday Deals, versión escritorio', 'Cyber Monday Deals, desktop'), cap: l('Cyber Monday: escritorio', 'Cyber Monday: desktop'), ratio: '16 / 10', fit: 'cover' },
      { src: '/casos/campanas/cyber-mobile.webp', alt: l('Cyber Monday Deals, versión móvil', 'Cyber Monday Deals, mobile'), cap: l('Cyber Monday: móvil', 'Cyber Monday: mobile'), ratio: '16 / 10', fit: 'contain', surface: 'dark' },
      { src: '/casos/campanas/calling-all.webp', alt: l('Pieza de captación para videógrafos de bodas', 'Recruiting piece for wedding videographers'), cap: l('Captación de filmmakers', 'Filmmaker outreach'), ratio: '16 / 10', fit: 'contain', surface: 'dark' },
      { src: '/casos/campanas/ipad-pricing.webp', alt: l('Tableta mostrando una pieza de la marca', 'Tablet showing a brand piece'), cap: l('Mockup: pieza sobre tableta', 'Mockup: piece on a tablet'), ratio: '16 / 10', fit: 'contain', surface: 'light' },
      { alt: l('Christmas Offer', 'Christmas Offer'), cap: l('Special Christmas Offer', 'Special Christmas Offer'), ph: l('La pieza incluye una foto de pareja: confirmar licencia o reemplazar la foto.', 'The piece contains a couple photo: confirm the licence or replace the photo.') },
      { alt: l('Elopement Videos', 'Elopement Videos'), cap: l('Elopement Videos (newsletter)', 'Elopement Videos (newsletter)'), ph: l('Hace falta exportar el newsletter (PSD) con una foto libre de uso.', 'The newsletter (PSD) must be exported with a licence-free photo.') },
    ],
    demos: [{ src: '/demo/landing/index.html', title: l('Landing de campaña recreada con marca neutra (demo viva)', 'Campaign landing rebuilt with a neutral brand (live demo)'), ratio: '16 / 11' }],
    impl: {
      text: t('La landing y el newsletter se recrearon en limpio, sin datos de la empresa. La landing reutiliza el mismo sistema de tokens; el email usa tablas, estilos inline y un botón que funciona sin imágenes.', 'The landing and newsletter were rebuilt from scratch with no company data. The landing reuses the same token system; the email uses tables, inline styles and a button that works without images.'),
      snippets: [
        { file: 'newsletter.html', lang: 'html', code: `<!-- Botón «a prueba de balas»: tabla + enlace, funciona sin imágenes ni CSS externo -->\n<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>\n  <td align="center" bgcolor="#c2410c" style="border-radius:999px;">\n    <a href="https://example.com/novedades"\n       style="display:inline-block;padding:14px 28px;font:700 16px Arial,sans-serif;\n              color:#ffffff;text-decoration:none;border-radius:999px;">\n      Ver las novedades\n    </a>\n  </td>\n</tr></table>`, note: l('HTML de mail: lo esencial va inline porque los clientes ignoran casi todo CSS externo. Blanco sobre #C2410C: 5,2:1.', 'Email HTML: essentials are inline because clients ignore most external CSS. White on #C2410C: 5.2:1.') },
      ],
    },
    impact: {
      text: t('Por completar con datos reales de la campaña (aperturas, clics, ventas). Mientras tanto: una campaña nueva se arma como variante de una estructura conocida.', 'To be completed with real campaign data (opens, clicks, sales). Meanwhile: a new campaign is built as a variant of a known structure.', true),
      metrics: [
        { label: l('Tasa de apertura de los newsletters', 'Newsletter open rate') },
        { label: l('Clics hacia la landing', 'Clicks to the landing') },
        { label: l('Ventas atribuidas a la campaña', 'Sales attributed to the campaign') },
      ],
    },
  },

  // ───────────────────────────── 5 · EXPERIENCIAS ─────────────────────────────
  {
    slug: 'experiencias-wppi',
    num: '05',
    pillar: l('Experiencia · 3D y espacio', 'Experience · 3D and space'),
    title: l('Experiencias: stand WPPI y Videos Estrella', 'Experiences: WPPI stand and Videos Estrella'),
    line: l('La misma marca en lo físico (stand, sobres con QR, merch) y en lo inmersivo (un entorno 3D en el navegador).', 'The same brand in the physical (stand, QR envelopes, merch) and the immersive (a 3D browser environment).'),
    year: '2024–2025',
    role: l('Visual designer · dirección creativa del proyecto interno', 'Visual designer · creative direction of the internal project'),
    scope: 'estructura',
    cover: { src: '/casos/experiencias/silla-estrella.webp', alt: l('Silla de director con una estrella iridiscente', 'Director’s chair with an iridescent star'), cap: l('Silla de director: Videos Estrella', 'Director’s chair: Videos Estrella'), fit: 'cover' },
    context: t(
      'Dos experiencias fuera de la pantalla de la plataforma: el stand de Wanderlust en la feria WPPI (planta, sobres con QR, merch) y «Videos Estrella», una propuesta interna de entorno 3D en el navegador.',
      'Two experiences beyond the platform screen: Wanderlust’s stand at the WPPI fair (floor plan, QR envelopes, merch) and “Videos Estrella”, an internal proposal for a 3D browser environment.', true),
    problem: t(
      'En una feria la marca tiene que funcionar en objetos (un sobre, una gorra, una botella) y en un espacio. «Videos Estrella» (Proyecto Inter-Áreas) propone además un entorno 3D en el navegador, con etapas, storyboards y plantas. Motivación y problema: a detallar.',
      'At a fair the brand has to work on objects (an envelope, a cap, a bottle) and in a space. “Videos Estrella” (Inter-Áreas project) also proposes a 3D browser environment with stages, storyboards and floor plans. Motivation and problem: to be detailed.', true),
    decisions: [
      { title: l('Los objetos llevan la marca, no la repiten', 'Objects carry the brand, they do not repeat it'), why: t('El parche, la etiqueta y el sobre usan el isologo y la paleta con una sola idea por objeto, para que se lean de lejos y se recuerden.', 'The patch, label and envelope use the logo and palette with one idea per object, so they read from a distance and stick.', true) },
      { title: l('El mismo lenguaje en 3D', 'The same language in 3D'), why: t('La silla de director con la estrella iridiscente traslada el halo de luz y el fondo oscuro de las campañas a un entorno navegable.', 'The director’s chair with the iridescent star carries the campaigns’ light halo and dark background into a navigable environment.', true) },
    ],
    process: [
      { alt: l('Planta del stand WPPI', 'WPPI stand floor plan'), cap: l('Planta del stand', 'Stand floor plan'), ph: l('El archivo de la planta (Illustrator) no se ve en miniatura: hay que reexportarlo a PNG o PDF.', 'The floor-plan file (Illustrator) does not render as a thumbnail: re-export it as PNG or PDF.') },
      { alt: l('Bocetos del proyecto Inter-Áreas', 'Inter-area project sketches'), cap: l('Etapas y storyboards de «Videos Estrella»', '“Videos Estrella” stages and storyboards'), ph: l('Hace falta exportar los storyboards y bocetos del proyecto Inter-Áreas (PSD).', 'The Inter-Áreas storyboards and sketches (PSD) must be exported.') },
    ],
    result: [
      { src: '/casos/experiencias/sobre.webp', alt: l('Sobre negro cerrado con cordel y flores secas', 'Closed black envelope with string and dried flowers'), cap: l('Sobre del stand', 'Stand envelope'), ratio: '16 / 10', fit: 'contain', surface: 'light' },
      { src: '/casos/experiencias/gorra-negra.webp', alt: l('Gorra negra con el parche de la marca', 'Black cap with the brand patch'), cap: l('Merch: gorra', 'Merch: cap'), ratio: '16 / 10', fit: 'cover' },
      { src: '/casos/experiencias/merch-botella.webp', alt: l('Botella de vino con etiqueta de la marca', 'Wine bottle with the brand label'), cap: l('Merch: botella con etiqueta', 'Merch: labelled bottle'), ratio: '16 / 10', fit: 'cover' },
      { src: '/casos/experiencias/silla-estrella.webp', alt: l('Silla de director con una estrella iridiscente', 'Director’s chair with an iridescent star'), cap: l('Videos Estrella: la silla', 'Videos Estrella: the chair'), ratio: '16 / 10', fit: 'cover' },
      { alt: l('Stand armado en la feria', 'Stand set up at the fair'), cap: l('El stand armado', 'The stand on site'), ph: l('Hacen falta fotos del stand armado, sin personas identificables.', 'Photos of the built stand with no identifiable people are needed.') },
      { src: '/casos/experiencias/afterwrap-logo.webp', alt: l('Logotipo de la submarca afterWRAP', 'afterWRAP sub-brand logo'), cap: l('Extra: submarca afterWRAP', 'Extra: afterWRAP sub-brand'), ratio: '16 / 10', fit: 'contain', surface: 'light' },
    ],
    impl: {
      text: t('Por completar: qué parte del entorno 3D se concretó y con qué herramientas (la propuesta contempla Blender, Spline, Unreal y Spatial Chat).', 'To complete: which part of the 3D environment was built and with which tools (the proposal considers Blender, Spline, Unreal and Spatial Chat).', true),
      snippets: [],
    },
    impact: {
      text: t('Por completar: leads captados con los QR y alcance del stand.', 'To complete: leads captured with the QR codes and stand reach.', true),
      metrics: [
        { label: l('Escaneos de los sobres con QR', 'Envelope QR scans') },
        { label: l('Visitas al stand', 'Stand visits') },
      ],
    },
  },
];

export const caseBySlug = (slug: string) => cases.find((c) => c.slug === slug);
