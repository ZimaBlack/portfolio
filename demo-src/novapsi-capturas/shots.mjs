// Capturas de NovaPsi (demo local) para el portfolio. Uso: node shots.mjs [es|en]
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

const LANG = process.argv[2] ?? 'es';
const base = process.env.BASE ?? 'http://localhost:3101';
const out = `out-${LANG}`; mkdirSync(out, { recursive: true });
const dict = LANG === 'en' && existsSync('dict-en.json') ? JSON.parse(readFileSync('dict-en.json', 'utf8')) : {};
if (LANG === 'en') dict['X'] = 'W';
const boxes = {}; const texts = {};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ protocolTimeout: 120000, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] });

async function nuevaPagina(rol, mobile) {
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept().catch(() => {}));
  await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { width: 1100, height: 760, deviceScaleFactor: 2 });
  if (mobile) await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
  await page.goto(`${base}/demo/entrar?rol=${rol}`, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.evaluate(() => sessionStorage.clear());
  return page;
}

// Limpia lo que no es parte del producto (aviso de demo, botón Tutorial, indicador de desarrollo de Next) y traduce si hace falta
async function preparar(page, clave) {
  await page.addStyleTag({ content: 'nextjs-portal,[data-nextjs-dev-tools-button]{display:none!important} *{caret-color:transparent!important}' });
  await page.evaluate((d) => {
    const ocultar = (el) => { if (el) el.style.display = 'none'; };
    document.querySelectorAll('body *').forEach((el) => {
      const t = (el.textContent || '').trim();
      if (el.children.length === 0 && t === 'Tutorial') ocultar(el.closest('button,a,div'));
      if (t.startsWith('Estás recorriendo un ejemplo') && el.children.length <= 2 && t.length < 160) ocultar(el.closest('div'));
      if (el.children.length === 0 && (t.startsWith('El correo todavía no está configurado') || t.startsWith('Todavía no hay un correo configurado')) && t.length < 260) ocultar(el.closest('[class*="rounded"]') || el);
      if (el.children.length <= 3 && t.startsWith('Conectá tu base de datos') && t.length < 200) ocultar(el.closest('div[class*="rounded"]') || el);
    });
    if (Object.keys(d).length) {
      const DIAS = { lunes: 'Monday', martes: 'Tuesday', 'miércoles': 'Wednesday', jueves: 'Thursday', viernes: 'Friday', 'sábado': 'Saturday', domingo: 'Sunday' };
      const DIAS_C = { lun: 'Mon', mar: 'Tue', 'mié': 'Wed', jue: 'Thu', vie: 'Fri', 'sáb': 'Sat', dom: 'Sun' };
      const MESES = { enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June', julio: 'July', agosto: 'August', septiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December' };
      const MESES_C = { ene: 'Jan', feb: 'Feb', mar: 'Mar', abr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dec' };
      const fechas = (t) => t
        .replace(/\b(lunes|martes|miércoles|jueves|viernes|sábado|domingo), (\d{1,2}) de (\w+)/gi, (_m, a, b, c) => `${DIAS[a.toLowerCase()]}, ${MESES[c.toLowerCase()] ?? c} ${b}`)
        .replace(/\b(lun|mar|mié|jue|vie|sáb|dom), (\d{1,2}) (\w{3})\b/gi, (_m, a, b, c) => `${DIAS_C[a.toLowerCase()]}, ${MESES_C[c.toLowerCase()] ?? c} ${b}`)
        .replace(/\b(\d{1,2}) de (\w{3}) de (\d{4})\b/g, (_m, a, b, c) => `${MESES_C[b.toLowerCase()] ?? b} ${a}, ${c}`)
        .replace(/^(\d{1,2}) (ene|feb|abr|may|jun|jul|ago|sep|oct|nov|dic)$/i, (_m, a, b) => `${MESES_C[b.toLowerCase()]} ${a}`)
        .replace(/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de (\d{4})$/i, (_m, a, b) => `${MESES[a.toLowerCase()]} ${b}`)
        .replace(/(\d+) turnos libres/, '$1 free slots')
        .replace(/(\d+) turnos? · (\d+) atendidos?/, (_m, a, b) => `${a} appointment${a === '1' ? '' : 's'} · ${b} attended`)
        .replace(/(\d+) turnos?\b/, (_m, a) => `${a} appointment${a === '1' ? '' : 's'}`);
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodos = []; while (w.nextNode()) nodos.push(w.currentNode);
      for (const n of nodos) {
        const k = n.nodeValue.replace(/\s+/g, ' ').trim();
        if (!k) continue;
        if (d[k] !== undefined) n.nodeValue = n.nodeValue.replace(k, d[k]);
        else { const f = fechas(k); if (f !== k) n.nodeValue = n.nodeValue.replace(k, f); }
      }
      // Los textos con servicio + fecha ("Sesión recurrente · martes, 3 de noviembre, 10:00") ya pasaron por fechas(); se completan los nombres
      document.querySelectorAll('*').forEach((el) => {
        const hijos = [...el.children]; const t = hijos.map((c) => c.textContent.trim());
        if (hijos.length === 7 && t.join('') === 'LMMJVSD') ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((x, i) => (hijos[i].textContent = x));
        if (hijos.length === 7 && t.join('') === 'LMXJVSD') ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((x, i) => (hijos[i].textContent = x));
      });
      document.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach((el) => ['placeholder', 'aria-label', 'title'].forEach((a) => { const v = el.getAttribute(a); if (v && d[v] !== undefined) el.setAttribute(a, d[v]); }));
    }
  }, dict);
  // Textos visibles de la pantalla, para armar el diccionario del inglés
  texts[clave] = await page.evaluate(() => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const s = new Set();
    while (w.nextNode()) { const n = w.currentNode; const el = n.parentElement; if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue; const r = el.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(el).display === 'none') continue; const k = n.nodeValue.replace(/\s+/g, ' ').trim(); if (k) s.add(k); }
    return [...s];
  });
}

