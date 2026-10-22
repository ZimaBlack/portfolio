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
  glitch: (on: boolean) => void; // permite o no el glitch de canales alfa cuando el cursor lleva mucho tiempo quieto
}
export interface TuringOptions {
  target?: Window | HTMLElement;       // dónde se escucha el cursor (por defecto, el propio canvas)
  ignore?: (e: Event) => boolean;      // eventos que no cuentan (por ejemplo, los que ocurren sobre el footer)
  params?: Partial<TuringParams>;      // valores iniciales (por defecto, DEFAULTS)
  glitch?: boolean;                    // glitch permitido desde el comienzo (por defecto, sí)
}

interface Seed { x: number; y: number; t: number; trail: boolean } // x, y en celdas; t = instante de la siembra

const TRAIL_CELLS = 12;  // alcance de un rastro (en celdas)
const NUCLEI_MS = 3200;  // los núcleos al azar sólo caen los primeros segundos de cada foco
const GLITCH_MS = 1100;  // duración de un glitch
const GLITCH_ID = 'turing-glitch';

/** Filtro SVG del glitch (se crea una sola vez): bandas horizontales desplazadas, copias fantasma del canal alfa y alfa posterizado. */
function glitchFilter() {
  let svg = document.getElementById(`${GLITCH_ID}-svg`);
  if (!svg) {
    document.body.insertAdjacentHTML('beforeend', `<svg id="${GLITCH_ID}-svg" width="0" height="0" aria-hidden="true" style="position:absolute"><filter id="${GLITCH_ID}" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0 0.05" numOctaves="1" seed="1" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="bands"/>
      <feOffset in="bands" dx="0" dy="0" result="ghostA"/><feColorMatrix in="ghostA" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .55 0" result="ghostA2"/>
      <feOffset in="bands" dx="0" dy="0" result="ghostB"/><feColorMatrix in="ghostB" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .45 0" result="ghostB2"/>
      <feComponentTransfer in="bands" result="poster"><feFuncA type="discrete" tableValues="0 .3 0 .7 1 .45 1"/></feComponentTransfer>
      <feMerge><feMergeNode in="ghostA2"/><feMergeNode in="ghostB2"/><feMergeNode in="poster"/></feMerge>
    </filter></svg>`);
    svg = document.getElementById(`${GLITCH_ID}-svg`)!;
  }
  const q = (sel: string) => svg!.querySelector(sel)!;
  return { turb: q('feTurbulence'), disp: q('feDisplacementMap'), a: svg.querySelectorAll('feOffset')[0], b: svg.querySelectorAll('feOffset')[1], table: q('feFuncA') };
}

export function initTuringDiffusion(canvas: HTMLCanvasElement, panel?: HTMLElement | null, opts: TuringOptions = {}): TuringControls | null {
  if (!canvas.getContext('2d') || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const P: TuringParams = { ...DEFAULTS, ...opts.params };
  const sim = new TuringSim(canvas, P);
  const target: Window | HTMLElement = opts.target ?? canvas;
  const ignored = (e: Event) => !!opts.ignore?.(e);
  let seeds: Seed[] = [];
  let on = true, glitchOn = opts.glitch ?? true, glitching = false, lastMoveAt = performance.now(), raf = 0, startedAt = 0, disturbedAt = 0, idleTimer = 0, inside = false, trailAcc = 0;
  let pointer = { x: 0, y: 0 };

  const apply = () => { canvas.style.filter = `blur(${P.blur}px) contrast(1.1)`; canvas.parentElement?.style.setProperty('--grain', String(P.grain)); };
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
      if (disturbedAt) alpha = Math.min(alpha, Math.max(0, 1 - (now - disturbedAt) / 900));
    }
    if (alpha <= 0) seeds = seeds.filter((s) => s.trail); // el principal se disolvió del todo
    seeds = seeds.filter((s) => !s.trail || now - s.t < P.trailLife);
    if (!seeds.length) { sim.clear(); raf = 0; if (inside) armIdle(); return; }

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

  const armIdle = () => { clearTimeout(idleTimer); idleTimer = window.setTimeout(() => { if (on && inside && !seeds.some((s) => !s.trail)) start(); }, P.idle); };
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

  /** Glitch: durante un instante las bandas se desplazan, el canal alfa se duplica en fantasmas y se posteriza, a golpes (como una señal que falla). */
  const burst = () => {
    glitching = true;
    const f = glitchFilter(), base = canvas.style.filter.replace(/\s*url\(#[^)]*\)/, ''), t0 = performance.now();
    const tick = () => {
      const elapsed = performance.now() - t0;
      if (elapsed > GLITCH_MS) { canvas.style.filter = base; glitching = false; lastMoveAt = performance.now(); return; }
      const hit = Math.random() < 0.7; // a veces la señal "vuelve" un instante
      const r = (a: number, b: number) => a + Math.random() * (b - a);
      f.turb.setAttribute('seed', String(Math.floor(r(1, 999))));
      f.turb.setAttribute('baseFrequency', `0 ${r(0.012, 0.14).toFixed(3)}`);
      f.disp.setAttribute('scale', hit ? String(r(20, 90).toFixed(0)) : '0');
      const g = hit ? r(3, 22) : 0;
      f.a.setAttribute('dx', String(g)); f.a.setAttribute('dy', String(r(-3, 3)));
      f.b.setAttribute('dx', String(-g * r(0.5, 1.2))); f.b.setAttribute('dy', String(r(-3, 3)));
      f.table.setAttribute('tableValues', Array.from({ length: 7 }, () => r(0, 1).toFixed(2)).sort(() => Math.random() - 0.5).join(' '));
      canvas.style.filter = `${base} url(#${GLITCH_ID})`;
      setTimeout(tick, r(55, 130));
    };
    tick();
  };
  // Si el cursor lleva `glitchIdle` ms quieto (y el glitch está permitido), ocurre un glitch; vuelve a ocurrir tras otro tiempo igual quieto
  setInterval(() => {
    if (on && glitchOn && !glitching && P.glitchIdle > 0 && !document.hidden && performance.now() - lastMoveAt > P.glitchIdle) burst();
  }, 400);

  return {
    params: P, apply, resize, clear,
    glitch: (v) => { glitchOn = v; lastMoveAt = performance.now(); },
    restart: (x = sim.w / 2, y = sim.h / 2) => { if (on) start(x, y); },
    enable: (v) => { if (v === on) return; on = v; if (on) { sim.resize(); inside = false; } else { clearTimeout(idleTimer); clear(); } },
  };
}
