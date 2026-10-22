import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const t = z.object({ es: z.string(), en: z.string() }); // texto bilingüe

// El panel de edición (Keystatic) escribe campos vacíos como '' o null en vez de omitirlos.
// Se limpian antes de validar, para que "vacío" signifique lo mismo que "no existe".
const clean = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(clean).filter((x) => x !== undefined);
  if (v && typeof v === 'object') {
    const o = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)]).filter(([, x]) => x !== undefined));
    return Object.keys(o).length ? o : undefined;
  }
  return v === '' || v === null || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v;
};
const tolerant = <T extends z.ZodTypeAny>(schema: T) => z.preprocess((v) => clean(v) ?? {}, schema);

// Bloque de la galería (proyectos de diseño). Sin `src` se dibuja un marco placeholder.
const block = z.object({
  kind: z.enum(['full', 'inset', 'pair']).default('full'), // full = sin márgenes
  src: z.string().optional(),
  src2: z.string().optional(),
  alt: z.string().default(''),
  caption: t.optional(),
  ratio: z.string().default('16 / 9'),
});

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: tolerant(z.object({
    title: z.string(),
    kind: z.enum(['design', 'code']),
    year: z.number().optional(),
    role: t,
    client: z.string().optional(),
    discipline: t,
    summary: t,
    text: t.partial().optional(), // texto largo del proyecto (opcional)
    badge: z.string().optional(), // etiqueta destacada, ej. "pre-ia"
    draft: z.boolean().default(false), // true = oculto: no aparece en el índice, la Home ni tiene página
    featured: z.boolean().default(false),
    homeOrder: z.number().optional(), // posición en la Home (si es destacado); por defecto, `order`
    order: z.number().default(99),
    cover: z.string().optional(), // tarjeta vertical 2:3 (índice y Home)
    logo: z.string().optional(),  // logotipo centrado en la portada animada (/works/<slug>/logo.svg)
    mark: z.string().optional(),  // isotipo / símbolo, preparado para animar junto al logotipo
    widget: z.enum(['palette']).optional(), // widget propio de la página del proyecto (fijo abajo a la derecha)
    heroAnimation: z.enum(['assemble']).optional(), // animación de entrada de la portada (assemble: las piezas del logotipo llegan de los lados y se arman)
    heroLights: z.enum(['soft', 'halftone']).default('soft'), // luces de la portada: degradado suave o trama de semitono
    reactiveColors: z.array(z.string()).default([]), // colores del logotipo que siguen al widget de paleta (1.º = elegido, 2.º = automático)
    paletteColors: z.array(z.string()).default([]), // colores de la marca para el widget de paleta
    headerMarquee: z.boolean().default(false), // cabecera con marquesina de logos (b) sin color, en lugar de la imagen
    hero: z.string().optional(),  // cabecera panorámica 21:9 de la página del proyecto
    tones: z.array(z.string()).default(['#1a1a1a', '#2b2b2b']).transform((a) => [a[0] ?? '#1a1a1a', a[1] ?? a[0] ?? '#2b2b2b'] as [string, string]),
    stack: z.array(z.string()).default([]),
    repo: z.string().optional(),
    live: z.string().optional(),
    video: z.object({ provider: z.enum(['vimeo', 'youtube']).default('vimeo'), id: z.string().optional() }).optional(),
    gallery: z.array(block).default([]),
    // Carrusel de láminas (dos PNG por lámina): las imágenes salen de src/assets/works/<slug>/carrusel/NNa.png y NNb.png
    slides: z.array(z.object({
      subtitle: t,
      alt: t.optional(),
      file: z.number().optional(),   // número de los archivos NNa/NNb que usa esta lámina (por defecto, el orden de la lista)
      intro: z.boolean().optional(), // lámina 00: logo ZMA BLK + título del proyecto, sin archivos
      // Ambiente de color propio: dos colores hex (derecha arriba / abajo) y un factor de intensidad (1 = normal)
      ambient: z.object({ colors: z.array(z.string()).optional(), boost: z.number().optional() }).optional(),
      project: z.string().optional(), // id del proyecto al que lleva el botón "Ver desarrollo completo"
      swap: z.boolean().optional(), // intercambia las posiciones de los dos logos (a pasa a la columna angosta, b a la ancha)
      // Multiplicador del tamaño base del logo (1 = tamaño estándar). a = izquierdo (8 col), b = derecho (4 col)
      size: z.object({ a: z.number().optional(), b: z.number().optional() }).optional(),
      // Desplazamiento vertical del logo en píxeles (negativo = hacia arriba)
      dy: z.object({ a: z.number().optional(), b: z.number().optional() }).optional(),
    })).default([]),
  })),
});

export const collections = { works };
