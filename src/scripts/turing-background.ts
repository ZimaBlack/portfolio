// Fondo del sitio: un patrón de Turing (ver turing-core.ts) en un canvas fijo a pantalla completa, con dos modos que se alternan según la página:
//  · "cursor" (Home): replica la animación del laboratorio. Cuando el cursor se queda quieto, desde ese punto crece el patrón; al moverlo se
//    disuelve y deja rastros; un clic siembra otro foco. No actúa sobre el footer ni sobre enlaces y botones al hacer clic.
//  · "ambient" (resto del sitio): un patrón que nace de varios focos al azar, crece unos segundos y se asienta (la simulación se detiene).
// El preset sale de src/data/background.json (se guarda desde el laboratorio, /lab/).
import { DEFAULTS, TuringSim, type TuringParams } from './turing-core';
import { initTuringDiffusion, type TuringControls } from './turing-diffusion';

const GROW_MS = 22000;  // modo ambient: tiempo que crece y se acomoda al empezar
const MAX_STEPS = 10;   // modo ambient: tope de pasos por cuadro (debe ser liviano)

export type BackgroundMode = 'cursor' | 'ambient';
export interface TuringBackground { setMode: (m: BackgroundMode) => void }

const INTERACTIVE = 'a, button, input, textarea, select, [data-no-seed]';

export function initTuringBackground(canvas: HTMLCanvasElement, preset: Partial<TuringParams>): TuringBackground {
  const P: TuringParams = { ...DEFAULTS, ...preset };
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  canvas.style.filter = `blur(${P.blur}px)`;

  // ── Modo cursor: la animación del laboratorio, escuchando a toda la ventana y sin actuar sobre el footer
  const cursor: TuringControls | null = initTuringDiffusion(canvas, null, {
    target: window,
    params: preset,
    ignore: (e) => {
      const t = e.target as Element | null;
      return !!t?.closest?.('footer') || (e.type === 'pointerdown' && !!t?.closest?.(INTERACTIVE));
    },
  });
  cursor?.enable(false);

  // ── Modo ambient: varios focos al azar que crecen y se asientan
  const sim = new TuringSim(canvas, P);
  let mode: BackgroundMode | null = null, active = false, raf = 0, runUntil = 0, nucleiUntil = 0, resizeTimer = 0;
  const loop = (now: number) => {
    const n = Math.min(P.steps, MAX_STEPS);
    for (let k = 0; k < n; k++) sim.step(now < nucleiUntil && k === 0 ? P.nuclei : 0);
    sim.render(1);
    raf = active && now < runUntil ? requestAnimationFrame(loop) : 0; // asentado: se detiene y la imagen queda
  };
  const begin = () => {
    sim.resize(); sim.reset();
    const count = Math.min(40, Math.max(6, Math.round((sim.gw * sim.gh) / 1800)));
    for (let i = 0; i < count; i++) sim.seed(Math.random() * sim.w, Math.random() * sim.h, 4);
    if (calm) { for (let k = 0; k < 900; k++) sim.step(k < 300 ? P.nuclei : 0); sim.render(1); return; } // sin animación: se calcula de una vez
    nucleiUntil = performance.now() + 4000;
    runUntil = performance.now() + GROW_MS;
    if (!raf) raf = requestAnimationFrame(loop);
  };
  new ResizeObserver(() => {
    if (!active) return;
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => { cancelAnimationFrame(raf); raf = 0; begin(); }, 250);
  }).observe(canvas);

  return {
    setMode(m) {
      if (m === mode) return;
      mode = m;
      active = m === 'ambient';
      if (active) { cursor?.enable(false); begin(); }
      else { cancelAnimationFrame(raf); raf = 0; sim.clear(); cursor?.enable(true); }
    },
  };
}
