// Morfogénesis que responde al cursor (laboratorio /lab/ y Home): cuando el cursor se queda quieto, desde ese punto crece un patrón de
// Turing (ver turing-core.ts), en grises, con ruido y desenfoque. Mientras el cursor se mueve, el patrón se disuelve y deja "rastros":
// pequeños focos a lo largo del camino que crecen un poco y se apagan. Un clic siembra otro foco; con "mantener" el patrón persiste.
// `initTuringDiffusion` devuelve un controlador: sus `params` se pueden cambiar en vivo (panel del laboratorio).
import { DEFAULTS, TuringSim, smooth, type TuringParams } from './turing-core';

export { DEFAULTS, PRESETS, type TuringParams } from './turing-core';

export interface TuringControls {
  params: TuringParams;
  restart: (x?: number, y?: number) => void;
  clear: () => void;
  resize: () => void;
  apply: () => void;
  enable: (on: boolean) => void; // apaga/enciende la reacción al cursor (apagado: no dibuja ni escucha)
  stillFade: (on: boolean) => void; // permite o no el brillo + apagado cuando el cursor lleva mucho tiempo quieto
}
export interface TuringOptions {
  target?: Window | HTMLElement;       // dónde se escucha el cursor (por defecto, el propio canvas)
  ignore?: (e: Event) => boolean;      // eventos que no cuentan (por ejemplo, los que ocurren sobre el footer)
  params?: Partial<TuringParams>;      // valores iniciales (por defecto, DEFAULTS)
  stillFade?: boolean;                 // brillo + apagado por cursor quieto permitidos desde el comienzo (por defecto, sí)
}

interface Seed { x: number; y: number; t: number; trail: boolean } // x, y en celdas; t = instante de la siembra

const TRAIL_CELLS = 12;  // alcance de un rastro (en celdas)
const NUCLEI_MS = 3200;  // los núcleos al azar sólo caen los primeros segundos de cada foco
const FLASH_MS = 650;     // duración del destello de luminosidad antes de apagarse
const STILL_FADE_MS = 1800; // y lo que tarda en desvanecerse

