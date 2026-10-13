import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Un "bloque" de la galería de proyectos de diseño.
// Sin `src` se dibuja un marco placeholder con el tono indicado.
const block = z.object({
  kind: z.enum(['full', 'inset', 'pair']).default('full'), // full = sin márgenes
  src: z.string().optional(),
  src2: z.string().optional(),
  alt: z.string().default(''),
  caption: z.string().optional(),
  ratio: z.string().default('16 / 9'),
});

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    kind: z.enum(['design', 'code']),
    year: z.number(),
    role: z.string(),
    client: z.string().optional(),
    discipline: z.string(), // etiqueta corta para grilla
    summary: z.string(),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    cover: z.string().optional(),
    tones: z.tuple([z.string(), z.string()]).default(['#1a1a1a', '#2b2b2b']),
    // programación
    stack: z.array(z.string()).default([]),
    repo: z.string().url().optional(),
    live: z.string().url().optional(),
    // audiovisual
    video: z.object({ provider: z.enum(['vimeo', 'youtube']), id: z.string() }).optional(),
    gallery: z.array(block).default([]),
  }),
});

export const collections = { works };
