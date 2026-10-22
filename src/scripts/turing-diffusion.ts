// Laboratorio de morfogénesis (/lab/): cuando el cursor se queda quieto sobre el fondo negro, desde ese punto crece un patrón de Turing
// (ver turing-core.ts), en grises, con ruido y desenfoque. Con "mantener" el patrón persiste y cada clic siembra otro foco de crecimiento.
// `initTuringDiffusion` devuelve un controlador: sus `params` se pueden cambiar en vivo (panel de la página).
import { DEFAULTS, TuringSim, smooth, type TuringParams } from './turing-core';

export { DEFAULTS, PRESETS, type TuringParams } from './turing-core';
export interface TuringControls { params: TuringParams; restart: (x?: number, y?: number) => void; clear: () => void; resize: () => void; apply: () => void }

interface Seed { x: number; y: number; t: number } // x, y en celdas; t = instante de la siembra

export function initTuringDiffusion(canvas: HTMLCanvasElement, panel?: HTMLElement | null): TuringControls | null {
  if (!canvas.getContext('2d') || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const P: TuringParams = { ...DEFAULTS };
  const sim = new TuringSim(canvas, P);
  let seeds: Seed[] = [];
  let raf = 0, startedAt = 0, disturbedAt = 0, idleTimer = 0, inside = false, pointer = { x: 0, y: 0 };

  const apply = () => { canvas.style.filter = `blur(${P.blur}px) contrast(1.1)`; canvas.parentElement?.style.setProperty('--grain', String(P.grain)); };
  const resize = () => { cancelAnimationFrame(raf); raf = 0; seeds = []; sim.resize(); };
  new ResizeObserver(resize).observe(canvas);
  apply();

  const clear = () => { cancelAnimationFrame(raf); raf = 0; seeds = []; sim.clear(); };
  /** Alcance de una semilla en el instante `now` (en celdas): arranca justo por fuera de ella y se expande. */
  const reach = (s: Seed, now: number) => 9 + (P.radius / P.cell - 9) * (1 - Math.exp(-(now - s.t) / P.grow));

  const addSeed = (x: number, y: number) => {
    sim.seed(x, y);
    seeds.push({ x: x / P.cell, y: y / P.cell, t: performance.now() });
    if (seeds.length > 14) seeds.shift();
  };
  const start = (x = pointer.x, y = pointer.y) => {
    sim.reset(); seeds = []; pointer = { x, y };
    addSeed(x, y);
    startedAt = performance.now(); disturbedAt = 0;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  };

  const loop = (now: number) => {
    const age = Math.max(0, now - startedAt);
    // Los núcleos al azar sólo caen cerca de las semillas, y sólo en los primeros segundos de cada una
    const allow = (x: number, y: number) => seeds.some((s) => now - s.t < 3200 && Math.hypot(x - s.x, y - s.y) < reach(s, now));
    const live = seeds.some((s) => now - s.t < 3200);
    for (let k = 0; k < P.steps; k++) sim.step(k === 0 && live ? P.nuclei : 0, allow);
    let alpha = 1;
    if (!P.pinned) {
      alpha = age > P.hold ? Math.max(0, 1 - (age - P.hold) / P.fade) : 1;
      if (disturbedAt) alpha = Math.min(alpha, Math.max(0, 1 - (now - disturbedAt) / 900));
    }
    // El patrón se ve alrededor de cada semilla, con un borde que se desvanece (sin anillo duro)
    sim.render(alpha, (x, y) => {
      let m = 0;
      for (const s of seeds) {
        const rg = reach(s, now);
        const e = 1 - smooth((Math.hypot(x - s.x, y - s.y) - rg * 0.62) / (rg * 0.38));
        if (e > m) m = e;
      }
      return m;
    });
    if (alpha <= 0) { clear(); if (inside) armIdle(); return; }
    raf = requestAnimationFrame(loop);
  };

  const armIdle = () => { clearTimeout(idleTimer); idleTimer = window.setTimeout(() => { if (inside && !raf) start(); }, P.idle); };
  const disturb = () => { if (raf && !disturbedAt && !P.pinned) disturbedAt = performance.now(); };

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const nx = e.clientX - r.left, ny = e.clientY - r.top;
    const moved = Math.hypot(nx - pointer.x, ny - pointer.y) > 6;
    pointer = { x: nx, y: ny }; inside = true;
    if (moved) { disturb(); armIdle(); }
  });
  canvas.addEventListener('pointerleave', (e) => {
    inside = false; clearTimeout(idleTimer);
    if ((e.relatedTarget as HTMLElement | null)?.closest?.('[data-lab-panel]')) return; // pasar al panel de controles no disuelve el patrón
    disturb();
  });
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; inside = true;
    // Con un patrón en curso, el clic siembra otro foco (el patrón persiste); si no, empieza uno nuevo
    if (raf) { disturbedAt = 0; addSeed(pointer.x, pointer.y); startedAt = Math.max(startedAt, performance.now() - P.hold + 4000); }
    else armIdle();
  });
  panel?.addEventListener('pointerenter', () => { disturbedAt = 0; });

  return { params: P, apply, resize, clear, restart: (x = sim.w / 2, y = sim.h / 2) => start(x, y) };
}