async function tomar(page, clave, selector, { scroll = 'center', nth = 0, texto = null, extra = null } = {}) {
  if (process.env.ONLY && !process.env.ONLY.split(',').includes(clave)) return;
  let handle;
  if (texto) {
    handle = await page.evaluateHandle((t) => { const ts = [].concat(t); const els = [...document.querySelectorAll('h1,h2,h3,p,span,label,div')].filter((e) => e.children.length < 4 && ts.some((x) => (e.textContent || '').trim().startsWith(x))); const e = els[0]; return e ? (e.closest('section,[class*="rounded"]') || e) : null; }, texto);
  } else {
    await page.waitForSelector(selector, { timeout: 20000 });
    handle = (await page.$$(selector))[nth];
  }
  const el = handle.asElement();
  if (scroll === 'center') await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  else if (scroll === 'top') await page.evaluate(() => window.scrollTo(0, 0));
  else if (scroll === 'start') await el.evaluate((e) => { e.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); });
  await wait(500);
  await preparar(page, clave);
  await wait(250);
  const vp = page.viewport();
  const r = await el.evaluate((e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; });
  boxes[clave] = [r[0] / vp.width, r[1] / vp.height, r[2] / vp.width, r[3] / vp.height];
  await page.screenshot({ path: `${out}/${clave}.png` });
  console.log('✓', clave, boxes[clave].map((n) => n.toFixed(3)).join(' '));
}
const click = async (page, sel, n = 0) => { await page.waitForSelector(sel, { timeout: 20000 }); await (await page.$$(sel))[n].click(); await wait(500); };
const clickTexto = async (page, texto) => { const ok = await page.evaluate((t) => { const b = [...document.querySelectorAll('button,a')].find((x) => (x.textContent || '').trim() === t); if (b) { b.click(); return true; } return false; }, texto); await wait(700); return ok; };

