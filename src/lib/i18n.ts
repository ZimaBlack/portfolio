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
  cv: (l: Lang) => withBase(`${l === 'es' ? '' : '/en'}/cv/`),
};

export const copy = {
  es: {
    htmlLang: 'es',
    role: 'Director de Arte · Visual Designer · UX/UI',
    tagline: 'Marcas, interfaces y movimiento con criterio.',
    nav: [
      { key: 'home', label: 'Inicio' },
      { key: 'works', label: 'Trabajos' },
      { key: 'cv', label: 'CV' },
      { key: 'contact', label: 'Contacto' },
    ],
    switchTo: 'English',
    hero: { cta: 'Trabajos' },
    marquee: ['Dirección de arte', 'Brand', 'UX / UI', 'Front-end', 'Motion', 'Concept art'],
    featured: { eyebrow: 'Selección', title: 'Trabajos destacados', all: 'Ver todos los trabajos' },
    profile: {
      eyebrow: 'Perfil',
      title: 'Estrategia y oficio',
      prompt: {
        aiLabel: "Este portfolio fue desarrollado con la asistencia de",
        greeting: "Hola, soy el asistente de IA de Pablo. Para saber más de él, haz clic en Enviar.",
        thinking: ["Cavilando", "Pensando"],
        cvLabel: "su CV completo",
        // Cuatro versiones del mismo mensaje, con énfasis distinto. Se elige una al azar en cada visita.
        variants: [
          {
            intro: "Con gusto. Te cuento cómo es Pablo trabajando, que es lo que suele importar cuando se busca a alguien realmente detallista.",
            blocks: [
              { lead: "Cuida lo que otros dejan pasar.", text: "Trabaja en rondas cortas y precisas, arma la jerarquía con tipografía, peso y tono antes que con tamaño o adorno, y prefiere quitar a agregar. Si algo no suma, sale." },
              { lead: "Es Director de Arte y Lic. en Diseño Integral,", text: "en actividad desde 2009. Diseña la marca y la interfaz en Figma y las lleva a código él mismo, con programación asistida por IA: lo que se diseña es lo que se publica." },
              { lead: "Usa la IA con criterio.", text: "Claude y Gemini son parte de su día a día para investigar, redactar y programar. La IA acelera; las decisiones de diseño siguen siendo suyas." },
              { lead: "Y es claro con sus límites.", text: "Para ingeniería de back-end o software a gran escala conviene sumar un equipo técnico, y él mismo lo dice." },
            ],
            close: "Puedes comprobarlo todo: los proyectos de esta web y {cv} lo respaldan, con trayectoria en Wanderlust Videos, Quark Talent y Kurve.ar. Si quieres saber algo más, pregunta aquí abajo o escribe a {mail}.",
          },
          {
            intro: "Claro. Lo más útil que puedo decirte de Pablo es que resuelve de punta a punta, y eso se nota en los tiempos y en la coordinación.",
            blocks: [
              { lead: "Un solo interlocutor.", text: "Identidad, producto digital y obra gráfica pasan por la misma persona: menos traspasos entre estudio y desarrollo, menos idas y vueltas y una sola visión de principio a fin." },
              { lead: "Diseña y construye.", text: "Es Director de Arte y Lic. en Diseño Integral (Universidad de Mendoza), activo desde 2009, y lleva sus propias interfaces a código real con HTML, SCSS y JavaScript." },
              { lead: "Se mueve bien con IA.", text: "Programa con la asistencia de Claude y Gemini para llegar más rápido a un prototipo o a un sitio listo para publicar, sin soltar el detalle." },
              { lead: "Encaja en equipos chicos y medianos:", text: "marcas, sitios y productos digitales, sistemas visuales con implementación front-end y obra gráfica. Para back-end o software a gran escala conviene sumar a alguien técnico." },
            ],
            close: "Todo es verificable en los proyectos de esta web y en {cv}, con experiencia en Wanderlust Videos, Quark Talent y Kurve.ar. ¿Más dudas? Pregunta aquí abajo o escribe a {mail}.",
          },
          {
            intro: "Hola de nuevo. Si buscas un perfil que una diseño, código e inteligencia artificial, Pablo es justamente eso.",
            blocks: [
              { lead: "Tres oficios en uno.", text: "Dirección de arte y marca (formado con Norberto Chaves y en dirección de arte integral, HAUS), UX/UI y front-end, y una práctica de obra gráfica que le da carácter propio a cada proyecto." },
              { lead: "La IA como acelerador.", text: "Usa Claude y Gemini a diario para investigar, escribir y programar, y tiene claro dónde decide él: en el criterio visual." },
              { lead: "Entrega algo concreto.", text: "Interfaces diseñadas en Figma y llevadas a HTML, SCSS y JavaScript, listas para publicar, y sistemas visuales que los equipos pueden aplicar sin dudas." },
              { lead: "Con honestidad sobre el alcance:", text: "no es un equipo de ingeniería. Para back-end o software de gran escala conviene sumar uno." },
            ],
            close: "Para comprobarlo, mira los proyectos de esta web o {cv} (Wanderlust Videos, Quark Talent, Kurve.ar). Si quieres saber algo más, pregunta aquí abajo o escribe a {mail}.",
          },
          {
            intro: "Por supuesto. Más que adjetivos, te dejo lo que se puede comprobar de Pablo.",
            blocks: [
              { lead: "Más de quince años de oficio.", text: "Diseña desde 2009. Es Director de Arte y Lic. en Diseño Integral por la Universidad de Mendoza, con pasos por Wanderlust Videos, Quark Talent y Kurve.ar." },
              { lead: "Criterio de marca y de producto.", text: "Diseña la identidad y la interfaz, y las lleva a código con programación asistida por IA. Claude y Gemini están entre sus herramientas diarias." },
              { lead: "Trabaja con calma y precisión:", text: "rondas cortas, jerarquía por tipografía, peso y tono, y una preferencia clara por quitar antes que agregar." },
              { lead: "Sabe dónde no es su terreno.", text: "El back-end y el software a gran escala piden un equipo técnico, y lo reconoce sin rodeos. Si tu búsqueda encaja con lo anterior, es una apuesta de bajo riesgo." },
            ],
            close: "Los proyectos de esta web y {cv} están ahí para contrastarlo; si necesitas una referencia puntual, pídela. ¿Quieres saber algo más? Pregunta aquí abajo o escribe a {mail}.",
          },
        ],
      },
      ask: {
        placeholder: 'Saber más sobre Pablo…',
        followup: '¿Algo más que quieras saber? Pregúntale a Pablo…',
        contact: 'Tu email o WhatsApp, para que pueda responderte',
        send: 'Enviar',
        sending: 'enviando…',
        reply: 'Esto es indispensable hablarlo con una persona. Pablo te responderá a la brevedad para poder continuar. Gracias por tu interés.',
        replyWa: 'Se abrió WhatsApp con tu pregunta: envíala para que le llegue a Pablo. Él te responderá a la brevedad para poder continuar. Gracias por tu interés.',
        errShort: 'error: escribe una pregunta de al menos 8 caracteres.',
        errContact: 'error: indica un email o WhatsApp válido para poder responderte.',
        errLinks: 'error: por seguridad no se aceptan enlaces en la pregunta.',
        errWait: 'error: espera unos segundos antes de enviar.',
        errLimit: 'error: alcanzaste el límite de preguntas por hoy. Escribe por WhatsApp.',
        errVerify: 'error: la verificación anti-spam sigue en curso, intenta de nuevo.',
        errFail: 'error: no se pudo enviar. Escribe directamente por WhatsApp.',
      },
      items: [
        { n: '01', title: 'Dirección de Arte & Marca', text: 'Identidades y sistemas visuales listos para producto, web y redes: concepto, criterio estratégico y lineamientos que los equipos pueden aplicar. Formación en identidad corporativa con Norberto Chaves y en dirección de arte integral (HAUS).' },
        { n: '02', title: 'UX / UI, Front-End y Programación asistida por IA', text: 'Interfaces diseñadas en Figma y llevadas a código real (HTML, SCSS y JavaScript), con IA como acelerador. Prototipos y sitios listos para publicar en menos tiempo, sin perder el detalle.' },
        { n: '03', title: 'Artwork — Obra gráfica', text: 'Ilustración, lettering, serigrafía, encuadernación artesanal y fotografía: un oficio de taller que da carácter propio a cada proyecto y lo diferencia en un mercado saturado de piezas genéricas.' },
      ],
    },
    cvSection: { eyebrow: 'Curriculum vitae', title: 'Currículum', download: 'Descargar CV en PDF', follow: 'Redes', contact: 'Contacto', languages: 'Idiomas', education: 'Educación superior', software: 'Conocimientos y software', soft: 'Soft skills', relevantExp: 'Experiencia laboral relevante', relevantSem: 'Seminarios y conocimientos relevantes', detail: 'Detalle', current: 'Desarrollo laboral actual', professional: 'Experiencia profesional', higherEd: 'Educación superior', courses: 'Seminarios y cursos', level: 'nivel', more: 'Ver más', less: 'Ver menos' },
    footer: { eyebrow: 'Contacto', title: 'Hablemos de tu próximo proyecto.', wa: 'Escribir por WhatsApp', cv: 'Ver CV' },
    fab: { wa: 'Contacto por WhatsApp', label: 'Contacto' },
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
      { key: 'cv', label: 'CV' },
      { key: 'contact', label: 'Contact' },
    ],
    switchTo: 'Español',
    hero: { cta: 'Work' },
    marquee: ['Art direction', 'Brand', 'UX / UI', 'Front-end', 'Motion', 'Concept art'],
    featured: { eyebrow: 'Selected', title: 'Featured work', all: 'View all work' },
    profile: {
      eyebrow: 'Profile',
      title: 'Strategy and craft',
      prompt: {
        aiLabel: "This portfolio was developed with the assistance of",
        greeting: "Hi, I’m Pablo’s AI assistant. To learn more about him, hit Send.",
        thinking: ["Mulling it over", "Thinking"],
        cvLabel: "his full CV",
        // Cuatro versiones del mismo mensaje, con énfasis distinto. Se elige una al azar en cada visita.
        variants: [
          {
            intro: "Happy to. Here’s what Pablo is like to work with, which is usually what matters when you’re looking for someone truly detail-oriented.",
            blocks: [
              { lead: "He cares about what others let slide.", text: "He works in short, precise rounds, builds hierarchy with typography, weight and tone before size or decoration, and prefers removing to adding. If something doesn’t add up, it goes." },
              { lead: "He’s an Art Director with a BA in Integral Design,", text: "active since 2009. He designs the brand and the interface in Figma and builds them in code himself, with AI-assisted programming: what gets designed is what ships." },
              { lead: "He uses AI with judgement.", text: "Claude and Gemini are part of his daily routine for research, writing and coding. AI speeds things up; the design decisions stay his." },
              { lead: "And he’s upfront about his limits.", text: "For back-end engineering or large-scale software, a technical team should be added, and he says so himself." },
            ],
            close: "You can check all of it: the projects on this site and {cv} back it up, with experience at Wanderlust Videos, Quark Talent and Kurve.ar. If you’d like to know more, ask below or write to {mail}.",
          },
          {
            intro: "Sure. The most useful thing I can tell you about Pablo is that he solves things end to end, and it shows in timelines and coordination.",
            blocks: [
              { lead: "One point of contact.", text: "Identity, digital product and graphic work go through the same person: fewer handoffs between studio and development, less back-and-forth and a single vision from start to finish." },
              { lead: "He designs and he builds.", text: "An Art Director with a BA in Integral Design (Universidad de Mendoza), active since 2009, who takes his own interfaces to real code with HTML, SCSS and JavaScript." },
              { lead: "He works well with AI.", text: "He programs with the assistance of Claude and Gemini to get to a prototype or a ready-to-publish site faster, without letting go of the detail." },
              { lead: "He fits small and mid-sized teams:", text: "brands, websites and digital products, visual systems with front-end implementation, and graphic work. For back-end or large-scale software, someone technical should be added." },
            ],
            close: "Everything is verifiable in the projects on this site and in {cv}, with experience at Wanderlust Videos, Quark Talent and Kurve.ar. More questions? Ask below or write to {mail}.",
          },
          {
            intro: "Hello again. If you’re looking for a profile that combines design, code and artificial intelligence, that’s exactly Pablo.",
            blocks: [
              { lead: "Three crafts in one.", text: "Art direction and brand (trained under Norberto Chaves and in integral art direction, HAUS), UX/UI and front-end, and a graphic-work practice that gives each project its own character." },
              { lead: "AI as an accelerator.", text: "He uses Claude and Gemini daily to research, write and code, and he’s clear about where he decides: visual judgement." },
              { lead: "He delivers something concrete.", text: "Interfaces designed in Figma and built in HTML, SCSS and JavaScript, ready to publish, and visual systems teams can apply without second-guessing." },
              { lead: "Honest about scope:", text: "he isn’t an engineering team. For back-end or large-scale software, add one." },
            ],
            close: "To check it, look at the projects on this site or {cv} (Wanderlust Videos, Quark Talent, Kurve.ar). If you’d like to know more, ask below or write to {mail}.",
          },
          {
            intro: "Of course. Rather than adjectives, here’s what can be verified about Pablo.",
            blocks: [
              { lead: "More than fifteen years of craft.", text: "Designing since 2009. An Art Director with a BA in Integral Design from the Universidad de Mendoza, with stints at Wanderlust Videos, Quark Talent and Kurve.ar." },
              { lead: "Brand and product judgement.", text: "He designs the identity and the interface, and builds them in code with AI-assisted programming. Claude and Gemini are among his daily tools." },
              { lead: "He works with calm and precision:", text: "short rounds, hierarchy through typography, weight and tone, and a clear preference for removing before adding." },
              { lead: "He knows what isn’t his ground.", text: "Back-end and large-scale software call for a technical team, and he acknowledges it plainly. If your search matches the above, he’s a low-risk bet." },
            ],
            close: "The projects on this site and {cv} are there to cross-check it; if you need a specific reference, ask for it. Want to know more? Ask below or write to {mail}.",
          },
        ],
      },
      ask: {
        placeholder: 'Learn more about Pablo…',
        followup: 'Anything else you’d like to know? Ask Pablo…',
        contact: 'Your email or WhatsApp, so he can reply',
        send: 'Send',
        sending: 'sending…',
        reply: 'This really needs to be discussed with a human. Pablo will reply as soon as possible so you can continue. Thank you for your interest.',
        replyWa: 'WhatsApp opened with your question: send it so it reaches Pablo. He will reply as soon as possible so you can continue. Thank you for your interest.',
        errShort: 'error: write a question of at least 8 characters.',
        errContact: 'error: enter a valid email or WhatsApp so he can reply.',
        errLinks: 'error: for security, links are not accepted in the question.',
        errWait: 'error: wait a few seconds before sending.',
        errLimit: 'error: you reached today’s question limit. Please write via WhatsApp.',
        errVerify: 'error: anti-spam check still running, please try again.',
        errFail: 'error: could not send. Please write directly via WhatsApp.',
      },
      items: [
        { n: '01', title: 'Art Direction & Brand', text: 'Identities and visual systems ready for product, web and social: concept, strategic judgement and guidelines teams can actually apply. Trained in corporate identity under Norberto Chaves and in integral art direction (HAUS).' },
        { n: '02', title: 'UX / UI, Front-End & AI-Assisted Programming', text: 'Interfaces designed in Figma and built as real code (HTML, SCSS and JavaScript), with AI as an accelerator. Prototypes and sites ready to ship in less time, without losing the detail.' },
        { n: '03', title: 'Artwork — Graphic work', text: 'Illustration, lettering, screen printing, handmade bookbinding and photography: a hands-on craft that gives each project its own character and sets it apart in a market flooded with generic work.' },
      ],
    },
    cvSection: { eyebrow: 'Curriculum vitae', title: 'Résumé', download: 'Download CV (PDF)', follow: 'Social', contact: 'Contact', languages: 'Languages', education: 'Higher education', software: 'Skills & software', soft: 'Soft skills', relevantExp: 'Relevant work experience', relevantSem: 'Relevant seminars & knowledge', detail: 'Full detail', current: 'Current work', professional: 'Professional experience', higherEd: 'Higher education', courses: 'Seminars & courses', level: 'level', more: 'Show more', less: 'Show less' },
    footer: { eyebrow: 'Contact', title: 'Let’s talk about your next project.', wa: 'Message on WhatsApp', cv: 'View CV' },
    fab: { wa: 'Contact via WhatsApp', label: 'Contact' },
    waText: 'Hi Pablo, I saw your portfolio and I’d like to talk about a project.',
    works: { title: 'Work', index: 'Index', projects: 'projects', back: '← Work', metaDesc: 'Selected branding, UX/UI and web development projects.' },
    detail: { year: 'Year', role: 'Role', client: 'Client', stack: 'Stack', repo: 'View repository', live: 'Live preview', next: 'Next project', nextCursor: 'Next', view: 'View', gallery: 'Gallery', play: 'Play', cover: '[Cover image]' },
  },
} as const;
