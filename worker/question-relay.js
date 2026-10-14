// Cloudflare Worker: recibe la pregunta del portfolio y se la manda a Pablo por WhatsApp.
// Capas anti-spam: origen permitido, honeypot, tiempo mínimo, largo, enlaces, Turnstile y límite por IP.

const json = (data, status, cors) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors } });

const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST' || !allowed.includes(origin)) return json({ ok: false }, 403, cors);

    let body;
    try { body = await req.json(); } catch { return json({ ok: false }, 400, cors); }

    // 1) Honeypot: los bots lo completan. Se responde "ok" para no darles pistas.
    if (body.website) return json({ ok: true }, 200, cors);

    const question = clean(body.question, 500);
    const contact = clean(body.contact, 120);
    const lang = body.lang === 'en' ? 'en' : 'es';

    // 2) Validaciones básicas
    if (question.length < 8) return json({ ok: false, error: 'short' }, 422, cors);
    if (/https?:\/\/|www\./i.test(question)) return json({ ok: false, error: 'links' }, 422, cors);
    const mail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
    const tel = /^[+\d\s()\-.]+$/.test(contact) && contact.replace(/\D/g, '').length >= 8;
    if (!mail && !tel) return json({ ok: false, error: 'contact' }, 422, cors);
    if (Number(body.t) < 2500) return json({ ok: false, error: 'fast' }, 429, cors);

    // 3) Cloudflare Turnstile (si hay secreto configurado)
    const ip = req.headers.get('CF-Connecting-IP') || '';
    if (env.TURNSTILE_SECRET) {
      const form = new FormData();
      form.append('secret', env.TURNSTILE_SECRET);
      form.append('response', String(body.token || ''));
      form.append('remoteip', ip);
      const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form }).then((r) => r.json()).catch(() => ({}));
      if (!v.success) return json({ ok: false, error: 'verify' }, 403, cors);
    }

    // 4) Límite por IP: 3 preguntas por hora (requiere un KV namespace enlazado como RATE)
    if (env.RATE && ip) {
      const key = `ip:${ip}`;
      const n = Number((await env.RATE.get(key)) || 0);
      if (n >= 3) return json({ ok: false, error: 'limit' }, 429, cors);
      await env.RATE.put(key, String(n + 1), { expirationTtl: 3600 });
    }

    // 5) Envío a WhatsApp. CallMeBot es gratis y manda mensajes a TU propio número.
    //    (Alternativas: WhatsApp Cloud API, Twilio o un webhook de n8n.)
    const text = `📩 Pregunta desde el portfolio (${lang})\n\n${question}\n\nContacto: ${contact}`;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(env.WA_PHONE)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(env.CALLMEBOT_KEY)}`;
    const r = await fetch(url).catch(() => null);
    if (!r || !r.ok) return json({ ok: false, error: 'send' }, 502, cors);
    return json({ ok: true }, 200, cors);
  },
};
