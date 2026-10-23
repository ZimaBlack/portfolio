// Panel de edición (Keystatic, modo local): textos, imágenes y proyectos del portfolio.
// Se abre con `npm run panel` → http://localhost:4321/keystatic. Guarda en los mismos archivos que lee el sitio.
import { config, collection, singleton, fields } from '@keystatic/core';

const bi = (label: string, opts: { multiline?: boolean; description?: string } = {}) =>
  fields.object(
    {
      es: fields.text({ label: 'Español', multiline: opts.multiline }),
      en: fields.text({ label: 'English', multiline: opts.multiline }),
    },
    { label, description: opts.description },
  );

const image = (label: string, description?: string) =>
  fields.image({ label, description, directory: 'public/works', publicPath: '/works/' });

export default config({
  storage: { kind: 'local' },
  ui: { brand: { name: 'ZMA BLK Design' } },

  collections: {
    works: collection({
      label: 'Proyectos',
      slugField: 'title',
      path: 'src/content/works/*',
      format: { contentField: 'notes' },
      entryLayout: 'form',
      columns: ['kind', 'featured', 'order'],
      schema: {
        title: fields.slug({ name: { label: 'Título del proyecto', description: 'Aparece como título y arma la dirección web (/trabajos/titulo).' } }),
        kind: fields.select({ label: 'Tipo', description: 'Diseño muestra una galería de imágenes; Código muestra stack y enlaces.', options: [{ label: 'Diseño', value: 'design' }, { label: 'Código', value: 'code' }], defaultValue: 'design' }),
        badge: fields.text({ label: 'Etiqueta destacada', description: 'Opcional. Ej.: pre-ia' }),
        discipline: bi('Disciplina', { description: 'Ej.: Branding / Editorial' }),
        role: bi('Rol'),
        summary: bi('Resumen corto', { multiline: true, description: 'Se ve debajo del título.' }),
        text: bi('Texto largo (opcional)', { multiline: true }),
        year: fields.integer({ label: 'Año' }),
        client: fields.text({ label: 'Cliente' }),

        cover: image('Portada vertical (2:3)', 'La tarjeta del índice y de la Home. PNG o JPG, unos 1200 × 1800 px.'),
        hero: image('Cabecera panorámica (21:9)', 'Arriba en la página del proyecto. Unos 2560 px de ancho; dejá 10 % de aire arriba y abajo.'),
        logo: image('Logotipo de la portada animada', 'SVG o PNG con fondo transparente. Queda centrado en la portada de la página del proyecto.'),
        mark: image('Isotipo / nombre (opcional)', 'Elemento secundario de la portada. Con la animación "Ensamblar" es el nombre, que aparece al terminar de armarse la marca.'),
        widget: fields.select({ label: 'Widget de la página', description: 'Un extra fijo abajo a la derecha.', options: [{ label: 'Ninguno', value: '' }, { label: 'Paleta de color', value: 'palette' }], defaultValue: '' }),
        paletteColors: fields.array(fields.text({ label: 'Color (hex)' }), { label: 'Colores de la marca (widget de paleta)', description: 'Los dos primeros son los colores con los que arrancan los dos manejadores (principal y secundario). Ej. #AE0407.', itemLabel: (p) => p.value }),
        ornament: image('Ornamento de la portada (opcional)', 'SVG de un solo color: el lado derecho. Se espeja para el izquierdo y los dos flanquean el logotipo con la animación "Ensamblar".'),
        heroImage: fields.text({ label: 'Foto de fondo de la portada (ruta base)', description: 'Ej.: /works/global-citizen/bg — con los archivos bg-1280.webp, bg-1920.webp, bg-2560.webp y bg.jpg en public.' }),
        heroPattern: fields.select({ label: 'Trama de la portada', description: 'Ondas fluidas de diseño plano con los colores de fondo del proyecto.', options: [{ label: 'Ninguna', value: '' }, { label: 'Ondas fluidas', value: 'waves' }], defaultValue: '' }),
        heroAnimation: fields.select({ label: 'Animación de la portada', description: 'Ensamblar: el logotipo debe tener 3 trazos (ala izquierda, ala derecha y centro).', options: [{ label: 'Ninguna', value: '' }, { label: 'Ensamblar piezas', value: 'assemble' }, { label: 'Cristal que se abre', value: 'glass' }], defaultValue: '' }),
        heroLights: fields.select({ label: 'Luces de la portada', description: 'Degradado suave, trama de puntos (semitono) o fluidos líquidos.', options: [{ label: 'Degradado suave', value: 'soft' }, { label: 'Semitono', value: 'halftone' }, { label: 'Líquido realista', value: 'liquid' }], defaultValue: 'soft' }),
        reactiveColors: fields.array(fields.text({ label: 'Color del logotipo (hex)' }), { label: 'Colores del logotipo que cambian con la paleta', description: 'El primero sigue al color elegido y el segundo al automático. Deben ser colores que existan en el SVG del logotipo.', itemLabel: (p) => p.value }),
        manual: fields.checkbox({ label: 'Sección manual de marca', description: 'Muestra el manual de marca de Global Citizen (texto, mapa conceptual y mockups).' }),
        headerMarquee: fields.checkbox({ label: 'Cabecera con marquesina de logos', description: 'Usa los logos del carrusel en lugar de la imagen panorámica.' }),
        tones: fields.array(fields.text({ label: 'Color (hex)' }), { label: 'Colores de fondo (2)', description: 'Se ven mientras no hay imagen. Dos colores hex, ej. #1a1a1a.', itemLabel: (p) => p.value }),

        draft: fields.checkbox({ label: 'Oculto (borrador)', description: 'Tildado: el proyecto no se ve en el sitio. Destildalo cuando esté completo.' }),
        featured: fields.checkbox({ label: 'Destacado en la Home' }),
        homeOrder: fields.integer({ label: 'Posición en la Home', description: 'Solo si es destacado. 1 = primero.' }),
        order: fields.integer({ label: 'Posición en la lista de trabajos', description: 'Menor número = primero.', defaultValue: 99 }),

        stack: fields.array(fields.text({ label: 'Tecnología' }), { label: 'Stack (proyectos de código)', itemLabel: (p) => p.value }),
        repo: fields.text({ label: 'Enlace al repositorio' }),
        live: fields.text({ label: 'Enlace al sitio en vivo' }),
        video: fields.object(
          {
            provider: fields.select({ label: 'Plataforma', options: [{ label: 'Vimeo', value: 'vimeo' }, { label: 'YouTube', value: 'youtube' }], defaultValue: 'vimeo' }),
            id: fields.text({ label: 'ID del video', description: 'La parte final del enlace, ej. 123456789. Vacío = sin video.' }),
          },
          { label: 'Video' },
        ),

        gallery: fields.array(
          fields.object({
            kind: fields.select({ label: 'Formato', options: [{ label: 'Ancho completo', value: 'full' }, { label: 'Con márgenes', value: 'inset' }, { label: 'Dos imágenes', value: 'pair' }], defaultValue: 'full' }),
            src: image('Imagen'),
            src2: image('Segunda imagen (solo "Dos imágenes")'),
            ratio: fields.text({ label: 'Proporción', description: 'Ej.: 16 / 9, 21 / 9, 4 / 5', defaultValue: '16 / 9' }),
            alt: fields.text({ label: 'Descripción para accesibilidad' }),
            caption: bi('Epígrafe'),
          }),
          { label: 'Galería', description: 'Los bloques se ven en este orden. Sin imagen se muestra un marco con las medidas recomendadas.', itemLabel: (p) => `${p.fields.kind.value} · ${p.fields.caption.fields.es.value || 'sin epígrafe'}` },
        ),

        slides: fields.array(
          fields.object({
            subtitle: bi('Subtítulo'),
            alt: bi('Descripción para accesibilidad'),
            file: fields.integer({ label: 'Archivos', description: 'Número de los archivos NNa / NNb de la carpeta carrusel (vacío = por orden).' }),
            intro: fields.checkbox({ label: 'Lámina 00 (logo + título, sin archivos)' }),
            project: fields.text({ label: 'Botón "Ver desarrollo completo"', description: 'Dirección del proyecto al que lleva (ej. delta-9). Vacío = sin botón.' }),
            swap: fields.checkbox({ label: 'Intercambiar logos' }),
            ambient: fields.object(
              {
                colors: fields.array(fields.text({ label: 'Color (hex)' }), { label: 'Colores del ambiente (2)', itemLabel: (p) => p.value }),
                boost: fields.number({ label: 'Intensidad (1 = normal)' }),
              },
              { label: 'Ambiente de color propio' },
            ),
            size: fields.object({ a: fields.number({ label: 'Logo izquierdo' }), b: fields.number({ label: 'Logo derecho' }) }, { label: 'Tamaño (1 = estándar)' }),
            dy: fields.object({ a: fields.number({ label: 'Logo izquierdo' }), b: fields.number({ label: 'Logo derecho' }) }, { label: 'Desplazamiento vertical (px)' }),
          }),
          { label: 'Láminas del carrusel (LogoFolio)', description: 'Las imágenes de cada lámina se colocan en src/assets/works/<proyecto>/carrusel/.', itemLabel: (p) => p.fields.subtitle.fields.es.value || (p.fields.intro.value ? 'Lámina 00' : 'Lámina') },
        ),

        notes: fields.markdoc({ label: 'Notas internas', description: 'No se muestran en el sitio.', extension: 'md' }),
      },
    }),
  },

  singletons: {
    editable: singleton({
      label: 'Textos y datos del sitio',
      path: 'src/data/editable',
      format: { data: 'json' },
      schema: {
        ajustes: fields.object(
          {
            name: fields.text({ label: 'Tu nombre' }),
            studio: fields.text({ label: 'Estudio / marca' }),
            location: fields.text({ label: 'Ubicación' }),
            email: fields.text({ label: 'Correo' }),
            whatsapp: fields.text({ label: 'WhatsApp', description: 'Formato internacional sin "+": 54 9 + característica + número.' }),
            cvEs: fields.file({ label: 'CV en PDF (español)', directory: 'public', publicPath: '/' }),
            cvEn: fields.file({ label: 'CV en PDF (inglés)', directory: 'public', publicPath: '/' }),
            social: fields.array(
              fields.object({
                icon: fields.select({ label: 'Icono', options: [{ label: 'LinkedIn', value: 'linkedin' }, { label: 'Behance', value: 'behance' }, { label: 'Substack', value: 'substack' }, { label: 'GitHub', value: 'github' }], defaultValue: 'linkedin' }),
                label: fields.text({ label: 'Nombre' }),
                href: fields.text({ label: 'Enlace' }),
              }),
              { label: 'Redes', itemLabel: (p) => p.fields.label.value },
            ),
          },
          { label: 'Datos generales' },
        ),
        es: pageTexts('Español'),
        en: pageTexts('English'),
      },
    }),
  },
});

