export const site = {
  name: 'Pablo Ponce García',
  studio: 'ZMA BLK Design',
  role: 'Director de Arte · Visual Designer · UX/UI',
  tagline: 'Marcas, interfaces y movimiento con criterio.',
  location: 'Mendoza, Argentina',
  email: 'zma.blk.design@gmail.com',
  // Formato internacional sin "+": 54 9 + característica + número
  whatsapp: '5492614712481',
  whatsappText: 'Hola Pablo, vi tu portfolio y me gustaría conversar sobre un proyecto.',
  cv: '/Pablo-Ponce-Garcia-CV.pdf',
  social: [
    { icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/pabloponcegarcia/' },
    { icon: 'behance', label: 'Behance', href: 'https://www.behance.net/BkRoom' },
    { icon: 'substack', label: 'Substack', href: 'https://substack.com/' }, // TODO: tu URL de Substack
  ],
  nav: [
    { label: 'Inicio', href: '/' },
    { label: 'Trabajos', href: '/trabajos' },
    { label: 'Contacto', href: '/#contacto' },
  ],
  // Datos reales del CV, para la sección Perfil
  disciplines: [
    { n: '01', title: 'Dirección de Arte & Marca', text: 'Identidad, sistemas visuales y concepto. Formación en Identidad Corporativa con Norberto Chaves y Dirección de Arte Integral (HAUS).' },
    { n: '02', title: 'UX / UI & Front-End', text: 'Diseño de experiencias digitales en Figma y desarrollo con HTML, SCSS, JavaScript y WordPress desde 2013.' },
    { n: '03', title: 'Audiovisual & Concept Art', text: 'Edición en DaVinci Resolve, motion graphics, diseño de personaje y concept art para video y videojuegos.' },
  ],
  timeline: [
    { years: '2023 — 2025', what: 'Visual Designer · Front-End · UX/UI', where: 'Wanderlust Videos' },
    { years: '2023 — 2024', what: 'Visual Designer · Web Designer', where: 'Quark Talent' },
    { years: '2021 — 2022', what: 'Diseño gráfico · WordPress Theme Dev', where: 'Kurve.ar' },
    { years: '2020 — 2022', what: 'Concept Artist · UX/UI en videojuegos', where: 'Zaedius' },
    { years: '2016 — 2019', what: 'WordPress Developer · UI Designer', where: 'Concomitancia Digital' },
    { years: '2009 — hoy', what: 'Diseñador freelance', where: 'Blackroom Design' },
  ],
};

export const waLink = () =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappText)}`;
