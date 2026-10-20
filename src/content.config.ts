import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const t = z.object({ es: z.string(), en: z.string() }); // texto bilingüe

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
  schema: z.object({
    title: z.string(),
    kind: z.enum(['design', 'code']),
    year: z.number().optional(),
    role: t,
    client: z.string().optional(),
    discipline: t,
    summary: t,
    text: t,
    badge: z.string().optional(), // etiqueta destacada, ej. "pre-ia"
    featured: z.boolean().default(false),
    order: z.number().default(99),
    cover: z.string().optional(), // tarjeta vertical 2:3 (índice y Home)
    hero: z.string().optional(),  // cabecera panorámica 21:9 de la página del proyecto
    tones: z.tuple([z.string(), z.string()]).default(['#1a1a1a', '#2b2b2b']),
    stack: z.array(z.string()).default([]),
    repo: z.string().url().optional(),
    live: z.string().url().optional(),
    video: z.object({ provider: z.enum(['vimeo', 'youtube']), id: z.string() }).optional(),
    gallery: z.array(block).default([]),
    // Carrusel de láminas (dos PNG por lámina): las imágenes salen de src/assets/works/<slug>/carrusel/NNa.png y NNb.png
    slides: z.array(z.object({ subtitle: t, alt: t.optional() })).default([]),
  }),
});

export const collections = { works };