function pageTexts(label: string) {
  return fields.object(
    {
      role: fields.text({ label: 'Cargo (debajo de tu nombre)' }),
      tagline: fields.text({ label: 'Frase del sitio', description: 'Se usa en la descripción para buscadores.' }),
      heroCta: fields.text({ label: 'Botón de la portada' }),
      marquee: fields.array(fields.text({ label: 'Texto' }), { label: 'Palabras de la cinta', itemLabel: (p) => p.value }),
      featured: fields.object({ eyebrow: fields.text({ label: 'Etiqueta' }), title: fields.text({ label: 'Título' }), all: fields.text({ label: 'Botón "ver todos"' }) }, { label: 'Trabajos destacados (Home)' }),
      profile: fields.object(
        {
          eyebrow: fields.text({ label: 'Etiqueta' }),
          title: fields.text({ label: 'Título' }),
          items: fields.array(
            fields.object({ n: fields.text({ label: 'Número' }), title: fields.text({ label: 'Título' }), text: fields.text({ label: 'Texto', multiline: true }) }),
            { label: 'Los tres puntos del perfil', itemLabel: (p) => p.fields.title.value },
          ),
        },
        { label: 'Perfil' },
      ),
      footer: fields.object({ eyebrow: fields.text({ label: 'Etiqueta' }), quote: fields.text({ label: 'Cita', multiline: true }), author: fields.text({ label: 'Autor de la cita' }), wa: fields.text({ label: 'Botón de WhatsApp' }), cv: fields.text({ label: 'Botón del CV' }) }, { label: 'Pie de página (contacto)' }),
      waText: fields.text({ label: 'Mensaje que abre WhatsApp', multiline: true }),
    },
    { label },
  );
}
