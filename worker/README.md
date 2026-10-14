# Relay del formulario "Saber más" → WhatsApp

El portfolio es estático (GitHub Pages) y no puede guardar claves. Este Worker de Cloudflare
(gratis) recibe la pregunta, filtra spam y se la manda a tu WhatsApp.

## Puesta en marcha
1. `cd worker && npx wrangler deploy` (te pide login en Cloudflare).
2. Editá `ALLOWED_ORIGINS` en `wrangler.toml` con la URL de tu sitio (o dominio propio).
3. Cargá los secretos:
   ```
   npx wrangler secret put WA_PHONE         # tu número, ej. +5492614712481
   npx wrangler secret put CALLMEBOT_KEY    # apikey de CallMeBot (ver abajo)
   npx wrangler secret put TURNSTILE_SECRET # opcional, anti-bot
   ```
4. **CallMeBot**: desde tu WhatsApp, agregá el contacto +34 644 51 95 23 y enviale
   `I allow callmebot to send me messages`. Te responde con tu apikey.
5. En GitHub → Settings → Secrets and variables → Actions → **Variables**:
   - `QUESTION_ENDPOINT` = URL del Worker (ej. `https://portfolio-question-relay.TU.workers.dev`)
   - `TURNSTILE_SITE_KEY` = clave pública de Turnstile (opcional)
6. Hacé un push: el sitio se reconstruye con el formulario conectado.

## Anti-spam (todas las capas)
- Solo responde a los orígenes de `ALLOWED_ORIGINS`.
- Campo trampa (honeypot) y tiempo mínimo antes de enviar.
- Largo mínimo/máximo, sin enlaces, contacto válido (email o teléfono).
- Cloudflare Turnstile (opcional, recomendado) y límite de 3 preguntas por hora por IP (con KV).
- En el navegador además hay un enfriamiento de 60 s y máximo 3 preguntas por día.

Sin `QUESTION_ENDPOINT`, el formulario sigue funcionando: abre WhatsApp con la pregunta escrita.