// ───────── Profesional (escritorio) ─────────
if (process.env.SOLO !== 'paciente') {
  const page = await nuevaPagina('profesional', false);
  const ir = async (ruta) => { await page.goto(base + ruta, { waitUntil: 'networkidle2', timeout: 60000 }); await wait(1000); };
  await ir('/admin'); await tomar(page, 'pro-inicio', '[data-tour="admin-atencion"]', { scroll: 'none' });
  await ir('/employee/agenda'); await tomar(page, 'pro-agenda', '[data-tour="agenda-calendario"]');
  await ir('/admin/servicios'); await tomar(page, 'pro-servicios', '[data-tour="servicios-lista"]', { scroll: 'none' });
  await ir('/admin/horarios'); await tomar(page, 'pro-horarios', '[data-tour="marca-horarios"]', { scroll: 'none' });
  await tomar(page, 'pro-reglas', null, { texto: ['Los pacientes reservan solos', 'Patients book on their own'], scroll: 'start' });
  await ir('/pacientes'); await tomar(page, 'pro-pacientes', '[data-tour="pacientes-lista"]', { scroll: 'none' });
  await ir('/pacientes'); await click(page, '[data-tour="pacientes-lista"] a'); await wait(1500);
  await tomar(page, 'pro-ficha', '[data-tour="paciente-datos"]', { scroll: 'start' });
  await tomar(page, 'pro-asignar', null, { texto: ['Asignar un turno nuevo', 'Assign a new appointment'], scroll: 'start' });
  // Detalle de un turno (asistencia, reprogramar, cancelar, estado del pago)
  await ir('/pacientes'); await click(page, '[data-tour="pacientes-lista"] a'); await wait(1500);
  await (await page.$$('[data-tour="agenda-lista"] button'))[1].click(); await wait(1200);
  await tomar(page, 'pro-detalle', 'dialog[open]', { scroll: 'none' });
  await page.keyboard.press('Escape'); await wait(500);
  await ir('/admin/marca'); await tomar(page, 'pro-marca', '[data-tour="marca-identidad"]', { scroll: 'none' });
  await ir('/admin/notificaciones'); await tomar(page, 'pro-notificaciones', '[data-tour="notif-canales"]', { scroll: 'none' });
  await ir('/admin/legales'); await tomar(page, 'pro-legales', null, { texto: ['Titular', 'Holder'], scroll: 'none' });
  await ir('/admin/configuracion'); await tomar(page, 'tecnico', '[data-tour="config-estado"]', { scroll: 'none' });
  // Se cancelan los turnos de Sofia (solo en la demo, que se reinicia): así su próxima reserva es una primera consulta y pide el motivo
  for (let k = 0; k < (process.env.NOCANCEL ? 0 : 2); k++) {
    await ir('/pacientes'); await click(page, '[data-tour="pacientes-lista"] a'); await wait(1500);
    const rows = await page.$$('[data-tour="agenda-lista"] button');
    const idx = await page.$$eval('[data-tour="agenda-lista"] button', (bs) => bs.findIndex((b) => !/Cancelado/.test(b.innerText)));
    if (idx < 0) break;
    await rows[idx].click(); await wait(900);
    await clickTexto(page, 'Cancelar turno'); await wait(700);
    await clickTexto(page, 'Cancelar el turno'); await wait(1500);
  }
  await page.close();
}
// ───────── Paciente (celular) ─────────
if (process.env.SOLO !== 'profesional') {
  const page = await nuevaPagina('paciente', true);
  await page.goto(base + '/', { waitUntil: 'networkidle2' }); await wait(1200);
  await tomar(page, 'm1', '[data-tour="portada-cta"]', { scroll: 'none' });
  await page.goto(base + '/book', { waitUntil: 'networkidle2' }); await wait(900);
  await tomar(page, 'm2', '[data-tour="reserva-lista"]', { scroll: 'none' });
  await click(page, '[data-tour="reserva-lista"] button'); await click(page, '[data-tour="reserva-continuar"]'); await wait(700);
  await tomar(page, 'm3', '[data-tour="reserva-calendario"]');
  const etiquetas = await page.$$eval('[data-tour="reserva-calendario"] button[aria-label^="20"]:not([disabled])', (bs) => bs.map((b) => b.getAttribute('aria-label')));
  for (const et of etiquetas.slice(1, 12)) {
    await (await page.$(`[data-tour="reserva-calendario"] button[aria-label="${et}"]`)).click();
    let h = null; for (let i = 0; i < 25 && !h; i++) { await wait(200); h = await page.$('[data-tour="reserva-horarios"] button'); }
    if (h) break;
  }
  // Elegir un horario de la tarde (más a la vista) y esperar a que Continuar se habilite
  await page.evaluate(() => { const bs = [...document.querySelectorAll('[data-tour="reserva-horarios"] button')]; (bs.find((b) => b.textContent.trim() === '16:00') || bs[0]).click(); });
  await page.waitForFunction(() => { const c = document.querySelector('[data-tour="reserva-continuar"]'); return c && !c.disabled; }, { timeout: 15000 });
  await wait(500);
  await tomar(page, 'm4', '[data-tour="reserva-horarios"]');
  await click(page, '[data-tour="reserva-continuar"]');
  await page.waitForSelector('[data-tour="reserva-motivo"], [data-tour="reserva-datos"]', { timeout: 30000 }); await wait(600);
  if (await page.$('[data-tour="reserva-motivo"]')) {
    await tomar(page, 'm4b', '[data-tour="reserva-motivo"]', { scroll: 'top' });
    const ta = await page.$('[data-tour="reserva-motivo"] textarea'); if (ta) { await ta.type('Me siento con mucha ansiedad hace unos meses y quiero empezar a trabajarlo.'); await wait(300); }
    await click(page, '[data-tour="reserva-continuar"]'); await wait(800);
  }
  await tomar(page, 'm5', '[data-tour="reserva-datos"]', { scroll: 'top' });
  await page.close();
}

writeFileSync(`boxes-${LANG}.json`, JSON.stringify(boxes, null, 1));
writeFileSync(`texts-${LANG}.json`, JSON.stringify(texts, null, 1));
await browser.close();
