import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { paths } from '../lib/i18n';

export const GET: APIRoute = async ({ site }) => {
  const works = await getCollection('works', (w) => !w.data.draft);
  const rutas = (['es', 'en'] as const).flatMap((l) => [paths.home(l), paths.works(l), paths.cv(l), ...works.map((w) => paths.work(l, w.id))]);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rutas.map((r) => `  <url><loc>${new URL(r, site).href}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