export function initTuringDiffusion(canvas: HTMLCanvasElement, panel?: HTMLElement | null, opts: TuringOptions = {}): TuringControls | null {
  if (!canvas.getContext('2d') || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const P: TuringParams = { ...DEFAULTS, ...opts.params };
  const sim = new TuringSim(canvas, P);
  const target: Window | HTMLElement = opts.target ?? canvas;
  const ignored = (e: Event) => !!opts.ignore?.(e);
  let seeds: Seed[] = [];
  let on = true, stillOn = opts.stillFade ?? true, stillStage = 0 /* 0 nada, 1 brillando, 2 apagándose */, retired = false, fadeOutMs = 900, lastMoveAt = performance.now(), raf = 0, startedAt = 0, disturbedAt = 0, idleTimer = 0, inside = false, trailAcc = 0;
  let pointer = { x: 0, y: 0 };

  const baseFilter = () => `blur(${P.blur}px) contrast(1.1)`;
  const apply = () => { canvas.style.filter = baseFilter(); canvas.parentElement?.style.setProperty('--grain', String(P.grain)); };
  const clear = () => { cancelAnimationFrame(raf); raf = 0; seeds = []; sim.clear(); };
  const resize = () => { cancelAnimationFrame(raf); raf = 0; seeds = []; sim.resize(); };
  new ResizeObserver(() => { if (on) resize(); }).observe(canvas);
  apply();

  /** Alcance de un foco en el instante `now` (en celdas): arranca justo por fuera de la semilla y se expande. */
  const reach = (s: Seed, now: number) => s.trail
    ? 5 + (TRAIL_CELLS - 5) * (1 - Math.exp(-(now - s.t) / 280))
    : 9 + (P.radius / P.cell - 9) * (1 - Math.exp(-(now - s.t) / P.grow));
  const trailAlpha = (s: Seed, now: number) => 1 - smooth((now - s.t - P.trailLife * 0.2) / (P.trailLife * 0.8));

  const addSeed = (x: number, y: number, trail = false) => {
    sim.seed(x, y, trail ? 2 : 5);
    seeds.push({ x: x / P.cell, y: y / P.cell, t: performance.now(), trail });
    if (seeds.length > 60) seeds.shift();
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  /** Empieza un foco principal en (x, y): sin restos de patrones anteriores a su alrededor. */
  const start = (x = pointer.x, y = pointer.y) => {
    pointer = { x, y };
    sim.clearDisc(x, y, P.radius + 40);
    seeds = seeds.filter((s) => s.trail);
    addSeed(x, y);
    startedAt = performance.now(); disturbedAt = 0;
    kick();
  };

  const loop = (now: number) => {
    if (!on) { raf = 0; return; }
    const main = seeds.filter((s) => !s.trail);
    // Opacidad del foco principal: dura `hold`, se disuelve en `fade`, y se apaga rápido si el cursor se mueve
    let alpha = 1;
    if (main.length && !P.pinned) {
      const age = Math.max(0, now - startedAt);
      alpha = age > P.hold ? Math.max(0, 1 - (age - P.hold) / P.fade) : 1;
      if (disturbedAt) alpha = Math.min(alpha, Math.max(0, 1 - (now - disturbedAt) / fadeOutMs));
    }
    if (alpha <= 0) seeds = seeds.filter((s) => s.trail); // el principal se disolvió del todo
    seeds = seeds.filter((s) => !s.trail || now - s.t < P.trailLife);
    if (!seeds.length) { sim.clear(); raf = 0; stillStage = 0; fadeOutMs = 900; apply(); if (inside && !retired) armIdle(); return; }

    // Los núcleos al azar sólo caen cerca de focos recientes
    const fresh = seeds.filter((s) => !s.trail && now - s.t < NUCLEI_MS);
    const allow = (x: number, y: number) => fresh.some((s) => Math.hypot(x - s.x, y - s.y) < reach(s, now));
    for (let k = 0; k < P.steps; k++) sim.step(k === 0 && fresh.length ? P.nuclei : 0, allow);
    // Se ve alrededor de cada foco, con un borde que se desvanece (sin anillo duro)
    sim.render(1, (x, y) => {
      let m = 0;
      for (const s of seeds) {
        const rg = reach(s, now);
        const e = (1 - smooth((Math.hypot(x - s.x, y - s.y) - rg * 0.62) / (rg * 0.38))) * (s.trail ? trailAlpha(s, now) : alpha);
        if (e > m) m = e;
      }
      return m;
    });
    raf = requestAnimationFrame(loop);
  };

  const armIdle = () => { clearTimeout(idleTimer); idleTimer = window.setTimeout(() => { if (on && inside && !retired && !seeds.some((s) => !s.trail)) start(); }, P.idle); };
  const disturb = () => { if (!disturbedAt && !P.pinned && seeds.some((s) => !s.trail)) disturbedAt = performance.now(); };
  const rel = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  const onMove = (ev: Event) => {
    const e = ev as PointerEvent;
    if (!on || ignored(e)) { inside = false; clearTimeout(idleTimer); disturb(); return; }
    const p = rel(e);
    const d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
    inside = true;
    if (d > 6) {
      lastMoveAt = performance.now();
      if (retired || stillStage) { retired = false; if (stillStage === 1) apply(); stillStage = 0; } // el cursor volvió: el patrón puede renacer y se cancela el brillo
      disturb();
      trailAcc += d;
      // Rastros: pequeños focos a lo largo del camino del cursor (si están activados)
      if (P.trails && trailAcc >= P.trailEvery) { trailAcc = 0; addSeed(p.x, p.y, true); kick(); }
      armIdle();
    }
    pointer = p;
  };
  const onLeave = (ev: Event) => {
    const e = ev as PointerEvent;
    if (target === window && e.type === 'pointerout' && e.relatedTarget) return; // sólo cuando el cursor sale de la ventana
    inside = false; clearTimeout(idleTimer);
    if ((e.relatedTarget as HTMLElement | null)?.closest?.('[data-lab-panel]')) return; // pasar al panel de controles no disuelve el patrón
    disturb();
  };
  const onDown = (ev: Event) => {
    const e = ev as PointerEvent;
    if (!on || ignored(e)) return;
    pointer = rel(e); inside = true; lastMoveAt = performance.now();
    // Con un patrón en curso, el clic siembra otro foco (el patrón persiste); si no, empieza uno nuevo
    if (seeds.some((s) => !s.trail)) { disturbedAt = 0; addSeed(pointer.x, pointer.y); startedAt = Math.max(startedAt, performance.now() - P.hold + 4000); kick(); }
    else armIdle();
  };
  target.addEventListener('pointermove', onMove);
  target.addEventListener(target === window ? 'pointerout' : 'pointerleave', onLeave);
  target.addEventListener('pointerdown', onDown);
  panel?.addEventListener('pointerenter', () => { disturbedAt = 0; });

  /** Cursor muy quieto: el patrón sube de luminosidad un instante, como al brillar, y enseguida se apaga (y no vuelve hasta que el cursor se mueva). */
  const startStillFade = () => {
    stillStage = 1; retired = true;
    canvas.style.transition = 'filter .3s ease';
    canvas.style.filter = `${baseFilter()} brightness(${P.flashBright})`;
    setTimeout(() => {
      if (stillStage !== 1) return; // el cursor se movió durante el brillo
      stillStage = 2; fadeOutMs = STILL_FADE_MS; disturbedAt = performance.now();
    }, FLASH_MS);
  };
  setInterval(() => {
    if (!on || !stillOn || stillStage || P.stillFade <= 0 || document.hidden) return;
    if (seeds.some((s) => !s.trail) && !disturbedAt && performance.now() - lastMoveAt > P.stillFade) startStillFade();
  }, 300);

  return {
    params: P, apply, resize, clear,
    stillFade: (v) => { stillOn = v; lastMoveAt = performance.now(); },
    restart: (x = sim.w / 2, y = sim.h / 2) => { if (on) start(x, y); },
    enable: (v) => { if (v === on) return; on = v; if (on) { sim.resize(); inside = false; } else { clearTimeout(idleTimer); clear(); } },
  };
}
