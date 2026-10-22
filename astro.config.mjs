import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

// El panel de edición (/keystatic) sólo existe en modo desarrollo: el sitio publicado (astro build) sigue siendo 100 % estático.
const panel = !process.argv.some((a) => ['build', 'preview', 'check', 'sync'].includes(a));

// SITE y BASE se definen en el workflow de GitHub Pages (ver .github/workflows/deploy.yml).
// En local no hacen falta.
export default defineConfig({
  site: process.env.SITE || 'http://localhost:4321',
  base: process.env.BASE || '/',
  prefetch: { prefetchAll: true },
  devToolbar: { enabled: false },
  integrations: panel ? [react(), keystatic()] : [],
});
