// Efecto de tipeo con cadencia natural: cada letra se ve aparecer, con pausas en la puntuación
// y al cambiar de párrafo. Recorre los nodos de texto en orden para no romper enlaces ni estructura.
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function makeCaret() {
  const c = document.createElement('span');
  c.className = 'term__caret';
  c.setAttribute('aria-hidden', 'true');
  return c;
}

/** Control para saltar la animación (p. ej. con un clic). */
export type TypeControl = { skip: boolean };

const PAUSE: Record<string, number> = { '.': 100, '!': 100, '?': 100, ':': 70, ';': 70, ',': 40 };

/** Instante (en ms) en que aparece cada carácter, acumulado. */
function schedule(texts: string[], cps: number) {
  const base = 1000 / cps;
  const times: number[] = [];
  let t = 0;
  texts.forEach((str, i) => {
    if (i > 0 && str.length) t += 130; // pausa al empezar un nuevo bloque
    for (const ch of str) {
      t += base * (0.8 + Math.random() * 0.45); // leve irregularidad, como una persona
      times.push(t);
      t += PAUSE[ch] ?? 0;
    }
  });
  return times;
}

function textNodes(root: Element) {
  const out: Text[] = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) if ((n as Text).data.length) out.push(n as Text);
  return out;
}

/**
 * Vacía el contenedor y devuelve una función que lo "tipea".
 * Cada bloque (párrafo) permanece oculto hasta que el tipeo llega a él, así el espaciado entre
 * párrafos es siempre el mismo y el contenedor crece de a poco, a medida que se escribe.
 */
export function prepareTyping(root: HTMLElement, caret: HTMLElement) {
  const nodes = textNodes(root);
  const full = nodes.map((n) => n.data);
  const blocks = Array.from(root.children).filter((el) => el !== caret) as HTMLElement[];
  const blockOf = nodes.map((n) => Math.max(0, blocks.findIndex((b) => b.contains(n))));
  nodes.forEach((n) => (n.data = ''));
  blocks.forEach((b, i) => { if (i > 0) b.style.display = 'none'; });
  blocks[0]?.append(caret);
  const reveal = (upTo: number) => blocks.forEach((b, i) => { if (i <= upTo) b.style.display = ''; });

  return (cps = 220, ctl: TypeControl = { skip: false }) =>
    new Promise<void>((resolve) => {
      const times = schedule(full, cps);
      const t0 = performance.now();
      let lastIdx = -1;
      let shown = 0;
      const paint = (count: number) => {
        let left = count;
        let idx = 0;
        for (; idx < nodes.length; idx++) {
          const len = full[idx].length;
          if (left >= len) { nodes[idx].data = full[idx]; left -= len; }
          else { nodes[idx].data = full[idx].slice(0, left); break; }
        }
        const ci = Math.min(idx, nodes.length - 1);
        const cur = nodes[ci];
        if (idx !== lastIdx && cur?.parentElement) { reveal(blockOf[ci]); cur.after(caret); lastIdx = idx; }
        return idx >= nodes.length;
      };
      const tick = (now: number) => {
        if (ctl.skip) { paint(times.length); reveal(blocks.length); return resolve(); }
        const elapsed = now - t0;
        while (shown < times.length && times[shown] <= elapsed) shown++;
        if (paint(shown)) { reveal(blocks.length); resolve(); }
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
}

/** Tipea un texto simple dentro de un elemento. */
export function typeText(el: HTMLElement, text: string, caret: HTMLElement, cps = 90) {
  if (reduce()) { el.textContent = text; return Promise.resolve(); }
  const node = document.createTextNode('');
  el.append(node);
  el.append(caret);
  const times = schedule([text], cps);
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    let shown = 0;
    const tick = (now: number) => {
      while (shown < times.length && times[shown] <= now - t0) shown++;
      node.data = text.slice(0, shown);
      if (shown < text.length) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}
