export const langs = ['es', 'en'] as const;
export type Lang = (typeof langs)[number];
export type L10n = { es: string; en: string };

export const loc = (v: L10n | undefined, lang: Lang) => (v ? v[lang] : '');

// Compatible con GitHub Pages en subcarpeta (/repo): todo enlace interno pasa por withBase.
const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
export const withBase = (p: string) => `${base}${p.startsWith('/') ? p : '/' + p}`;

const seg = { es: 'trabajos', en: 'works' } as const;
export const paths = {
  home: (l: Lang) => withBase(l === 'es' ? '/' : '/en/'),
  works: (l: Lang) => withBase(`${l === 'es' ? '' : '/en'}/${seg[l]}/`),
  work: (l: Lang, id: string) => withBase(`${l === 'es' ? '' : '/en'}/${seg[l]}/${id}/`),
  contact: (l: Lang) => paths.home(l) + '#contacto',
};

export const copy = {
  es: {
    htmlLang: 'es',
    role: 'Director de Arte · Visual Designer · UX/UI',
    tagline: 'Marcas, interfaces y movimiento con criterio.',
    nav: [
      { key: 'home', label: 'Inicio' },
      { key: 'works', label: 'Trabajos' },
      { key: 'contact', label: 'Contacto' },
    ],
    switchTo: 'English',
    hero: {
      title: 'Diseño que <span class="serif-i">se siente</span> antes de leerse.',
      lead: 'Soy Pablo Ponce García. Desde 2009 construyo marcas, interfaces y piezas audiovisuales con foco en la claridad y el detalle.',
      cta: 'Trabajos',
    },
    marquee: ['Dirección de arte', 'Brand', 'UX / UI', 'Front-end', 'Motion', 'Concept art'],
    featured: { eyebrow: 'Selección', title: 'Trabajos destacados', all: 'Ver todos los trabajos' },
    profile: {
      eyebrow: 'Perfil',
      title: 'Estrategia y oficio, en la misma mesa.',
      items: [
        { n: '01', title: 'Dirección de Arte & Marca', text: 'Identidad, sistemas visuales y concepto. Formación en Identidad Corporativa con Norberto Chaves y Dirección de Arte Integral (HAUS).' },
        { n: '02', title: 'UX / UI & Front-End', text: 'Diseño de experiencias digitales en Figma y desarrollo con HTML, SCSS, JavaScript y WordPress desde 2013.' },
        { n: '03', title: 'Audiovisual & Concept Art', text: 'Edición en DaVinci Resolve, motion graphics, diseño de personaje y concept art para video y videojuegos.' },
      ],
    },
    timeline: {
      eyebrow: 'Trayectoria',
      items: [
        { years: '2023 — 2025', what: 'Visual Designer · Front-End · UX/UI', where: 'Wanderlust Videos' },
        { years: '2023 — 2024', what: 'Visual Designer · Web Designer', where: 'Quark Talent' },
        { years: '2021 — 2022', what: 'Diseño gráfico · WordPress Theme Dev', where: 'Kurve.ar' },
        { years: '2020 — 2022', what: 'Concept Artist · UX/UI en videojuegos', where: 'Zaedius' },
        { years: '2016 — 2019', what: 'WordPress Developer · UI Designer', where: 'Concomitancia Digital' },
        { years: '2009 — hoy', what: 'Diseñador freelance', where: 'Blackroom Design' },
      ],
    },
    footer: { eyebrow: 'Contacto', title: 'Hablemos de tu próximo proyecto.', wa: 'Escribir por WhatsApp', cv: 'Descargar CV' },
    fab: { cv: 'Descargar CV', wa: 'Contacto por WhatsApp' },
    waText: 'Hola Pablo, vi tu portfolio y me gustaría conversar sobre un proyecto.',
    works: { title: 'Trabajos', index: 'Índice', projects: 'proyectos', back: '← Trabajos', metaDesc: 'Selección de proyectos de branding, UX/UI y desarrollo web.' },
    detail: { year: 'Año', role: 'Rol', client: 'Cliente', stack: 'Stack', repo: 'Ver repositorio', live: 'Live preview', next: 'Siguiente proyecto', nextCursor: 'Siguiente', view: 'Ver', gallery: 'Galería', play: 'Reproducir', cover: '[Imagen de portada]' },
  },
  en: {
    htmlLang: 'en',
    role: 'Art Director · Visual Designer · UX/UI',
    tagline: 'Brands, interfaces and motion with purpose.',
    nav: [
      { key: 'home', label: 'Home' },
      { key: 'works', label: 'Work' },
      { key: 'contact', label: 'Contact' },
    ],
    switchTo: 'Español',
    hero: {
      title: 'Design that <span class="serif-i">feels</span> before it’s read.',
      lead: 'I’m Pablo Ponce García. Since 2009 I’ve been building brands, interfaces and audiovisual pieces with a focus on clarity and detail.',
      cta: 'Work',
    },
    marquee: ['Art direction', 'Brand', 'UX / UI', 'Front-end', 'Motion', 'Concept art'],
    featured: { eyebrow: 'Selected', title: 'Featured work', all: 'View all work' },
    profile: {
      eyebrow: 'Profile',
      title: 'Strategy and craft, at the same table.',
      items: [
        { n: '01', title: 'Art Direction & Brand', text: 'Identity, visual systems and concept. Trained in Corporate Identity with Norberto Chaves and in Integral Art Direction (HAUS).' },
        { n: '02', title: 'UX / UI & Front-End', text: 'Digital experience design in Figma and development with HTML, SCSS, JavaScript and WordPress since 2013.' },
        { n: '03', title: 'Audiovisual & Concept Art', text: 'Editing in DaVinci Resolve, motion graphics, character design and concept art for video and video games.' },
      ],
    },
    timeline: {
      eyebrow: 'Experience',
      items: [
        { years: '2023 — 2025', what: 'Visual Designer · Front-End · UX/UI', where: 'Wanderlust Videos' },
        { years: '2023 — 2024', what: 'Visual Designer · Web Designer', where: 'Quark Talent' },
        { years: '2021 — 2022', what: 'Graphic design · WordPress theme dev', where: 'Kurve.ar' },
        { years: '2020 — 2022', what: 'Concept Artist · Game UX/UI', where: 'Zaedius' },
        { years: '2016 — 2019', what: 'WordPress Developer · UI Designer', where: 'Concomitancia Digital' },
        { years: '2009 — present', what: 'Freelance designer', where: 'Blackroom Design' },
      ],
    },
    footer: { eyebrow: 'Contact', title: 'Let’s talk about your next project.', wa: 'Message on WhatsApp', cv: 'Download CV' },
    fab: { cv: 'Download CV', wa: 'Contact via WhatsApp' },
    waText: 'Hi Pablo, I saw your portfolio and I’d like to talk about a project.',
    works: { title: 'Work', index: 'Index', projects: 'projects', back: '← Work', metaDesc: 'Selected branding, UX/UI and web development projects.' },
    detail: { year: 'Year', role: 'Role', client: 'Client', stack: 'Stack', repo: 'View repository', live: 'Live preview', next: 'Next project', nextCursor: 'Next', view: 'View', gallery: 'Gallery', play: 'Play', cover: '[Cover image]' },
  },
} as const;
