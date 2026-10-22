// Fondo del sitio: un patrón de Turing (ver turing-core.ts) que cubre toda la pantalla. Nace de varios focos al azar, crece unos segundos
// hasta asentarse y entonces la simulación se detiene (queda dibujado, sin gastar nada). Cada clic en el hero principal siembra otro foco
// que vuelve a hacer crecer el patrón alrededor. El preset sale de src/data/background.json (se guarda desde el laboratorio, /lab/).
import { DEFAULTS, TuringSim, type TuringParams } from './turing-core';

const GROW_MS = 22000;  // tiempo que crece y se acomoda al empezar
const CLICK_MS = 9000;  // tiempo extra que sigue creciendo tras un clic
const MAX_STEPS = 10;   // tope de pasos por cuadro (el fondo debe ser liviano)

export interface TuringBackground { seed: (x: number, y: number) => void }

export function initTuringBackground(canvas: HTMLCanvasElement, preset: Partial<TuringParams>): TuringBackground {
  const P: TuringParams = { ...DEFAULTS, ...preset };
  const sim = new TuringSim(canvas, P);
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, runUntil = 0, nucleiUntil = 0, resizeTimer = 0;

  canvas.style.filter = `blur(${P.blur}px)`;

  const loop = (now: number) => {
    const n = Math.min(P.steps, MAX_STEPS);
    for (let k = 0; k < n; k++) sim.step(now < nucleiUntil && k === 0 ? P.nuclei : 0);
    sim.render(1);
    raf = now < runUntil ? requestAnimationFrame(loop) : 0; // asentado: se detiene y la imagen queda
  };
  const run = (ms: number) => {
    const now = performance.now();
    runUntil = Math.max(runUntil, now + ms);
    if (!raf) raf = requestAnimationFrame(loop);
  };

  /** Arranca desde cero: varios focos repartidos por toda la pantalla, más núcleos al azar los primeros segundos. */
  const begin = () => {
    sim.reset();
    const count = Math.min(40, Math.max(6, Math.round((sim.gw * sim.gh) / 1800)));
    for (let i = 0; i < count; i++) sim.seed(Math.random() * sim.w, Math.random() * sim.h, 4);
    if (calm) { for (let k = 0; k < 900; k++) sim.step(k < 300 ? P.nuclei : 0); sim.render(1); return; } // sin animación: se calcula de una vez
    nucleiUntil = performance.now() + 4000;
    run(GROW_MS);
  };

  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => { cancelAnimationFrame(raf); raf = 0; sim.resize(); begin(); }, 250);
  }).observe(canvas);
  begin();

  return {
    seed: (x, y) => { if (calm) return; sim.seed(x, y); run(CLICK_MS); },
  };
}
