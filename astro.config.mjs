import { defineConfig } from 'astro/config';
import { writeFileSync } from 'node:fs';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

// El panel de edición (/keystatic) sólo existe en modo desarrollo: el sitio publicado (astro build) sigue siendo 100 % estático.
const panel = !process.argv.some((a) => ['build', 'preview', 'check', 'sync'].includes(a));

// Laboratorio (/lab/): el botón "Guardar como fondo del sitio" guarda el preset en src/data/background.json. Sólo existe en modo desarrollo
// (el hook astro:server:setup no corre en el build) y sólo acepta los números de los parámetros del patrón.
const presetSaver = {
  name: 'turing-preset',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use('/__turing-preset', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const clean = Object.fromEntries(Object.entries(data).filter(([k, v]) => /^[a-zA-Z]+$/.test(k) && typeof v === 'number' && Number.isFinite(v)));
            writeFileSync('src/data/background.json', JSON.stringify(clean, null, 2) + '\n');
            res.end('ok');
          } catch { res.statusCode = 400; res.end('bad'); }
        });
      });
    },
  },
};

// SITE y BASE se definen en el workflow de GitHub Pages (ver .github/workflows/deploy.yml).
// En local no hacen falta.
export default defineConfig({
  site: process.env.SITE || 'http://localhost:4321',
  base: process.env.BASE || '/',
  prefetch: { prefetchAll: true },
  devToolbar: { enabled: false },
  integrations: [presetSaver, ...(panel ? [react(), keystatic()] : [])],
});
