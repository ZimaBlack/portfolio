// Transcripción del CV de Pablo Ponce García (Español) + traducción al inglés.
// Estructura calcada del PDF: página 1 (resumen en dos columnas) y página 2 (detalle).
import type { L10n } from '../lib/i18n';

const L = (es: string, en: string = es): L10n => ({ es, en });

export type Item = { p: L10n; t: L10n; o?: L10n; strong?: boolean };
const I = (p: L10n, t: L10n, o?: L10n, strong = false): Item => ({ p, t, o, strong });

export const cv = {
  name: 'Pablo Ponce García',
  headline: [
    L('Director de Arte · Lic. en Diseño Integral', 'Art Director · BA in Integral Design'),
    L('Web Designer · UX/UI Designer · Front End'),
  ],

  // ── Página 1 · columna izquierda ──────────────────────────────
  languages: [
    { n: L('Inglés', 'English'), l: L('Intermedio', 'Intermediate') },
    { n: L('Francés', 'French'), l: L('Principiante', 'Beginner') },
  ],
  education: [
    { t: L('Licenciatura en Diseño', 'BA in Design'), note: L('Tesis: Modelo Franquicia Corp.', 'Thesis: Corporate Franchise Model'), o: L('Universidad de Mendoza') },
    { t: L('Diseñador Gráfico', 'Graphic Designer'), o: L('Universidad de Mendoza') },
  ],
  // Nivel sobre 6, como los círculos del PDF
  software: [
    [['Photoshop', 6], ['Illustrator', 6], ['InDesign', 3]],
    [['Figma', 5], ['HTML & SCSS', 5], ['Bootstrap', 5], ['JavaScript', 2], ['WordPress', 4]],
    [['LLM & AI Gen.', 3]],
  ] as [string, number][][],
  softSkills: [
    L('Perfil estratégico–creativo', 'Strategic–creative profile'),
    L('Autonomía y adaptabilidad', 'Autonomy and adaptability'),
    L('Comunicación constructiva', 'Constructive communication'),
    L('Articulación de equipos', 'Team articulation'),
  ],

  // ── Página 1 · columna derecha ────────────────────────────────
  relevantExperience: [
    I(L('2025 — hoy', '2025 — present'), L('Diseñador Freelancer', 'Freelance Designer'), L('ZMA.BLK Design'), true),
    I(L('2009 — 2024'), L('Diseñador Freelancer', 'Freelance Designer'), L('Blackroom Design'), true),
    I(L('2023 — 2025'), L('Diseñador Visual General · Front End · UX/UI', 'General Visual Designer · Front End · UX/UI'), L('Wanderlust Videos'), true),
    I(L('2023 — 2024'), L('Diseñador Visual General · Front End · UX/UI', 'General Visual Designer · Front End · UX/UI'), L('Quark Talent'), true),
    I(L('2021 — 2022'), L('Diseñador Gráfico · WordPress Theme Dev', 'Graphic Designer · WordPress Theme Dev'), L('Kurve.ar'), true),
    I(L('2018'), L('Diseñador. Preprensa. Operador de CNC y Offset digital.', 'Designer. Prepress. CNC and digital offset operator.'), L('OSIRIX')),
  ],
  relevantSeminars: [
    I(L('2024'), L('Dirección de Arte Integral', 'Integral Art Direction'), L('HAUS'), true),
    I(L('2013 — hoy', '2013 — present'), L('Front End Developer', 'Front End Developer'), L('Autodidacta', 'Self-taught'), true),
    I(L('2018'), L('Curso Avanzado de Fotografía', 'Advanced Photography Course'), L('Marino Maurizi')),
    I(L('2016'), L('Curso de Originales Pre-prensa', 'Prepress Originals Course'), L('TAC FAD UNCuyo')),
    I(L('2016'), L('Diseño de Experiencias Digitales UX', 'Digital Experience Design (UX)'), L('TAC FAD UNCuyo')),
    I(L('2016'), L('Fotografía de Objetos de Arte y Diseño', 'Photography of Art and Design Objects'), L('TAC FAD UNCuyo')),
    I(L('2010'), L('Identidad Corporativa, Marca País', 'Corporate Identity, Country Brand'), L('Norberto Chaves')),
  ],

  ai: {
    title: L('LLM e IA Generativa', 'LLM & Generative AI'),
    items: [
      L('Uso diario de Claude y Gemini como apoyo en investigación, redacción, programación y dirección de arte.', 'Daily use of Claude and Gemini to support research, writing, coding and art direction.'),
      L('Desarrollo de sitios e interfaces asistido por IA: prompting, revisión crítica y criterio sobre el código generado.', 'AI-assisted development of websites and interfaces: prompting, critical review and judgement over generated code.'),
      L('IA integrada al proceso con trazabilidad: los proyectos previos a su uso se identifican con la etiqueta “pre-ia”.', 'AI integrated into the process with traceability: projects predating its use are tagged “pre-ia”.'),
    ],
  },

  // ── Página 2 · detalle ────────────────────────────────────────
  current: [
    I(L('2025 — hoy', '2025 — present'), L('Labor de Diseñador Freelancer', 'Freelance Designer'), L('ZMA.BLK Design'), true),
    I(L('2016 — hoy', '2016 — present'), L('Diseñador en Emprendimiento Editorial', 'Designer at editorial venture'), L('Attico — Cuadernos Artesanales', 'Attico — Handmade Notebooks')),
  ],
  professional: [
    I(L('2009 — 2024'), L('Labor de Diseñador Freelancer', 'Freelance Designer'), L('Blackroom Design'), true),
    I(L('2023 — 2025'), L('Diseñador Visual General · Front End · UX/UI', 'General Visual Designer · Front End · UX/UI'), L('Wanderlust Videos'), true),
    I(L('2024'), L('Concept Artist & Diseño de Personaje · Branding', 'Concept Artist & Character Design · Branding'), L('Unidad Expandida — corto Fulldom', 'Unidad Expandida — short film Fulldom'), true),
    I(L('2023'), L('Diseñador Visual General · UX/UI · Diseñador Gráfico · Web Designer', 'General Visual Designer · UX/UI · Graphic Designer · Web Designer'), L('Quark Talent'), true),
    I(L('2021 — 2022'), L('Diseñador Web · Desarrollos en WordPress · Diseñador Gráfico', 'Web Designer · WordPress Development · Graphic Designer'), L('Kurve.ar'), true),
    I(L('2020 — 2022'), L('Concept Artist · UX/UI Design', 'Concept Artist · UX/UI Design'), L('Zaedius (desarrollo de videojuegos)', 'Zaedius (video game development)')),
    I(L('2019 — 2020'), L('Diseñador Gráfico y Especialista en sistema CNC', 'Graphic Designer and CNC Systems Specialist'), L('Acrilia')),
    I(L('2018'), L('Diseñador en Estudio Gráfico. Especialista en sistema CNC', 'Designer at graphic studio. CNC Systems Specialist'), L('OSIRIX')),
    I(L('2016 — 2019'), L('WordPress Developer · UI Designer', 'WordPress Developer · UI Designer'), L('Concomitancia Digital')),
    I(L('2016'), L('Diseñador y Estampador', 'Designer and Print Operator'), L('Sublime: taller de sublimación — Linares Mauricio', 'Sublime: sublimation workshop — Linares Mauricio')),
    I(L('2013'), L('Clases de Diseño y Computación para niños con capacidades diferentes', 'Design and computing classes for children with different abilities'), L('Fundación “de tu Mano”')),
    I(L('2011 — 2012'), L('Dictado de clases “Taller de Adobe Photoshop”', 'Teacher of “Adobe Photoshop Workshop”'), L('Graciela Paffumi')),
    I(L('2011 — 2012'), L('Diseñador Junior en empresa de publicidad', 'Junior Designer at advertising agency'), L('gp Publicidad — Diego Lopez')),
    I(L('2009 — 2010'), L('Pasante en Revista “Concepto” · Pasante en Revista “DCerk”', 'Intern at “Concepto” magazine · Intern at “DCerk” magazine'), L('Raul Caba')),
    I(L('2005 — 2006'), L('Empleado en Estudio Gráfico', 'Employee at graphic studio'), L('Quality Grafic — Sergio Isasti')),
  ],
  higherEducation: [
    { p: L('2010 — 2011'), t: L('Licenciatura en Diseño Integral — Especialización Gráfica', 'BA in Integral Design — Graphic Specialization'),
      lines: [L('Tesis: Modelo de Franquicia Corporativa', 'Thesis: Corporate Franchise Model'), L('Especialización Teatral: Escenografía · Vestuario Teatral', 'Theatre Specialization: Set Design · Theatre Costume')],
      o: L('Facultad de Arquitectura, Urbanismo y Diseño. Universidad de Mendoza.', 'Faculty of Architecture, Urban Planning and Design. Universidad de Mendoza.') },
    { p: L('2007 — 2010'), t: L('Diseñador Gráfico', 'Graphic Designer'), lines: [],
      o: L('Facultad de Arquitectura, Urbanismo y Diseño. Universidad de Mendoza.', 'Faculty of Architecture, Urban Planning and Design. Universidad de Mendoza.') },
  ],
  courses: [
    I(L('2024'), L('Dirección de Arte Integral', 'Integral Art Direction'), L('HAUS'), true),
    I(L('2023'), L('Curso en Edición de Videos con DaVinci Resolve', 'Video Editing with DaVinci Resolve'), L('Blackmagic')),
    I(L('2022'), L('Codificación Creativa con JavaScript', 'Creative Coding with JavaScript'), L('Domestika')),
    I(L('2021'), L('Introducción a Blender', 'Introduction to Blender'), L('Domestika')),
    I(L('2020'), L('Ilustración: Introducción a la Profesión', 'Illustration: Introduction to the Profession')),
    I(L('2019'), L('Curso de Desarrollo en JavaScript', 'JavaScript Development Course'), L('Crehana')),
    I(L('2018'), L('Curso Avanzado de Fotografía', 'Advanced Photography Course'), L('FotoEscuela Mendoza: Marino Maurizi')),
    I(L('2017'), L('Curso “Cómo Vender por Internet”', '“How to Sell Online” Course'), L('Bisiesto design')),
    I(L('2016'), L('Diseño de Gráficos en Movimiento', 'Motion Graphics Design'), L('TAC FAD UNCuyo')),
    I(L('2016'), L('Curso de Originales Pre-prensa', 'Prepress Originals Course'), L('TAC FAD UNCuyo')),
    I(L('2016'), L('Diseño de Experiencias Digitales UX', 'Digital Experience Design (UX)'), L('TAC FAD UNCuyo')),
    I(L('2016'), L('Workshop Fotografía de Objetos de Arte y Diseño', 'Workshop: Photography of Art and Design Objects')),
    I(L('2015'), L('Curso Básico de Fotografía', 'Basic Photography Course'), L('FotoEscuela Mendoza: Marino Maurizi')),
    I(L('2015'), L('Curso de Diseño Web Integral (actualización y especialización)', 'Integral Web Design Course (update and specialization)'), L('Bisiesto design')),
    I(L('2015'), L('Curso de Encuadernación Artesanal y Gráfica Experimental', 'Handmade Bookbinding and Experimental Graphics Course'), L('Guadalupe Castro')),
    I(L('2015'), L('Curso de Caligrafía Gótica', 'Gothic Calligraphy Course'), L('Gerardo Ruiz Babsia')),
    I(L('2015'), L('Seminario de Serigrafía', 'Screen-Printing Seminar'), L('IAD — Instituto Argentino de Diseño')),
    I(L('2014'), L('Curso y Seminario “Cómo Presupuestar Diseño”', '“How to Price Design” Course and Seminar'), L('Jorge Piazza')),
    I(L('2014'), L('Curso de Lettering', 'Lettering Course'), L('Nicolas Rojas Leon')),
    I(L('2013'), L('Curso de Diseño Web Integral', 'Integral Web Design Course'), L('Bisiesto design')),
    I(L('2010'), L('Identidad Corporativa, Marca País', 'Corporate Identity, Country Brand'), L('Norberto Chaves')),
    I(L('2006'), L('Introducción a Corel Draw', 'Introduction to Corel Draw'), L('Centro Regional de Educación Tecnológica')),
  ],
};
