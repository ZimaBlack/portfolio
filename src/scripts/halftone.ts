// Luces de semitono (halftone) para la portada de un proyecto.
// Dibuja en un <canvas> las dos luces (colores --ga / --gb y posiciones --ax --ay --bx --by de la portada) como una
// trama de puntos a 45°: cuanto más intensa la luz, más grande el punto; donde se cruzan, el punto toma la mezcla.
// Cuando el widget de color cambia esas variables, las luces se desplazan y cambian de color con una transición.

type Rgb = [number, number, number];
type State = { ga: Rgb; gb: Rgb; ax: number; ay: number; bx: number; by: number };

const CELL = 10;          // distancia entre puntos (px de CSS)
const CELL_SMALL = 8;     // en pantallas chicas
const ANGLE = Math.PI / 4;
const TWEEN_MS = 1100;

const smooth = (t: number) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** "rgb(…)" o "#rrggbb" → [r, g, b] */
const parseColor = (v: string, fallback: Rgb): Rgb => {
  v = v.trim();
  let m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  m = v.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i);
  return m ? [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])] : fallback;
};
const pct = (v: string, fallback: number) => { const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; };

export function initHalftone(hero: HTMLElement) {
  const canvas = hero.querySelector<HTMLCanvasElement>('[data-pj-ht]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  hero.dataset.ready = '1';

  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const read = (): State => {
    const cs = getComputedStyle(hero);
    return {
      ga: parseColor(cs.getPropertyValue('--ga'), [106, 27, 38]),
      gb: parseColor(cs.getPropertyValue('--gb'), [36, 13, 18]),
      ax: pct(cs.getPropertyValue('--ax'), 24), ay: pct(cs.getPropertyValue('--ay'), 34),
      bx: pct(cs.getPropertyValue('--bx'), 76), by: pct(cs.getPropertyValue('--by'), 72),
    };
  };

  let cur = read();
  let from = cur, to = cur, t0 = 0, raf = 0;
  let w = 0, h = 0, dpr = 1;

  const draw = (s: State) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cell = w < 700 ? CELL_SMALL : CELL;
    const rA = { x: 0.446 * w, y: 0.504 * h }, rB = { x: 0.518 * w, y: 0.446 * h }; // mismos radios visibles que las luces en degradado
    const ax = (s.ax / 100) * w, ay = (s.ay / 100) * h, bx = (s.bx / 100) * w, by = (s.by / 100) * h;
    const cos = Math.cos(ANGLE), sin = Math.sin(ANGLE);
    const span = Math.ceil(Math.hypot(w, h) / cell / 2) + 1;
    const cx = w / 2, cy = h / 2;
    for (let i = -span; i <= span; i++) {
      for (let j = -span; j <= span; j++) {
        const px = cx + (i * cos - j * sin) * cell, py = cy + (i * sin + j * cos) * cell;
        if (px < -cell || px > w + cell || py < -cell || py > h + cell) continue;
        const wa = smooth(1 - Math.hypot((px - ax) / rA.x, (py - ay) / rA.y));
        const wb = smooth(1 - Math.hypot((px - bx) / rB.x, (py - by) / rB.y));
        const sum = wa + wb;
        if (sum < 0.02) continue;
        const r = cell * 0.66 * Math.sqrt(Math.min(1, sum * 1.05));
        if (r < 0.4) continue;
        const k = wb / sum;
        ctx.fillStyle = `rgb(${Math.round(lerp(s.ga[0], s.gb[0], k))} ${Math.round(lerp(s.ga[1], s.gb[1], k))} ${Math.round(lerp(s.ga[2], s.gb[2], k))})`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const mix = (a: State, b: State, t: number): State => ({
    ga: a.ga.map((v, i) => lerp(v, b.ga[i], t)) as Rgb, gb: a.gb.map((v, i) => lerp(v, b.gb[i], t)) as Rgb,
    ax: lerp(a.ax, b.ax, t), ay: lerp(a.ay, b.ay, t), bx: lerp(a.bx, b.bx, t), by: lerp(a.by, b.by, t),
  });
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / TWEEN_MS);
    cur = mix(from, to, ease(t));
    draw(cur);
    raf = t < 1 ? requestAnimationFrame(step) : 0;
  };
  const go = () => {
    from = cur; to = read();
    cancelAnimationFrame(raf);
    if (calm) { cur = to; draw(cur); return; }
    t0 = performance.now();
    raf = requestAnimationFrame(step);
  };

  const resize = () => {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = Math.round(r.width); h = Math.round(r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    draw(cur);
  };
  new ResizeObserver(resize).observe(hero);
  new MutationObserver(go).observe(hero, { attributes: true, attributeFilter: ['style'] }); // el widget escribe las variables en el style
  resize();
}
