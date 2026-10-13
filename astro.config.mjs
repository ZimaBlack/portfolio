import { defineConfig } from 'astro/config';

// SITE y BASE se definen en el workflow de GitHub Pages (ver .github/workflows/deploy.yml).
// En local no hacen falta.
export default defineConfig({
  site: process.env.SITE || 'http://localhost:4321',
  base: process.env.BASE || '/',
  prefetch: { prefetchAll: true },
  devToolbar: { enabled: false },
});
