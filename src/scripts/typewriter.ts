// Efecto de tipeo rápido. Recorre los nodos de texto en orden, para no romper enlaces ni estructura.
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function makeCaret() {
  const c = document.createElement('span');
  c.className = 'term__caret';
  c.setAttribute('aria-hidden', 'true');
  return c;
}

function textNodes(root: Element) {
  const out: Text[] = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) if ((n as Text).data.trim() || (n as Text).data.length) out.push(n as Text);
  return out;
}

/** Vacía el contenedor y devuelve una función que lo "tipea". La altura se reserva para evitar saltos. */
export function prepareTyping(root: HTMLElement, caret: HTMLElement) {
  const nodes = textNodes(root);
  const full = nodes.map((n) => n.data);
  root.style.minHeight = `${root.offsetHeight}px`;
  nodes.forEach((n) => (n.data = ''));
  root.append(caret);

  return (cps = 1100) =>
    new Promise<void>((resolve) => {
      const total = full.reduce((a, s) => a + s.length, 0);
      const t0 = performance.now();
      let lastIdx = -1;
      const tick = (now: number) => {
        let left = Math.min(total, Math.floor(((now - t0) / 1000) * cps));
        let idx = 0;
        for (; idx < nodes.length; idx++) {
          const len = full[idx].length;
          if (left >= len) { nodes[idx].data = full[idx]; left -= len; }
          else { nodes[idx].data = full[idx].slice(0, left); break; }
        }
        const cur = nodes[Math.min(idx, nodes.length - 1)];
        if (idx !== lastIdx && cur?.parentElement) { cur.after(caret); lastIdx = idx; }
        if (idx < nodes.length) requestAnimationFrame(tick);
        else { root.style.minHeight = ''; resolve(); }
      };
      requestAnimationFrame(tick);
    });
}

/** Tipea un texto simple dentro de un elemento. */
export function typeText(el: HTMLElement, text: string, caret: HTMLElement, cps = 1100) {
  if (reduce()) { el.textContent = text; return Promise.resolve(); }
  const node = document.createTextNode('');
  el.append(node);
  el.append(caret);
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const n = Math.min(text.length, Math.floor(((now - t0) / 1000) * cps));
      node.data = text.slice(0, n);
      if (n < text.length) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}
